export interface RoleplayTurnScript {
  npcLine: string;
  npcLineZh: string;
  missionGoalZh: string;
  rescueChips: [string, string, string]; // 3 clickable / speakable starter ideas if user blanks out!
  expectedKeywords: string[];
}

export interface RoleplayScenario {
  id: string;
  examCode: string;
  title: string;
  subtitle: string;
  avatarEmoji: string;
  npcName: string;
  npcRole: string;
  vibeTag: string;
  accent: 'en-AU' | 'en-GB' | 'en-US';
  xpReward: number;
  contextZh: string;
  turns: [RoleplayTurnScript, RoleplayTurnScript, RoleplayTurnScript];
}

export const ROLEPLAY_SCENARIOS: RoleplayScenario[] = [
  {
    id: 'fridge-thief',
    examCode: 'RTS #328 真題預測改編',
    title: '合租公寓：冰箱貼名和牛便當失蹤案',
    subtitle: '把枯燥的 RTS 變成跟澳洲室友過招！既要守住底線又不能撕破臉',
    avatarEmoji: '🏄‍♂️',
    npcName: 'Liam (雪梨衝浪系室友)',
    npcRole: '合租公寓室友 · 半正式溝通語氣',
    vibeTag: '爆笑日常 · 高頻真題',
    accent: 'en-AU',
    xpReward: 65,
    contextZh:
      '你昨晚辛苦煮好貼了名字便條紙的便當，下班回家打開冰箱發現只剩空盒！室友 Liam 正坐在客廳看球賽。請開口跟他溝通。',
    turns: [
      {
        npcLine:
          "Hey mate! Welcome home! Oh... why are you staring at the fridge like someone stole your laptop?",
        npcLineZh: '嘿兄弟！歡迎回家！喔⋯你幹嘛盯著冰箱看，好像誰偷了你筆電一樣？',
        missionGoalZh: '第 1 回合：點出你貼了名字的便當不見了，並詢問他有沒有看到或誤吃',
        rescueChips: [
          'Hey Liam, I noticed my labeled lunchbox in the fridge is completely empty.',
          'Did you happen to eat the pasta container with my name sticker on it?',
          'I cooked that meal last night for dinner tonight, so I am really hungry right now.',
        ],
        expectedKeywords: ['fridge', 'name', 'food', 'lunch', 'eat', 'empty', 'dinner', 'container'],
      },
      {
        npcLine:
          "Ohhh shoot, was that YOURS?! Mate, I came back starving after surfing at Bondi and didn't see the sticky note! What can I do to make it up to you tonight?",
        npcLineZh: '噢完蛋，那是你的喔？！兄弟我去邦代衝浪回來餓昏了沒看到便條紙！今晚我該怎麼補償你？',
        missionGoalZh: '第 2 回合：接受道歉但提出具體補償方案（例如請他點外送或買食材補回來），並約定以後冰箱分層規則',
        rescueChips: [
          'Thanks for being honest—could you order Uber Eats for me tonight since it is late?',
          'Let us split the fridge shelves clearly so we do not mix up our groceries again.',
          'Please check the name labels next time before grabbing anything from the top shelf.',
        ],
        expectedKeywords: ['order', 'tonight', 'shelf', 'label', 'next', 'time', 'buy', 'replace', 'dinner'],
      },
      {
        npcLine:
          "Fair call! Thai takeaway is on me tonight—I'm ordering right now, and I'll stick exclusively to the bottom shelf from tomorrow. Deal?",
        npcLineZh: '非常合理！今晚泰式外送算我的，我現在馬上點，明天起我只放最下層。成交嗎？',
        missionGoalZh: '第 3 回合：友善收尾確認外送餐點，完美達成溝通目標（拿滿 RTS Content 6/6！）',
        rescueChips: [
          'Deal! Pad Thai sounds awesome, thanks for sorting this out so quickly.',
          'That works perfectly for me, appreciate you ordering dinner right away.',
          'Sounds great Liam, keeping separate shelves will make flatting much easier for both of us!',
        ],
        expectedKeywords: ['deal', 'thanks', 'sounds', 'great', 'perfect', 'appreciate', 'shelf'],
      },
    ],
  },
  {
    id: 'midnight-rockband',
    examCode: 'RTS #334 真題預測改編',
    title: '凌晨一點半：隔壁室友練團 vs 明早演算法期末考',
    subtitle: '練習禮貌但堅定的澳洲公寓交涉術',
    avatarEmoji: '🎸',
    npcName: 'Chloe (墨爾本設計系鄰居)',
    npcRole: '隔壁公寓鄰居 · 禮貌堅定語氣',
    vibeTag: '高壓衝突 · 必練句型',
    accent: 'en-AU',
    xpReward: 65,
    contextZh:
      '現在是凌晨 1:30，隔壁 Chloe 跟朋友還在放重低音音樂，但你早上 8:30 有決定畢業的演算法期末考！',
    turns: [
      {
        npcLine:
          "Oh, hi! Sorry, I didn't hear you knocking over the speakers! Everything alright next door?",
        npcLineZh: '噢嗨！抱歉喇叭太大聲沒聽到你敲門！隔壁一切還好嗎？',
        missionGoalZh: '第 1 回合：友善打招呼，說明牆壁隔音薄且你明早八點半有重要期末考，請求調低音量',
        rescueChips: [
          'Hi Chloe, sorry to bother you late at night, but the bass is coming straight through my wall.',
          'I have a crucial final exam at eight-thirty tomorrow morning and really need some sleep.',
          'Would you mind turning the speakers down or switching to headphones for tonight?',
        ],
        expectedKeywords: ['exam', 'tomorrow', 'morning', 'sleep', 'volume', 'music', 'quiet', 'down'],
      },
      {
        npcLine:
          "Oh no, I totally lost track of time! We're just finishing a birthday celebration. Would it be okay if we turn the bass off and wrap up in fifteen minutes?",
        npcLineZh: '天啊我完全忘了時間！我們正在慶生收尾，如果我先把重低音關掉、15 分鐘內散場可以嗎？',
        missionGoalZh: '第 2 回合：展現風度祝生快，同意關掉重低音並確認 15 分鐘後保持安靜',
        rescueChips: [
          'Happy birthday! Turning off the bass right now and wrapping up in fifteen minutes works for me.',
          'I really appreciate your understanding—as long as it is quiet by quarter to two, I will be fine.',
          'Thank you so much, good luck with the rest of your party and see you after my exam!',
        ],
        expectedKeywords: ['fifteen', 'minutes', 'bass', 'thank', 'appreciate', 'quiet', 'fine'],
      },
      {
        npcLine:
          "Done! Bass is off right now and everyone's heading out at 1:45. Smash that exam tomorrow morning!",
        npcLineZh: '沒問題！重低音現在關了，大家 1:45 準時離開。祝你明早考試大殺四方！',
        missionGoalZh: '第 3 回合：簡短致謝收尾，建立流暢道地語感',
        rescueChips: [
          'Thanks heaps Chloe, have a good night!',
          'Appreciate it a lot—good night and catch you later this week!',
          'Thank you for helping me out, have a lovely night!',
        ],
        expectedKeywords: ['thanks', 'night', 'appreciate', 'good'],
      },
    ],
  },
  {
    id: 'prof-extension',
    examCode: 'RTS #335 / #323 真題預測',
    title: '教授辦公室：硬碟崩潰求延交分散式系統報告',
    subtitle: '正式學術語氣 (Formal Academic Register) 滿分訓練',
    avatarEmoji: '👨‍🏫',
    npcName: 'Prof. Vance (資工系指導教授)',
    npcRole: '大學教授 · 正式學術禮貌語氣（忌用 Hey teacher!）',
    vibeTag: '學術高分 · 雙審必考',
    accent: 'en-GB',
    xpReward: 75,
    contextZh:
      '距離期末專案報告截止剩 48 小時，你的 SSD 突然損毀，學校 IT 中心正在協助救援。你已有雲端架構草稿與 IT 報修單。',
    turns: [
      {
        npcLine:
          'Good afternoon. Come in—you mentioned in your email that you had an urgent issue regarding Friday’s distributed systems paper?',
        npcLineZh: '午安，請進。你在信裡提到關於週五分散式系統報告有個緊急狀況？',
        missionGoalZh: '第 1 回合：用正式稱呼 (Professor Vance)，說明筆電硬碟故障，並請求延期三天',
        rescueChips: [
          'Good afternoon Professor Vance, thank you for making time to see me today.',
          'Unfortunately my laptop drive failed last night, so I would be grateful for a three-day extension.',
          'The campus IT helpdesk is currently recovering my local test benchmarks.',
        ],
        expectedKeywords: ['professor', 'laptop', 'extension', 'days', 'friday', 'recover', 'grateful'],
      },
      {
        npcLine:
          'I see. As you know, university policy requires concrete progress evidence and official documentation for late extensions. What can you provide today?',
        npcLineZh: '了解。如你所知，校規要求延期必須附上具體進度證明與正式單據。你今天能提供什麼證明？',
        missionGoalZh: '第 2 回合：提出雙重證明（雲端已完成的架構大綱草稿 ＋ IT 維修中心開立的報修單號）',
        rescueChips: [
          'I already have my complete architecture outline and literature review backed up in the cloud.',
          'I can email you my current draft today along with the official ticket from Campus IT Support.',
          'With those three extra days, I can rerun the performance experiments over the weekend.',
        ],
        expectedKeywords: ['draft', 'outline', 'cloud', 'ticket', 'email', 'today', 'support', 'evidence'],
      },
      {
        npcLine:
          'Very well—that is well prepared. Send me your current outline and the IT ticket before 5 PM, and I will approve your extension until Monday evening.',
        npcLineZh: '很好，準備得很周全。下午五點前把大綱與 IT 單號寄給我，我就核准你延到週一晚上。',
        missionGoalZh: '第 3 回合：承諾下午五點前寄出並表達誠摯感謝',
        rescueChips: [
          'Thank you very much for your understanding, Professor—I will email both documents right away.',
          'I really appreciate your flexibility and will submit the completed paper before Monday evening.',
          'Many thanks for your guidance, I will send the files to your inbox within the hour.',
        ],
        expectedKeywords: ['thank', 'professor', 'email', 'send', 'monday', 'appreciate'],
      },
    ],
  },
  {
    id: 'sydney-standup',
    examCode: '澳洲軟體工程師實戰彩蛋',
    title: '雪梨軟體公司 Standup：登入微服務延遲飆高救火',
    subtitle: '把你的軟體開發專業變成 PTE 流利度提款機！',
    avatarEmoji: '👩‍💻',
    npcName: 'Maya (Atlassian 風格 Tech Lead)',
    npcRole: '工程團隊主管 · 專業俐落合作語氣',
    vibeTag: '工程師本行 · 信心爆棚',
    accent: 'en-AU',
    xpReward: 80,
    contextZh:
      '你在雪梨新創擔任後端工程師。早會時 Maya 問你為什麼昨晚部署後 Auth API 回應時間變慢，以及你的修復計畫。',
    turns: [
      {
        npcLine:
          'Morning team! Quick check-in—we noticed login latency spiked to two seconds after last night’s release. Did you spot what caused it?',
        npcLineZh: '早安團隊！快速同步一下——昨晚發版後登入延遲飆到兩秒，你查出原因了嗎？',
        missionGoalZh: '第 1 回合：用你最熟悉的工程英文說明原因（例如資料庫少了一個索引或快取設定失效）',
        rescueChips: [
          'Morning Maya! Yes, I traced the spike to a missing database index on the session table.',
          'After last night’s deployment, our Redis cache key expired too early and overloaded Postgres.',
          'I checked the logs this morning and isolated the bottleneck in the token verification query.',
        ],
        expectedKeywords: ['database', 'index', 'cache', 'query', 'logs', 'deployment', 'latency', 'found'],
      },
      {
        npcLine:
          'Nice catch! How quickly can we ship a hotfix without causing downtime for Australian morning traffic?',
        npcLineZh: '抓得好！我們多久能上熱修復，同時確保澳洲早高峰流量不斷線？',
        missionGoalZh: '第 2 回合：說明安全上線步驟（先在 Staging 驗證並用並發建索引／滾動更新，中午前完成）',
        rescueChips: [
          'I have already opened a pull request and tested the migration on staging with zero downtime.',
          'Once someone reviews my PR, we can roll out the hotfix safely within thirty minutes.',
          'I will monitor the dashboard metrics closely for an hour after we deploy to production.',
        ],
        expectedKeywords: ['test', 'staging', 'deploy', 'minutes', 'review', 'production', 'monitor', 'hotfix'],
      },
      {
        npcLine:
          "Legend! Tag me on the PR right after standup and I'll approve it immediately. Grab yourself a flat white afterwards!",
        npcLineZh: '太神啦！早會結束立刻在 PR tag 我，我馬上核准。忙完去買杯 Flat White 犒賞自己！',
        missionGoalZh: '第 3 回合：自信收尾！（你看，講軟體工程英文是不是超順？）',
        rescueChips: [
          'Will do! Tagging you on GitHub right now—thanks Maya!',
          'Awesome, I will ping you in Slack as soon as the build passes. Cheers!',
          'Sounds like a plan, thanks for the quick review!',
        ],
        expectedKeywords: ['thanks', 'tag', 'now', 'cheers', 'plan', 'build'],
      },
    ],
  },
];
