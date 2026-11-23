export interface FibItem {
  id: number;
  collocation: string;
  collocationZh: string;
  signalType: '固定介系詞搭配' | '學術動賓搭配' | '形容詞+名詞搭配' | '邏輯轉折詞性';
  sentenceBefore: string;
  sentenceAfter: string;
  answer: string;
  options: [string, string, string, string];
  explanation: string;
}

export const FIB_ITEMS: FibItem[] = [
  {
    id: 1,
    collocation: 'play a pivotal role in',
    collocationZh: '在⋯扮演關鍵樞紐角色',
    signalType: '形容詞+名詞搭配',
    sentenceBefore: 'Microorganisms play a ',
    sentenceAfter: ' role in maintaining soil fertility and nutrient cycling.',
    answer: 'pivotal',
    options: ['pivotal', 'reluctant', 'fragile', 'redundant'],
    explanation: 'play a pivotal / crucial / vital role in 為 PTE 閱讀最高頻搭配；reluctant (勉強)、redundant (多餘) 語意不符。',
  },
  {
    id: 2,
    collocation: 'be attributed to',
    collocationZh: '歸因於⋯',
    signalType: '固定介系詞搭配',
    sentenceBefore: 'The rapid decline in commuter traffic was largely ',
    sentenceAfter: ' to the expansion of flexible remote work policies.',
    answer: 'attributed',
    options: ['attributed', 'distributed', 'contributed', 'prohibited'],
    explanation: '看到被動 was ... to 表「歸因於」，秒選 attributed to！(contributed to 主動用法不加 was)。',
  },
  {
    id: 3,
    collocation: 'empirical evidence',
    collocationZh: '實證證據',
    signalType: '形容詞+名詞搭配',
    sentenceBefore: 'Researchers gathered extensive ',
    sentenceAfter: ' evidence before proposing a revision to the clinical guidelines.',
    answer: 'empirical',
    options: ['empirical', 'ambiguous', 'superficial', 'arbitrary'],
    explanation: 'empirical evidence (實證研究證據) 為學術文章必背黃金詞組。',
  },
  {
    id: 4,
    collocation: 'impose restrictions on',
    collocationZh: '對⋯實施限制',
    signalType: '學術動賓搭配',
    sentenceBefore: 'Local authorities decided to ',
    sentenceAfter: ' strict restrictions on heavy vehicles entering the historic center.',
    answer: 'impose',
    options: ['impose', 'compose', 'expose', 'dispose'],
    explanation: 'impose restrictions / taxes / bans on (強制實施限制/稅收/禁令) 固定搭配。',
  },
  {
    id: 5,
    collocation: 'shed light on',
    collocationZh: '闡明／釐清⋯',
    signalType: '學術動賓搭配',
    sentenceBefore: 'Newly discovered archaeological artifacts ',
    sentenceAfter: ' light on how ancient maritime trade networks operated.',
    answer: 'shed',
    options: ['shed', 'spread', 'spilled', 'dropped'],
    explanation: 'shed light on 為固定成語，意為「使某問題變得清晰易懂」。',
  },
  {
    id: 6,
    collocation: 'stem from',
    collocationZh: '源自於⋯',
    signalType: '固定介系詞搭配',
    sentenceBefore: 'Many software security vulnerabilities ',
    sentenceAfter: ' from improper input validation and outdated dependencies.',
    answer: 'stem',
    options: ['stem', 'rely', 'trigger', 'account'],
    explanation: '空格後接 from 且主詞為複數，stem from / arise from = 源自於。(rely 接 on，account 接 for)。',
  },
  {
    id: 7,
    collocation: 'adverse effects on',
    collocationZh: '對⋯產生負面影響',
    signalType: '形容詞+名詞搭配',
    sentenceBefore: 'Prolonged exposure to industrial noise can have ',
    sentenceAfter: ' effects on cardiovascular health and sleep quality.',
    answer: 'adverse',
    options: ['adverse', 'diverse', 'reverse', 'lucrative'],
    explanation: 'have adverse / detrimental effects on = 對⋯造成不良負面影響。別跟 diverse (多元的) 搞混！',
  },
  {
    id: 8,
    collocation: 'mutually exclusive',
    collocationZh: '彼此互斥的',
    signalType: '邏輯轉折詞性',
    sentenceBefore: 'Economic growth and environmental protection should not be viewed as ',
    sentenceAfter: ' exclusive goals.',
    answer: 'mutually',
    options: ['mutually', 'virtually', 'casually', 'partially'],
    explanation: 'mutually exclusive (互斥的，同時也是 WFD 高頻詞組！) 副詞修飾形容詞 exclusive。',
  },
  {
    id: 9,
    collocation: 'comply with regulations',
    collocationZh: '遵守法規',
    signalType: '固定介系詞搭配',
    sentenceBefore: 'All financial institutions must strictly ',
    sentenceAfter: ' with international data privacy regulations.',
    answer: 'comply',
    options: ['comply', 'apply', 'supply', 'imply'],
    explanation: '助動詞 must 後接原形動詞，且後接介系詞 with，comply with = 遵守。',
  },
  {
    id: 10,
    collocation: 'reach a consensus',
    collocationZh: '達成共識',
    signalType: '學術動賓搭配',
    sentenceBefore: 'After three days of intense negotiation, the committee finally reached a ',
    sentenceAfter: ' on carbon emission targets.',
    answer: 'consensus',
    options: ['consensus', 'census', 'consequence', 'controversy'],
    explanation: 'reach a consensus on = 對⋯達成共識；注意別選成 census (人口普查)！',
  },
  {
    id: 11,
    collocation: 'viable alternative',
    collocationZh: '可行的替代方案',
    signalType: '形容詞+名詞搭配',
    sentenceBefore: 'Hydrogen fuel cells are increasingly considered a ',
    sentenceAfter: ' alternative for long-haul freight transport.',
    answer: 'viable',
    options: ['viable', 'vulnerable', 'volatile', 'vague'],
    explanation: 'a viable alternative (切實可行的替代方案)；volatile 為波動劇烈的，vulnerable 為脆弱的。',
  },
  {
    id: 12,
    collocation: 'be susceptible to',
    collocationZh: '容易受到⋯影響／感染',
    signalType: '固定介系詞搭配',
    sentenceBefore: 'Coastal wetlands are particularly ',
    sentenceAfter: ' to rising sea levels and seasonal storm surges.',
    answer: 'susceptible',
    options: ['susceptible', 'compatible', 'skeptical', 'capable'],
    explanation: 'be susceptible / vulnerable to = 易受⋯侵害。(compatible 接 with，capable 接 of)。',
  },
  {
    id: 13,
    collocation: 'undergo dramatic transformation',
    collocationZh: '經歷劇烈轉型',
    signalType: '學術動賓搭配',
    sentenceBefore: 'Retail banking has ',
    sentenceAfter: ' a dramatic transformation since the widespread adoption of mobile payments.',
    answer: 'undergone',
    options: ['undergone', 'undertaken', 'overcome', 'withdrawn'],
    explanation: 'has + 過去分詞：undergo a transformation / change (經歷轉變)。undertake 則是「承擔任務/研究」。',
  },
  {
    id: 14,
    collocation: 'account for',
    collocationZh: '佔（比例）／解釋說明',
    signalType: '固定介系詞搭配',
    sentenceBefore: 'Small and medium enterprises ',
    sentenceAfter: ' for nearly sixty percent of private-sector employment.',
    answer: 'account',
    options: ['account', 'amount', 'consist', 'occupy'],
    explanation: '後接 for + 百分比，必選 account for！(amount 接 to，consist 接 of，occupy 不加介系詞)。',
  },
  {
    id: 15,
    collocation: 'bridge the gap between',
    collocationZh: '縮短／彌合⋯之間的落差',
    signalType: '學術動賓搭配',
    sentenceBefore: 'Industry internships are designed to ',
    sentenceAfter: ' the gap between academic theory and workplace practice.',
    answer: 'bridge',
    options: ['bridge', 'merge', 'expand', 'split'],
    explanation: 'bridge / narrow the gap between A and B 為極高頻閱讀與寫作雙用片語。',
  },
  {
    id: 16,
    collocation: 'integral part of',
    collocationZh: '不可或缺的一部分',
    signalType: '形容詞+名詞搭配',
    sentenceBefore: 'Peer code review has become an ',
    sentenceAfter: ' part of modern agile software development workflows.',
    answer: 'integral',
    options: ['integral', 'optional', 'trivial', 'obscure'],
    explanation: '冠詞 an 提示母音開頭，且 an integral part of = 不可或缺的組成部分。',
  },
  {
    id: 17,
    collocation: 'allocate resources to',
    collocationZh: '分配資源給⋯',
    signalType: '學術動賓搭配',
    sentenceBefore: 'Public hospitals must carefully ',
    sentenceAfter: ' limited medical resources to emergency departments.',
    answer: 'allocate',
    options: ['allocate', 'relocate', 'advocate', 'cultivate'],
    explanation: 'allocate resources / funds / time to = 分配資源或經費。',
  },
  {
    id: 18,
    collocation: 'exacerbate the problem',
    collocationZh: '使問題惡化／雪上加霜',
    signalType: '學術動賓搭配',
    sentenceBefore: 'Prolonged drought conditions have further ',
    sentenceAfter: ' water scarcity across agricultural regions.',
    answer: 'exacerbated',
    options: ['exacerbated', 'alleviated', 'facilitated', 'illuminated'],
    explanation: '語境 prolonged drought (長期乾旱) 對缺水是惡化：exacerbate (加劇)；alleviate 則是緩解。',
  },
  {
    id: 19,
    collocation: 'preliminary findings',
    collocationZh: '初步研究結果',
    signalType: '形容詞+名詞搭配',
    sentenceBefore: 'Although the ',
    sentenceAfter: ' findings look promising, larger clinical trials are still required.',
    answer: 'preliminary',
    options: ['preliminary', 'permanent', 'mandatory', 'subsequent'],
    explanation: '後句說「仍需更大規模試驗」，可見目前只是 preliminary findings (初步結果)。',
  },
  {
    id: 20,
    collocation: 'have profound implications for',
    collocationZh: '對⋯具有深遠影響',
    signalType: '固定介系詞搭配',
    sentenceBefore: 'Advances in generative artificial intelligence have profound ',
    sentenceAfter: ' for intellectual property law.',
    answer: 'implications',
    options: ['implications', 'applications', 'complications', 'obligations'],
    explanation: 'have profound implications for = 對⋯產生深遠影響與意涵（後接 for 是秒殺訊號！）。',
  },
];

