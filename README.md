# PTE 60 Studio (`sgd-memory` v2.0)

專為澳洲技術移民（Subclass 189 / 190 / 491 — Competent English 新制門檻 **L47 / R48 / W51 / S54**，目標穩拿 **55–60 分**）打造的 PTE Academic 高投報間隔重複記憶與實戰系統。

完整保留原版 `sgd-memory` 全部 **41 題 SGD 小組討論 AI 記憶圖片、123 段三位講者 MP3 音檔與本地 `sgd-memory-cards` 複習進度相容**，並依 2025/8/7 培生新制供分矩陣全面擴充。

## 核心模組

1. **今日任務與四科安全線雷達 (`MissionDashboard`)**：依新制供分權重自動排程每日 60–90 分鐘任務佇列、過去 14 天 SM-2 熱度圖、未來 7 天到期預報與 JSON 跨裝置備份匯入/匯出。
2. **WFD 聽寫記憶艙 (`WfdLab`)**：支援「考場盲聽打字（逐字差異比對＋首字大寫/句尾句號檢核）」、「首字母速記法」與「通勤閃卡模式」。
3. **口說實戰艙 (`SpeakingLab`)**：
   - `SGD`：原版 41 題圖音記憶卡 ＋ 2026 防人工審核 90 秒串聯骨架 ＋ 10s準備/120s麥克風錄音回放。
   - `RS`：前半 50%–60% 意群減負法練習 ＋ 15s 即時錄音自測。
   - `RTS`：2025/8 新增情境題第一人稱 3 步結構 ＋ 10s準備/40s錄音。
   - `DI`：動態 SVG 圖表視覺化 ＋ 防雙審真實數據 4 句骨架 ＋ 25s準備/40s錄音。
   - `RA`：`/` 意群換氣斜線標記 ＋ 35s準備/40s錄音。
4. **讀寫保分艙 (`ReadWriteLab`)**：
   - `FIB`：閱讀雙填空（佔閱讀 60%）黃金學術固定搭配閃卡與四選一測驗。
   - `SWT / SST / WE 寫作沙盒`：內建倒數計時器與即時 5 關防呆檢核（字數區間、SWT 唯一句號鐵律、首字大寫、主題關鍵詞命中防 `Content=0`、高頻拼寫陷阱掃描）。
5. **22 題斷捨離戰略＆8 週工程師課表 (`StrategyBlueprint`)**。

## 開發與部署

```bash
# 安裝套件
npm install

# 本地啟動開發伺服器
npm run dev

# 編譯正式版產物至 dist/
npm run build

# 一鍵發佈至 GitHub Pages (gh-pages 分支)
npm run deploy
```

此外專案已內建 `.github/workflows/deploy.yml`，推送 `main` 分支至 GitHub 後可自動編譯並更新 `gh-pages`。
