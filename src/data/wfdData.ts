export interface WfdItem {
  id: number;
  text: string;
  textZh: string;
  category: 'Campus' | 'Academic' | 'Science' | 'Society';
  trapNote: string;
}

export const WFD_QUESTIONS: WfdItem[] = [
  {
    id: 1,
    text: 'Students must submit their assignments before the deadline on Friday.',
    textZh: '學生必須在週五截止期限前繳交作業。',
    category: 'Campus',
    trapNote: '注意複數 Students / assignments，專有名詞 Friday 大寫。',
  },
  {
    id: 2,
    text: 'The university library holds a wide collection of historical manuscripts.',
    textZh: '大學圖書館館藏豐富的歷史手稿。',
    category: 'Campus',
    trapNote: '第三人稱單數 holds；manuscripts 結尾有 s。',
  },
  {
    id: 3,
    text: 'Undergraduate students may participate in specific stages within the program.',
    textZh: '大學部學生可參與該計畫中的特定階段。',
    category: 'Campus',
    trapNote: 'Undergraduate 不加 s；stages 為複數。',
  },
  {
    id: 4,
    text: 'Climate change is becoming an acceptable phenomenon amongst reputable scientists.',
    textZh: '氣候變遷在知名科學家之間正成為被認可的現象。',
    category: 'Science',
    trapNote: '必考拼字：phenomenon (單數)、acceptable (-able)、scientists。',
  },
  {
    id: 5,
    text: 'Statistical results should be expressed in different ways depending on the circumstances.',
    textZh: '統計結果應視情況以不同方式呈現。',
    category: 'Academic',
    trapNote: '過去分詞 expressed (-ed)；circumstances 複數加 s。',
  },
  {
    id: 6,
    text: 'All students are encouraged to vote in the forthcoming elections.',
    textZh: '鼓勵所有學生在即將到來的選舉中投票。',
    category: 'Campus',
    trapNote: '被動語態 encouraged (-ed)；forthcoming 一個字不拆開；elections 複數。',
  },
  {
    id: 7,
    text: 'Financial help for undergraduate study is available on application.',
    textZh: '大學部就讀的財務補助可透過申請取得。',
    category: 'Campus',
    trapNote: 'available 拼法 (-able)；on application 不加 s。',
  },
  {
    id: 8,
    text: 'The aerial photographs were promptly registered for thorough evaluation.',
    textZh: '空拍照片已迅速登記以進行徹底評估。',
    category: 'Science',
    trapNote: '高難拼字：aerial (空拍)、registered (-ed)、thorough (徹底)。',
  },
  {
    id: 9,
    text: 'Teaching assistants will receive a monthly stipend for housing.',
    textZh: '教學助理將領取每月的住宿津貼。',
    category: 'Campus',
    trapNote: 'receive (ei 順序：i before e except after c)；stipend (津貼)。',
  },
  {
    id: 10,
    text: 'A preliminary bibliography is due the week before the spring break.',
    textZh: '初步參考書目須於春假前一週繳交。',
    category: 'Academic',
    trapNote: '必背學術字：preliminary、bibliography。',
  },
  {
    id: 11,
    text: 'Economic problems caused a big rise in unemployment across the region.',
    textZh: '經濟問題導致該地區失業率大幅上升。',
    category: 'Society',
    trapNote: '過去式 caused；unemployment 不可數不加 s。',
  },
  {
    id: 12,
    text: 'You can contact all your tutors by email during office hours.',
    textZh: '你可以在辦公時間透過電子郵件聯繫所有導師。',
    category: 'Campus',
    trapNote: 'tutors 與 hours 皆為複數。',
  },
  {
    id: 13,
    text: 'Scientists are always asking the government for more money.',
    textZh: '科學家總是向政府爭取更多經費。',
    category: 'Science',
    trapNote: '拼字陷阱：government 中間務必有 n！',
  },
  {
    id: 14,
    text: 'Mutually exclusive events can be described as either complementary or opposite.',
    textZh: '互斥事件可被描述為互補或相反。',
    category: 'Academic',
    trapNote: 'described (-ed)；complementary (互補，中間是 e 不是 i！)。',
  },
  {
    id: 15,
    text: 'Most university teaching takes place in lectures and seminars.',
    textZh: '多數大學教學在講座與研討課中進行。',
    category: 'Campus',
    trapNote: 'teaching 不可數故 takes 加 s；lectures / seminars 複數。',
  },
  {
    id: 16,
    text: 'The massive accumulation of data was converted into a communicable argument.',
    textZh: '龐大的數據累積被轉化為可溝通的論點。',
    category: 'Academic',
    trapNote: '雙 c：accumulation；converted (-ed)；communicable。',
  },
  {
    id: 17,
    text: 'Before submitting your dissertation, your advisor must approve your application.',
    textZh: '在提交學位論文前，你的指導教授必須核准你的申請。',
    category: 'Academic',
    trapNote: 'submitting 雙 t；dissertation 雙 s。',
  },
  {
    id: 18,
    text: 'Supply and demand is one of the most fundamental concepts in economics.',
    textZh: '供需是經濟學中最基礎的概念之一。',
    category: 'Society',
    trapNote: 'one of the most + 複數 concepts；學科名 economics 有 s。',
  },
  {
    id: 19,
    text: 'Participants were initially selected from a range of academic disciplines.',
    textZh: '參與者最初是從多個學術領域中挑選出來。',
    category: 'Academic',
    trapNote: 'initially 雙 l；disciplines (sc 拼法 + 複數 s)。',
  },
  {
    id: 20,
    text: 'Please remember to bring a highlighter and your textbook to class.',
    textZh: '請記得帶螢光筆與課本去上課。',
    category: 'Campus',
    trapNote: 'highlighter 含 gh；textbook 合寫為一字。',
  },
  {
    id: 21,
    text: 'New developments in manufacturing are constantly changing the way we live.',
    textZh: '製造業的新發展正不斷改變我們的生活方式。',
    category: 'Society',
    trapNote: 'developments 複數；manufacturing 去 e 加 ing。',
  },
  {
    id: 22,
    text: 'Our group is meeting tomorrow in the library conference room.',
    textZh: '我們小組明天將在圖書館會議室開會。',
    category: 'Campus',
    trapNote: 'tomorrow 一個 m 兩個 r；conference (-ence)。',
  },
  {
    id: 23,
    text: 'Clinical placements in nursing prepare students for professional practice.',
    textZh: '護理臨床實習讓學生為專業實務做好準備。',
    category: 'Academic',
    trapNote: '主詞 placements 為複數，故動詞 prepare 不加 s。',
  },
  {
    id: 24,
    text: 'Renewable energy sources are becoming increasingly competitive with fossil fuels.',
    textZh: '再生能源與化石燃料相比正變得越來越具競爭力。',
    category: 'Science',
    trapNote: 'sources 與 fuels 複數；competitive 拼法。',
  },
  {
    id: 25,
    text: 'Those seeking a formal extension should contact their faculty in advance.',
    textZh: '欲申請正式延期的學生應提前聯繫系所。',
    trapNote: 'extension (-sion 非 -tion)；in advance 不加 s。',
    category: 'Campus',
  },
  {
    id: 26,
    text: 'Architecture plays an important role in shaping modern urban environments.',
    textZh: '建築在塑造現代都市環境中扮演重要角色。',
    category: 'Society',
    trapNote: 'environments 中間有 n 且結尾加 s；plays 加 s。',
  },
  {
    id: 27,
    text: 'Experiments should be repeated several times to verify the accuracy of results.',
    textZh: '實驗應重複數次以驗證結果的準確性。',
    category: 'Science',
    trapNote: '被動 repeated (-ed)；accuracy 雙 c 單 r。',
  },
  {
    id: 28,
    text: 'Free campus tours run daily during the summer orientation week.',
    textZh: '免費校園導覽在暑期新生週期間每日舉行。',
    category: 'Campus',
    trapNote: 'tours 複數故 run 不加 s；orientation 拼法。',
  },
  {
    id: 29,
    text: 'Public perception about biotechnology is crucial for developing national policy.',
    textZh: '大眾對生物科技的認知對制定國家政策至關重要。',
    category: 'Science',
    trapNote: 'biotechnology 合寫；crucial (-cial)。',
  },
  {
    id: 30,
    text: 'The sociology department is highly regarded across the entire country.',
    textZh: '社會學系在全國享有極高評價。',
    category: 'Academic',
    trapNote: '被動 regarded (-ed) 連音極輕，務必聽出或依文法補上！',
  },
  {
    id: 31,
    text: 'Review all your sources before drawing any definitive conclusions.',
    textZh: '在下任何明確結論之前，請檢視你所有的資料來源。',
    category: 'Academic',
    trapNote: 'sources 與 conclusions 複數；definitive 拼法。',
  },
  {
    id: 32,
    text: 'Affordable housing remains a critical issue for many metropolitan residents.',
    textZh: '可負擔住宅對許多大都會居民而言仍是關鍵議題。',
    category: 'Society',
    trapNote: 'Affordable 雙 f；remains 加 s；residents 複數。',
  },
  {
    id: 33,
    text: 'Extra seminars will be scheduled to assist you with revision.',
    textZh: '將安排額外的研討課協助你複習。',
    category: 'Campus',
    trapNote: '被動 will be scheduled (-ed) 極易漏 d！',
  },
  {
    id: 34,
    text: 'Digital transformation requires continuous investment in software infrastructure.',
    textZh: '數位轉型需要對軟體基礎設施進行持續投資。',
    category: 'Science',
    trapNote: 'requires 加 s；continuous (-ous)；infrastructure。',
  },
  {
    id: 35,
    text: 'Essays with few or no citations will be regarded as invalid.',
    textZh: '幾乎沒有引用文獻的論文將被視為無效。',
    category: 'Academic',
    trapNote: 'Essays / citations 複數；regarded (-ed)。',
  },
  {
    id: 36,
    text: 'Many graduates choose to pursue further research in engineering.',
    textZh: '許多畢業生選擇在工程領域繼續深造研究。',
    category: 'Campus',
    trapNote: 'pursue (u-e)；research 不可數不加 s；engineering 雙 e。',
  },
  {
    id: 37,
    text: 'Good nutrition and regular exercise are essential for mental wellbeing.',
    textZh: '良好營養與規律運動對心理健康至關重要。',
    category: 'Science',
    trapNote: 'essential 雙 s；wellbeing 合寫。',
  },
  {
    id: 38,
    text: 'Students have the option to live in college residences or apartments.',
    textZh: '學生可選擇居住在學院宿舍或校外公寓。',
    category: 'Campus',
    trapNote: 'residences (-ces) 與 apartments 皆複數。',
  },
  {
    id: 39,
    text: 'Effective communication skills are highly valued by contemporary employers.',
    textZh: '有效的溝通技巧深受當代雇主重視。',
    category: 'Society',
    trapNote: 'skills / employers 複數；valued (-ed)；contemporary。',
  },
  {
    id: 40,
    text: 'Please check the university website for the latest timetable updates.',
    textZh: '請查看大學網站以獲取最新課表更新。',
    category: 'Campus',
    trapNote: 'website 與 timetable 皆為單一複合字；updates 複數。',
  },
];