export interface WritingPrompt {
  id: string;
  type: 'SWT' | 'SST' | 'WE';
  title: string;
  timeMinutes: number;
  minWords: number;
  maxWords: number;
  sweetSpot: string;
  sourceTextOrTranscript: string;
  keywords: string[];
  scaffoldGuide: string;
  sampleHighScore: string;
}

export const WRITING_PROMPTS: WritingPrompt[] = [
  {
    id: 'swt-1',
    type: 'SWT',
    title: 'SWT 摘要寫作 #1：遠距辦公與都市結構轉變',
    timeMinutes: 10,
    minWords: 5,
    maxWords: 75,
    sweetSpot: '45–65 字（嚴格只能 1 個句號！）',
    sourceTextOrTranscript:
      'Over the past decade, high-speed broadband and collaborative cloud software have allowed millions of knowledge workers to perform their duties outside traditional downtown offices. As a result, central business districts have experienced lower weekday foot traffic, prompting city councils to rethink commercial zoning and convert vacant office floors into mixed-use residential spaces. At the same time, suburban neighborhoods have seen a surge in local cafés, coworking hubs, and daytime community activity, although transportation planners warn that decentralized travel patterns require more flexible bus routes rather than peak-hour rail alone.',
    keywords: ['remote', 'workers', 'central', 'suburban', 'transportation', 'office'],
    scaffoldGuide:
      '安全結構：[主句改寫第一段核心因果], while [子句串聯郊區變化], and therefore [結尾政策或規劃影響].（全程只用逗號與連接詞，結尾唯一一個句號！）',
    sampleHighScore:
      'Broadband connectivity and cloud software have enabled knowledge workers to work outside downtown offices, prompting cities to convert vacant commercial spaces into housing, while suburban neighborhoods experience increased local business activity that requires more flexible public transportation planning.',
  },
  {
    id: 'swt-2',
    type: 'SWT',
    title: 'SWT 摘要寫作 #2：都市垂直農場的優勢與挑戰',
    timeMinutes: 10,
    minWords: 5,
    maxWords: 75,
    sweetSpot: '45–65 字（嚴格只能 1 個句號！）',
    sourceTextOrTranscript:
      'Vertical farming grows crops in stacked indoor layers using controlled LED lighting and hydroponic nutrient systems instead of conventional farmland. Because indoor facilities recycle up to ninety percent of water and sit close to urban supermarkets, they dramatically reduce agricultural runoff and long-distance food transport emissions. Nevertheless, critics point out that the high electricity demand of artificial lighting limits commercial vertical farms mainly to fast-growing leafy greens rather than staple grain crops such as wheat or rice.',
    keywords: ['vertical', 'farming', 'water', 'emissions', 'electricity', 'crops'],
    scaffoldGuide:
      '安全結構：Vertical farming [核心機制與優點], whereas [轉折指出限制條件].（避免照抄整行超過 8 個連續字，換 2 個同義動詞更穩！）',
    sampleHighScore:
      'Vertical farming utilizes indoor hydroponic layers to conserve water and reduce food transport emissions near cities, whereas high electricity consumption from artificial lighting currently restricts production mainly to leafy greens rather than staple grain crops.',
  },
  {
    id: 'sst-1',
    type: 'SST',
    title: 'SST 聽力摘要 #1：雙語學習對大腦認知的影響（點擊播放演講音檔）',
    timeMinutes: 10,
    minWords: 50,
    maxWords: 70,
    sweetSpot: '55–66 字（低於50字或高於70字 Form 直接 0 分！）',
    sourceTextOrTranscript:
      'Today we are examining how speaking two languages shapes cognitive aging. For many years, educators worried that raising children bilingually might confuse vocabulary development. However, modern neuroimaging studies demonstrate the opposite. Because bilingual speakers constantly switch between two active language systems, their prefrontal cortex develops stronger executive control. Consequently, lifelong bilingual adults show greater attention focus and typically experience symptoms of age-related memory decline several years later than monolingual peers.',
    keywords: ['bilingual', 'cognitive', 'language', 'brain', 'executive', 'memory'],
    scaffoldGuide:
      '3–4 句真實語意骨架（55–65字）：\n1. The lecture examines how [核心主題].\n2. Contrary to earlier concerns, neuroimaging studies show that [機制原因].\n3. Consequently, [最終結論與影響].',
    sampleHighScore:
      'The lecture examines how speaking two languages positively influences cognitive health and aging. Although educators previously worried about vocabulary confusion, modern neuroimaging studies demonstrate that switching between active language systems strengthens executive control in the prefrontal cortex. Consequently, lifelong bilingual adults maintain stronger attention focus and delay age-related memory decline.',
  },
  {
    id: 'we-1',
    type: 'WE',
    title: 'WE 大作文 #1：AI 自動化工具對專業人員的影響',
    timeMinutes: 20,
    minWords: 200,
    maxWords: 300,
    sweetSpot: '220–265 字（分 4 段，緊扣題目關鍵字，零拼寫錯誤！）',
    sourceTextOrTranscript:
      'Artificial intelligence tools are increasingly automating routine tasks in professions such as software development, accounting, and design. To what extent do the benefits of workplace automation outweigh its potential drawbacks? Support your point of view with reasons and examples.',
    keywords: ['artificial', 'intelligence', 'automation', 'workplace', 'software', 'productivity', 'skills'],
    scaffoldGuide:
      '防雙審自然四段骨架（每段填入題目真實案例，絕不背萬用無關空話）：\n• 第1段 (40–50字)：改寫題目背景 + 明確表態 (benefits largely outweigh drawbacks provided workers adapt).\n• 第2段 (65–80字)：核心優點 + 軟體開發真實舉例 (e.g., automated testing & code generation boost productivity and reduce human error).\n• 第3段 (65–80字)：讓步承認潛在挑戰 + 解法 (entry-level displacement requires continuous upskilling in architecture and critical thinking).\n• 第4段 (35–45字)：In conclusion 總結重申核心立場。',
    sampleHighScore:
      'Artificial intelligence and workplace automation are rapidly transforming modern professions, ranging from accounting and graphic design to software development. While concerns regarding job displacement are understandable, I firmly believe that the productivity and quality benefits of automation outweigh its drawbacks when supported by continuous professional training.\n\nFirst and foremost, intelligent automation eliminates repetitive manual tasks and allows specialists to focus on creative problem-solving. In software engineering, for instance, automated code analysis and testing tools detect security bugs within seconds rather than days. Instead of replacing engineers, these tools free developers to concentrate on system architecture, user experience, and business logic, ultimately accelerating innovation across industries.\n\nAdmittedly, rapid automation presents transitional challenges, particularly for junior employees who traditionally learned their craft through routine assignments. Over-reliance on automated outputs without human verification can also introduce subtle errors into critical workflows. Nevertheless, organizations can mitigate these risks by redesigning training programs to emphasize critical review, ethical judgment, and cross-functional communication.\n\nIn conclusion, although workplace automation alters traditional entry-level roles, its capacity to enhance efficiency, accuracy, and high-level innovation brings substantial long-term value. By investing in continuous skill development, professionals and businesses can harness artificial intelligence responsibly and effectively.',
  },
];

