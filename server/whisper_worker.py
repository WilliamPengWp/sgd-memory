#!/usr/bin/env python3
"""Persistent faster-whisper neural STT + acoustic word-timestamp worker for PTE 60."""

import json
import os
import subprocess
import tempfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import numpy as np
from faster_whisper import WhisperModel

PORT = int(os.environ.get("WHISPER_PORT", "8795"))
CACHE_DIR = os.environ.get("WHISPER_CACHE_DIR", "/var/lib/pte-quest/whisper-cache")
MODEL_NAME = os.environ.get("WHISPER_MODEL", "base.en")

os.makedirs(CACHE_DIR, exist_ok=True)
print(f"[whisper-worker] Loading {MODEL_NAME} (int8) into {CACHE_DIR}...", flush=True)
MODEL = WhisperModel(
    MODEL_NAME,
    device="cpu",
    compute_type="int8",
    cpu_threads=2,
    download_root=CACHE_DIR,
)
print(f"[whisper-worker] Ready on http://127.0.0.1:{PORT}", flush=True)


def transcribe_audio_bytes(raw_bytes: bytes) -> dict:
    with tempfile.TemporaryDirectory(prefix="pte_audio_") as tmpdir:
        in_path = os.path.join(tmpdir, "input_audio")
        with open(in_path, "wb") as f:
            f.write(raw_bytes)

        # Decode any mobile/desktop codec (Android Edge webm/opus, iOS mp4/aac, ogg) -> raw 16kHz mono PCM
        ff = subprocess.run(
            [
                "ffmpeg",
                "-nostdin",
                "-y",
                "-i",
                in_path,
                "-f",
                "s16le",
                "-acodec",
                "pcm_s16le",
                "-ac",
                "1",
                "-ar",
                "16000",
                "-vn",
                "-",
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=20,
        )
        if ff.returncode != 0 or len(ff.stdout) < 320:
            raise RuntimeError(f"ffmpeg decode failed: {ff.stderr.decode('utf-8', 'ignore')[-200:]}")

        audio_np = np.frombuffer(ff.stdout, dtype=np.int16).astype(np.float32) / 32768.0
        audio_dur = round(len(audio_np) / 16000.0, 2)

        segments, _info = MODEL.transcribe(
            audio_np,
            language="en",
            beam_size=1,
            word_timestamps=True,
            vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 600},
        )

        words = []
        text_parts = []
        for seg in segments:
            if seg.text:
                text_parts.append(seg.text.strip())
            for w in seg.words or []:
                token = (w.word or "").strip()
                if token:
                    words.append(
                        {
                            "word": token,
                            "start": round(float(w.start), 2),
                            "end": round(float(w.end), 2),
                            "prob": round(float(w.probability), 3),
                        }
                    )

        transcript = " ".join(text_parts).strip()

        if not words:
            return {
                "transcript": transcript,
                "wordCount": 0,
                "audioDurationSec": audio_dur,
                "speechDurationSec": 0.0,
                "wpm": 0,
                "longPauses": 0,
                "avgWordProb": 0.0,
                "lowClarityWords": [],
            }

        speech_dur = max(1.2, round(words[-1]["end"] - words[0]["start"], 2))
        wpm = round(len(words) / (speech_dur / 60.0))

        long_pauses = 0
        for i in range(1, len(words)):
            gap = words[i]["start"] - words[i - 1]["end"]
            if gap >= 1.15:
                long_pauses += 1

        avg_prob = round(sum(w["prob"] for w in words) / len(words), 3)
        low_clarity = []
        for w in words:
            clean = "".join(ch for ch in w["word"] if ch.isalpha() or ch == "'")
            if (
                len(clean) >= 3
                and w["prob"] < 0.68
                and clean.lower() not in [x.lower() for x in low_clarity]
            ):
                low_clarity.append(clean)

        return {
            "transcript": transcript,
            "wordCount": len(words),
            "audioDurationSec": audio_dur,
            "speechDurationSec": speech_dur,
            "wpm": wpm,
            "longPauses": long_pauses,
            "avgWordProb": avg_prob,
            "lowClarityWords": low_clarity[:8],
        }


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        return

    def do_GET(self):
        if self.path == "/health":
            body = json.dumps({"ok": True, "model": MODEL_NAME}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body)
            return
        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        if self.path != "/transcribe":
            self.send_response(404)
            self.end_headers()
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 25 * 1024 * 1024:
                raise ValueError("Invalid audio payload size")
            raw = self.rfile.read(length)
            result = transcribe_audio_bytes(raw)
            body = json.dumps({"ok": True, **result}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            body = json.dumps({"ok": False, "error": str(e)}).encode("utf-8")
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body)


if __name__ == "__main__":
    srv = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    srv.serve_forever()