export function buildFirstLetterHint(sentence: string): string {
  return sentence
    .split(/\s+/)
    .map((word) => {
      const clean = word.replace(/[^a-zA-Z]/g, '');
      const punct = word.replace(/[a-zA-Z]/g, '');
      if (!clean) return word;
      return `${clean[0]}${'_'.repeat(Math.max(2, clean.length - 1))}${punct}`;
    })
    .join(' ');
}

export interface WfdDiffToken {
  word: string;
  status: 'hit' | 'miss' | 'extra';
}

export function scoreWfdAttempt(target: string, userInput: string): {
  matchedCount: number;
  totalCount: number;
  percentage: number;
  capitalOk: boolean;
  periodOk: boolean;
  tokens: WfdDiffToken[];
} {
  const trimmed = userInput.trim();
  const capitalOk = trimmed.length > 0 && /^[A-Z]/.test(trimmed);
  const periodOk = trimmed.endsWith('.');

  const normalize = (w: string) => w.replace(/[.,!?;:"']/g, '').toLowerCase();

  const targetWords = target.trim().split(/\s+/);
  const userWords = trimmed ? trimmed.split(/\s+/) : [];

  const remainingUser = userWords.map((w) => ({ raw: w, norm: normalize(w), used: false }));
  const tokens: WfdDiffToken[] = [];
  let matchedCount = 0;

  for (const tw of targetWords) {
    const tNorm = normalize(tw);
    const found = remainingUser.find((u) => !u.used && u.norm === tNorm);
    if (found) {
      found.used = true;
      matchedCount++;
      tokens.push({ word: tw, status: 'hit' });
    } else {
      tokens.push({ word: tw, status: 'miss' });
    }
  }

  for (const u of remainingUser) {
    if (!u.used && u.norm.length > 0) {
      tokens.push({ word: u.raw, status: 'extra' });
    }
  }

  const totalCount = targetWords.length;
  const percentage = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0;

  return {
    matchedCount,
    totalCount,
    percentage,
    capitalOk,
    periodOk,
    tokens,
  };
}