const COMMON_SPELLING_TRAPS: Record<string, string> = {
  recieve: 'receive',
  definately: 'definitely',
  goverment: 'government',
  enviroment: 'environment',
  accomodation: 'accommodation',
  occured: 'occurred',
  seperate: 'separate',
  untill: 'until',
  wich: 'which',
  becuase: 'because',
  therfore: 'therefore',
  knowlege: 'knowledge',
  developement: 'development',
  neccessary: 'necessary',
  collegue: 'colleague',
};

export interface WritingLintReport {
  wordCount: number;
  sentenceCount: number;
  formPassed: boolean;
  checks: Array<{ label: string; ok: boolean; detail: string }>;
  typosFound: Array<{ wrong: string; right: string }>;
  keywordHits: string[];
}

export function lintWritingResponse(prompt: WritingPrompt, text: string): WritingLintReport {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  // Sentence counting via terminal punctuation (. ! ?)
  const sentenceMatches = trimmed.match(/[.!?]+(\s|$)/g);
  const sentenceCount = sentenceMatches ? sentenceMatches.length : 0;

  const checks: Array<{ label: string; ok: boolean; detail: string }> = [];

  // 1. Word count gate
  const wordOk = wordCount >= prompt.minWords && wordCount <= prompt.maxWords;
  checks.push({
    label: `字數門檻 (${prompt.minWords}–${prompt.maxWords} 字)`,
    ok: wordOk,
    detail: `目前 ${wordCount} 字（黃金區間：${prompt.sweetSpot}）`,
  });

  // 2. Task-specific structural gate
  if (prompt.type === 'SWT') {
    const oneSentenceOk = sentenceCount === 1 && trimmed.endsWith('.') && !trimmed.includes('\n');
    checks.push({
      label: 'SWT 單句鐵律（唯一句號且不換行）',
      ok: oneSentenceOk,
      detail:
        sentenceCount === 1 && trimmed.endsWith('.')
          ? '完美！全文僅 1 個完整句且句尾有句號'
          : `偵測到 ${sentenceCount} 個句末標點（SWT 出現 2 個句號或忘記句號會直接 Form = 0 分！）`,
    });
  } else if (prompt.type === 'SST') {
    const sstSentOk = sentenceCount >= 2 && sentenceCount <= 5;
    checks.push({
      label: 'SST 句數結構 (建議 3–4 句)',
      ok: sstSentOk,
      detail: `目前 ${sentenceCount} 個完整句`,
    });
  } else {
    const paragraphs = trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const paraOk = paragraphs.length >= 3 && paragraphs.length <= 5;
    checks.push({
      label: 'WE 段落結構 (建議 4 段式空行分隔)',
      ok: paraOk,
      detail: `目前 ${paragraphs.length} 個段落`,
    });
  }

  // 3. Capitalization check
  const capOk = trimmed.length > 0 && /^[A-Z]/.test(trimmed);
  checks.push({
    label: '首字母大寫與格式',
    ok: capOk,
    detail: capOk ? '開頭大寫正確' : '開頭第一個字母必須大寫',
  });

  // 4. Topic relevance check (Human double-review Content gate)
  const lower = trimmed.toLowerCase();
  const keywordHits = prompt.keywords.filter((kw) => lower.includes(kw.toLowerCase()));
  const relevanceOk = keywordHits.length >= Math.min(3, prompt.keywords.length);
  checks.push({
    label: '新制雙審主題關聯詞 (防 Content=0)',
    ok: relevanceOk,
    detail: `已命中 ${keywordHits.length}/${prompt.keywords.length} 個核心詞 (${keywordHits.join(', ') || '尚未命中'})`,
  });

  // 5. Common PTE typo check
  const typosFound: Array<{ wrong: string; right: string }> = [];
  for (const w of words) {
    const clean = w.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (COMMON_SPELLING_TRAPS[clean]) {
      if (!typosFound.some((t) => t.wrong === clean)) {
        typosFound.push({ wrong: clean, right: COMMON_SPELLING_TRAPS[clean] });
      }
    }
  }

  checks.push({
    label: '常見高頻拼字陷阱掃描',
    ok: typosFound.length === 0,
    detail:
      typosFound.length === 0
        ? '未發現常見拼寫陷阱錯誤'
        : `請修正：${typosFound.map((t) => `${t.wrong} → ${t.right}`).join('；')}`,
  });

  const formPassed = checks.every((c) => c.ok);

  return {
    wordCount,
    sentenceCount,
    formPassed,
    checks,
    typosFound,
    keywordHits,
  };
}
