export interface RsQuestion {
  id: number;
  chunkA: string; // First 50-60% chunk — safe 60-point target!
  chunkB: string;
  textZh: string;
  tip: string;
}

export const RS_QUESTIONS: RsQuestion[] = [
  {
    id: 1,
    chunkA: 'Please make sure all mobile phones',
    chunkB: 'are switched off during the lecture.',
    textZh: '請確保所有手機在講座期間關機。',
    tip: '60分策略：穩唸出前半句 6 字零卡頓，流利度直接滿分！are switched off 有連音。',
  },
  {
    id: 2,
    chunkA: 'The main concepts of these events',
    chunkB: 'were not yet fully understood.',
    textZh: '這些事件的核心概念尚未被完全理解。',
    tip: '注意 concepts / events 複數氣音，前半意群超好抓。',
  },
  {
    id: 3,
    chunkA: 'Students who wish to apply for an extension',
    chunkB: 'should contact their tutor before Friday.',
    textZh: '欲申請延期的學生應在週五前聯繫導師。',
    tip: '長句切在 extension 停半拍最自然，記不住全句時穩住前半段 8 字即可拿高分。',
  },
  {
    id: 4,
    chunkA: 'All essays and seminar papers submitted',
    chunkB: 'must be emailed to your professor.',
    textZh: '所有繳交的論文與研討報告都必須寄信給教授。',
    tip: 'submitted 過去分詞後置修飾，重音在 mid。',
  },
  {
    id: 5,
    chunkA: 'There will be an open book exam',
    chunkB: 'on Monday the twenty-eighth.',
    textZh: '二十八號週一將舉行開書考。',
    tip: 'an open book exam 連讀成 a-nopen-book-exam。',
  },
  {
    id: 6,
    chunkA: 'The campus tour will help you',
    chunkB: 'get familiar with the teaching facilities.',
    textZh: '校園導覽將協助你熟悉教學設施。',
    tip: '短句爭取全句復述，facilities 重音在第二音節 cil。',
  },
  {
    id: 7,
    chunkA: 'You should include your name and student number',
    chunkB: 'at the top of every page.',
    textZh: '你應該在每一頁頂端寫上姓名與學號。',
    tip: '以意群畫面記憶：姓名+學號 / 每頁頂端。',
  },
  {
    id: 8,
    chunkA: 'A balanced diet and regular exercise',
    chunkB: 'can significantly reduce health risks.',
    textZh: '均衡飲食與規律運動能顯著降低健康風險。',
    tip: 'significantly 若卡嘴可只穩穩講完前半段或跳過副詞保流利度！',
  },
  {
    id: 9,
    chunkA: 'The library will remain open until midnight',
    chunkB: 'throughout the final examination period.',
    textZh: '期末考期間圖書館將開放至午夜。',
    tip: 'remain open until midnight 畫面清楚，前半 7 字已超過 58% 字數！',
  },
  {
    id: 10,
    chunkA: 'Please hand in your lab reports',
    chunkB: 'at the end of this afternoon session.',
    textZh: '請在今天下午課程結束時繳交實驗報告。',
    tip: 'hand in 連讀成 han-din。',
  },
  {
    id: 11,
    chunkA: 'Most university courses combine traditional lectures',
    chunkB: 'with small group tutorial discussions.',
    textZh: '多數大學課程結合傳統講座與小組導修討論。',
    tip: 'combine A with B 結構，先鎖死前半句 6 個實詞。',
  },
  {
    id: 12,
    chunkA: 'Parking permits can be purchased online',
    chunkB: 'or at the student service center.',
    textZh: '停車證可於線上或學生服務中心購買。',
    tip: '被動 can be purchased，online 後自然換氣。',
  },
  {
    id: 13,
    chunkA: 'Our research findings clearly demonstrate',
    chunkB: 'the importance of early childhood education.',
    textZh: '我們的研究結果清楚顯示幼兒教育的重要性。',
    tip: 'demonstrate 重音在第一音節 dem。',
  },
  {
    id: 14,
    chunkA: 'Next week we will discuss the impact',
    chunkB: 'of social media on consumer behavior.',
    textZh: '下週我們將討論社群媒體對消費者行為的影響。',
    tip: 'the impact of A on B 經典結構。',
  },
  {
    id: 15,
    chunkA: 'International students are invited to attend',
    chunkB: 'the welcome reception on Tuesday evening.',
    textZh: '誠摯邀請國際學生參加週二晚間的歡迎茶會。',
    tip: 'are invited to attend 連讀順暢即可穩拿口說與聽力雙分。',
  },
  {
    id: 16,
    chunkA: 'Renewable energy technology has become much cheaper',
    chunkB: 'over the past two decades.',
    textZh: '過去二十年來再生能源技術已便宜許多。',
    tip: 'much cheaper 與 over the past two decades 兩個清晰意群。',
  },
  {
    id: 17,
    chunkA: 'Please do not bring food or drinks',
    chunkB: 'into the computer laboratory.',
    textZh: '請勿將食物或飲料帶入電腦實驗室。',
    tip: 'laboratory 美音 lab-ra-tory / 英澳音 la-bo-ra-tri 皆可。',
  },
  {
    id: 18,
    chunkA: 'All source materials must be properly cited',
    chunkB: 'in the reference list at the end.',
    textZh: '所有參考資料都必須在文末參考文獻中正確引用。',
    tip: 'properly cited 發音清楚，前半 7 字已穩拿 2/3 內容分。',
  },
  {
    id: 19,
    chunkA: 'The workshop on software engineering practices',
    chunkB: 'has been moved to Room 302.',
    textZh: '軟體工程實務工作坊已改至 302 教室。',
    tip: '你的本行單字 software engineering 秒記！Room three-oh-two。',
  },
  {
    id: 20,
    chunkA: 'Students are advised to check their email regularly',
    chunkB: 'for important course announcements.',
    textZh: '建議學生定期檢查信箱以獲取重要課程公告。',
    tip: '前半 8 字完整獨立成意群，超好抓。',
  },
];

export interface RtsQuestion {
  id: number;
  title: string;
  titleZh: string;
  prompt: string;
  promptZh: string;
  addressTo: string; // e.g., "Professor Miller" or "Hi Alex"
  keyPoints: [string, string, string];
  sampleResponse: string;
}

export const RTS_QUESTIONS: RtsQuestion[] = [
  {
    id: 1,
    title: 'Missed Group Project Meeting',
    titleZh: '錯過小組專案會議',
    prompt:
      'You missed an important group project meeting yesterday because of a sudden fever. Leave a voice message for your group leader, Sam, to apologize, explain what happened, and suggest how you will catch up on your tasks.',
    promptZh: '你昨天因突發高燒錯過重要小組會議。請留語音給組長 Sam：道歉、說明原因，並提出你如何補上進度。',
    addressTo: 'Hi Sam',
    keyPoints: [
      '直接稱呼對方並誠懇致歉 (Hi Sam, I am really sorry for missing yesterday’s group meeting)',
      '自然交代突發狀況 (I came down with a sudden high fever and couldn’t get out of bed)',
      '給出具體行動方案 (I’ve already checked our shared docs and will finish my part of the slides by tonight)',
    ],
    sampleResponse:
      "Hi Sam, I'm calling to say I'm really sorry I missed our group project meeting yesterday afternoon. Unfortunately, I woke up with a sudden fever and had to rest all day. I've already reviewed the meeting notes you uploaded to our shared folder, and I completely understand my assigned tasks. I'll complete the data analysis section by tonight and send it to the group chat for your feedback. Let me know if we need a quick ten-minute call tomorrow!",
  },
  {
    id: 2,
    title: 'Requesting Assignment Extension from Professor',
    titleZh: '向教授申請作業延期',
    prompt:
      'Your laptop crashed two days before your software design report is due, and part of your code repository is still being recovered. Speak to your lecturer, Dr. Patel, to explain the issue and politely ask for a two-day extension.',
    promptZh: '在軟體設計報告截止前兩天你的筆電當機，部分程式碼仍在救援中。請向講師 Dr. Patel 說明狀況並禮貌請求延期兩天。',
    addressTo: 'Hello Dr. Patel',
    keyPoints: [
      '禮貌問候並說明來意 (Hello Dr. Patel, thank you for taking a moment to speak with me about Friday’s report)',
      '說明具體不可抗力原因與目前進度 (My laptop crashed last night, though I already have my draft outline backed up)',
      '提出明確合理的天數與證明 (Could I kindly request a two-day extension until Sunday evening?)',
    ],
    sampleResponse:
      'Hello Dr. Patel, thank you for seeing me today. I wanted to talk to you about the software design report due this Friday. Unfortunately, my laptop hard drive crashed last night, and the IT support desk is still helping me recover my local project files. Most of my literature review is safe in the cloud, so I just need a bit of extra time to rebuild the test results. Would it be possible to grant me a two-day extension until Sunday evening? I would really appreciate your understanding.',
  },
  {
    id: 3,
    title: 'Noisy Neighbor Before Final Exam',
    titleZh: '期末考前鄰居深夜噪音',
    prompt:
      'Your neighbor in the student apartment has been playing loud music late at night, and you have an important exam tomorrow morning. Knock on their door and politely ask them to lower the volume.',
    promptZh: '學生公寓鄰居深夜放很大聲的音樂，而你明早有重要考試。請敲門禮貌請對方調低音量。',
    addressTo: 'Hi there',
    keyPoints: [
      '友善開場避免衝突 (Hi there, sorry to bother you so late in the evening)',
      '說明自身處境 (I actually have a major final exam at eight tomorrow morning and need to get some sleep)',
      '提出具體且友善的請求 (Would you mind turning the music down or using headphones after ten PM?)',
    ],
    sampleResponse:
      "Hi there, sorry to disturb you late at night. I live right next door in Room 204. I completely understand wanting to relax with some music, but the walls here are quite thin and I have a really important final exam early tomorrow morning. I'm having trouble concentrating and falling asleep right now. Would you mind turning the volume down a little bit or switching to headphones for tonight? Thanks so much for helping me out!",
  },
  {
    id: 4,
    title: 'Damaged Book Borrowed from Library',
    titleZh: '圖書館借出書籍發現既有破損',
    prompt:
      'You just borrowed a reference book from the university library, and when you opened it at your desk, you noticed several pages were torn and stained. Speak to the librarian immediately so you will not be blamed.',
    promptZh: '你剛從大學圖書館借了一本參考書，坐下來打開時發現好幾頁破損有污漬。請立即向館員說明以免被誤認為是你弄壞的。',
    addressTo: 'Excuse me',
    keyPoints: [
      '禮貌引起注意並出示書籍 (Excuse me, I just checked out this reference book ten minutes ago)',
      '指出具體損壞情況 (As soon as I opened Chapter Three at my desk, I noticed torn pages and coffee stains)',
      '請館員協助註記或換書 (Could you please record this condition on my account or check if there is another copy?)',
    ],
    sampleResponse:
      'Excuse me, hi! I actually checked out this database textbook from the front desk just ten minutes ago. When I sat down at the study table and opened it for the first time, I noticed that several pages in the middle are torn and have dark coffee stains on them. I wanted to bring it back right away so it doesn’t get recorded as damage under my student account. Could you please make a note of this in the system, or check if another clean copy is available?',
  },
  {
    id: 5,
    title: 'Clashing Shift at Part-Time Job',
    titleZh: '打工排班與補課衝堂',
    prompt:
      'Your café manager scheduled you to work on Saturday morning, which clashes with a mandatory university lab session that was just announced. Call your manager, Sarah, to arrange a shift swap.',
    promptZh: '咖啡廳經理排你週六早班，剛好與剛公布的學校必修實驗課衝堂。請打給經理 Sarah 協調換班。',
    addressTo: 'Hi Sarah',
    keyPoints: [
      '感謝排班並提出時間衝突 (Hi Sarah, I just saw next week’s roster and wanted to let you know right away)',
      '說明學校必修課原因 (My university department just scheduled a compulsory lab session on Saturday morning)',
      '主動提供替代排班方案 (I’ve already asked Tom and he’s happy to swap his Sunday morning shift with me)',
    ],
    sampleResponse:
      "Hi Sarah, thanks for sending out next week's work roster. I'm calling as early as possible because I noticed I'm scheduled for the Saturday morning shift. Unfortunately, my university professor just announced a mandatory laboratory session at that exact time, and attendance counts toward my final grade. To make sure the café isn't short-staffed, I already checked with Tom, and he agreed to swap his Sunday morning shift with me if you approve. Please let me know if that works for you!",
  },
  {
    id: 6,
    title: 'Wrong Dish Delivered at Campus Café',
    titleZh: '餐廳送錯餐點且趕著上課',
    prompt:
      'You ordered a vegetarian pasta at the campus café because you have a lecture in twenty minutes, but the staff brought you a chicken burger instead. Speak to the server politely to resolve it quickly.',
    promptZh: '你在校園餐廳點了蔬食義大利麵，因為 20 分鐘後要上課，但店員送成雞肉漢堡。請禮貌向服務生反應並快速解決。',
    addressTo: 'Excuse me',
    keyPoints: [
      '溫和指出送錯餐點 (Excuse me, I think there might be a small mix-up with my order)',
      '說明飲食需求與時間壓力 (I ordered the vegetarian pasta, and my next lecture starts in twenty minutes)',
      '詢問最快解決方案 (Could you check if my pasta is ready, or pack something vegetarian to take away?)',
    ],
    sampleResponse:
      "Excuse me, hi! Sorry to trouble you, but I think there's been a small mix-up with my lunch order. I ordered the vegetarian pasta about fifteen minutes ago, and this plate is a chicken burger, which I don't eat. Also, my afternoon lecture starts in twenty minutes across campus, so I'm in a bit of a hurry. Could you please check with the kitchen if my pasta is almost ready, or put it in a takeaway box so I can bring it with me? Thank you!",
  },
  {
    id: 7,
    title: 'Air Conditioning Broken in Study Room',
    titleZh: '討論室冷氣故障悶熱',
    prompt:
      'You and your teammates booked a library discussion room for two hours, but the air conditioning is broken and the room is extremely stuffy. Speak to the facility desk staff to ask for another room.',
    promptZh: '你與組員預約了圖書館討論室兩小時，但冷氣壞掉非常悶熱。請向櫃檯人員反映並請求更換房間。',
    addressTo: 'Hi, excuse me',
    keyPoints: [
      '報上預約房號與時間 (Hi, my team booked Discussion Room B from two to four PM today)',
      '具體描述設施問題 (The air conditioner inside doesn’t seem to be working at all and the room is very hot)',
      '請求更換房間並通知維修 (Would it be possible to move us to another available room and have maintenance check it?)',
    ],
    sampleResponse:
      "Hi, excuse me! My project group booked Discussion Room B on the third floor from two to four this afternoon. We've been working inside for about fifteen minutes, and we noticed the air conditioning isn't blowing any cool air at all—it's getting really hot and stuffy with four laptops running. Would it be possible to move our booking to another available study room nearby? I also wanted to let you know so your maintenance team can take a look at it.",
  },
  {
    id: 8,
    title: 'Advising a New Junior Developer Intern',
    titleZh: '協助剛入職實習生設定開發環境',
    prompt:
      'A new intern on your software team looks stressed because they cannot get the project build running on their first day. Approach them, offer reassurance, and suggest setting it up together after lunch.',
    promptZh: '軟體團隊新來的實習生第一天因專案編譯跑不起來而很焦慮。請主動關心、安撫對方，並提議午飯後一起設定。',
    addressTo: 'Hey Jordan',
    keyPoints: [
      '友善破冰關心狀況 (Hey Jordan, welcome to the team! How is your first morning going?)',
      '同理安撫減少壓力 (Don’t worry at all about the build errors—our local environment setup is tricky for everyone on day one)',
      '約定具體協助時間 (Let’s grab lunch first, and at one-thirty I’ll sit down with you to configure the environment step by step)',
    ],
    sampleResponse:
      "Hey Jordan, welcome aboard! I noticed you were looking a bit stressed with the terminal errors, so I wanted to check in. Please don't worry at all—our project has quite a few legacy dependencies, and almost everyone runs into configuration issues on their first day. You're doing totally fine! Why don't we take a break for lunch right now, and around one-thirty I can sit with you for half an hour and walk you through the setup guide step by step?",
  },
];

export interface DiQuestion {
  id: number;
  title: string;
  chartType: 'bar' | 'line' | 'pie';
  unit: string;
  series: Array<{ label: string; value: number; secondaryValue?: number }>;
  keyHighest: string;
  keyLowest: string;
  keyTrend: string;
  safeSpeech: string;
}

export const DI_QUESTIONS: DiQuestion[] = [
  {
    id: 1,
    title: 'Global Programming Language Adoption in 2026 (%)',
    chartType: 'bar',
    unit: '%',
    series: [
      { label: 'TypeScript', value: 68 },
      { label: 'Python', value: 74 },
      { label: 'Java', value: 46 },
      { label: 'Go', value: 31 },
      { label: 'Rust', value: 22 },
    ],
    keyHighest: 'Python recorded the highest figure at 74 percent, closely followed by TypeScript at 68 percent',
    keyLowest: 'Rust accounted for the lowest proportion at 22 percent, while Go stood at 31 percent',
    keyTrend: 'Java remained stable in the middle at 46 percent across surveyed developers',
    safeSpeech:
      'This bar chart illustrates Global Programming Language Adoption in 2026 measured in percentages. Looking at the main figures, Python recorded the highest adoption at 74 percent, closely followed by TypeScript at 68 percent. In contrast, Rust had the lowest share at 22 percent, whereas Go and Java stood at 31 percent and 46 percent respectively. Overall, Python and TypeScript clearly dominate modern software development compared to lower-level languages.',
  },
  {
    id: 2,
    title: 'Australian Renewable Electricity Generation (2020–2026, %)',
    chartType: 'line',
    unit: '%',
    series: [
      { label: '2020', value: 24 },
      { label: '2022', value: 32 },
      { label: '2024', value: 39 },
      { label: '2026', value: 48 },
    ],
    keyHighest: 'The share reached a peak of 48 percent in 2026',
    keyLowest: 'It started from the lowest point of 24 percent in 2020',
    keyTrend: 'There was a steady upward trend doubling over the six-year period through 32 percent in 2022 and 39 percent in 2024',
    safeSpeech:
      'This line graph shows Australian Renewable Electricity Generation between 2020 and 2026 in percentages. At the beginning of the period in 2020, renewable energy stood at its lowest point of 24 percent. Over the following years, it grew steadily to 32 percent in 2022 and 39 percent in 2024, before reaching the highest peak of 48 percent in 2026. Overall, renewable electricity generation doubled consistently throughout the six-year timeframe.',
  },
  {
    id: 3,
    title: 'Monthly Household Expenditure Breakdown in Melbourne (%)',
    chartType: 'pie',
    unit: '%',
    series: [
      { label: 'Housing', value: 36 },
      { label: 'Food', value: 24 },
      { label: 'Transport', value: 18 },
      { label: 'Leisure', value: 12 },
      { label: 'Savings', value: 10 },
    ],
    keyHighest: 'Housing represents the largest category at 36 percent, followed by Food at 24 percent',
    keyLowest: 'Savings makes up the smallest slice at only 10 percent, just below Leisure at 12 percent',
    keyTrend: 'Transport accounts for a moderate 18 percent of monthly household spending',
    safeSpeech:
      'This chart presents the Monthly Household Expenditure Breakdown in Melbourne by percentage. Notably, Housing accounts for the largest proportion at 36 percent, followed by Food at 24 percent, meaning basic living costs exceed half of total spending. Meanwhile, Transport represents 18 percent, while Leisure and Savings make up the smallest shares at 12 percent and 10 percent respectively. Overall, housing costs are the primary financial expense for Melbourne households.',
  },
  {
    id: 4,
    title: 'University Commute Modes Among Students (%)',
    chartType: 'bar',
    unit: '%',
    series: [
      { label: 'Public Train', value: 44 },
      { label: 'Bus', value: 26 },
      { label: 'Cycling', value: 16 },
      { label: 'Private Car', value: 14 },
    ],
    keyHighest: 'Public Train is by far the most popular option at 44 percent, followed by Bus at 26 percent',
    keyLowest: 'Private Car is the least common choice at 14 percent, slightly behind Cycling at 16 percent',
    keyTrend: 'Seventy percent of students rely on public transit rather than private vehicles',
    safeSpeech:
      'This bar chart compares University Commute Modes Among Students in percentages. Public Train is clearly the most popular transport method at 44 percent, with Bus ranking second at 26 percent. On the other hand, Private Car is the least used option at just 14 percent, closely preceded by Cycling at 16 percent. In conclusion, the vast majority of university students prefer public transportation over driving private cars to campus.',
  },
  {
    id: 5,
    title: 'Daily Study Hours by Faculty (Hours per Week)',
    chartType: 'bar',
    unit: 'h',
    series: [
      { label: 'Medicine', value: 28 },
      { label: 'Engineering', value: 25 },
      { label: 'Science', value: 21 },
      { label: 'Business', value: 16 },
      { label: 'Arts', value: 14 },
    ],
    keyHighest: 'Medicine students spend the highest time at 28 hours per week, closely followed by Engineering at 25 hours',
    keyLowest: 'Arts students record the lowest study time at 14 hours, just below Business at 16 hours',
    keyTrend: 'Science sits in the middle with 21 hours of independent study each week',
    safeSpeech:
      'This bar chart illustrates independent study hours per week across five university faculties. Medicine ranks highest at 28 hours per week, closely followed by Engineering at 25 hours and Science at 21 hours. Conversely, Arts has the lowest figure at 14 hours per week, while Business is slightly higher at 16 hours. Overall, STEM and medical degrees require significantly longer weekly study hours than Arts and Business programs.',
  },
  {
    id: 6,
    title: 'Remote Work Frequency in IT Companies (2021–2026, %)',
    chartType: 'line',
    unit: '%',
    series: [
      { label: '2021', value: 78 },
      { label: '2022', value: 64 },
      { label: '2024', value: 52 },
      { label: '2026', value: 49 },
    ],
    keyHighest: 'Full remote work peaked at 78 percent in 2021',
    keyLowest: 'It declined gradually to stabilize around 49 percent in 2026',
    keyTrend: 'After dropping to 64 percent in 2022 and 52 percent in 2024, hybrid arrangements leveled off near half the workforce',
    safeSpeech:
      'This line chart depicts Remote Work Frequency in IT Companies from 2021 to 2026. In 2021, remote work started at its highest peak of 78 percent. Subsequently, the figure declined to 64 percent in 2022 and 52 percent in 2024 as offices reopened, eventually stabilizing at the lowest point of 49 percent in 2026. Overall, although pure remote work decreased from its initial peak, roughly half of IT employees continue working remotely.',
  },
];

export interface RaQuestion {
  id: number;
  title: string;
  markedText: string; // "/" marks sense group breath pauses
  plainText: string;
  traps: string;
}

export const RA_QUESTIONS: RaQuestion[] = [
  {
    id: 1,
    title: 'Urban Green Spaces',
    markedText:
      'Modern urban planners / increasingly recognize that / public parks and green corridors / play a vital role / in reducing city temperatures. / Beyond environmental benefits, / accessible nature areas / encourage daily physical activity / and strengthen community bonds / among local residents.',
    plainText:
      'Modern urban planners increasingly recognize that public parks and green corridors play a vital role in reducing city temperatures. Beyond environmental benefits, accessible nature areas encourage daily physical activity and strengthen community bonds among local residents.',
    traps: '注意詞尾複數 planners, parks, corridors, benefits, bonds, residents；accessible 重音在 ces。',
  },
  {
    id: 2,
    title: 'Software Automation & Productivity',
    markedText:
      'Advances in cloud computing / and automated testing tools / have transformed / how engineering teams / deliver reliable software. / By catching integration errors early, / developers can focus more energy / on system architecture / and user experience design.',
    plainText:
      'Advances in cloud computing and automated testing tools have transformed how engineering teams deliver reliable software. By catching integration errors early, developers can focus more energy on system architecture and user experience design.',
    traps: 'transformed (-ed) 輕吐 d 音；architecture 發音 ar-ki-tek-cher（ch 發 k 音！）。',
  },
  {
    id: 3,
    title: 'Marine Biodiversity Research',
    markedText:
      'Coral reefs support / nearly a quarter of all marine species, / despite covering / less than one percent / of the ocean floor. / Protecting these fragile ecosystems / requires coordinated international policies / and sustainable coastal management.',
    plainText:
      'Coral reefs support nearly a quarter of all marine species, despite covering less than one percent of the ocean floor. Protecting these fragile ecosystems requires coordinated international policies and sustainable coastal management.',
    traps: 'species 單複同形；fragile (fra-jail / fra-jil 皆可)；requires 加 s。',
  },
  {
    id: 4,
    title: 'Sleep & Memory Consolidation',
    markedText:
      'Neuroscience research indicates / that consistent quality sleep / is essential / for consolidating newly acquired information. / Students who sacrifice rest / for all-night study sessions / often experience reduced concentration / and slower problem-solving speed / the following day.',
    plainText:
      'Neuroscience research indicates that consistent quality sleep is essential for consolidating newly acquired information. Students who sacrifice rest for all-night study sessions often experience reduced concentration and slower problem-solving speed the following day.',
    traps: 'Neuroscience 重音在開頭 Neu；indicates 加 s；acquired 勿漏 d。',
  },
  {
    id: 5,
    title: 'Digital Archives in Libraries',
    markedText:
      'University libraries / have shifted from storing physical volumes / to curating vast digital repositories. / While electronic databases / allow instant remote access / for researchers worldwide, / preserving rare historical documents / still demands specialized climate control.',
    plainText:
      'University libraries have shifted from storing physical volumes to curating vast digital repositories. While electronic databases allow instant remote access for researchers worldwide, preserving rare historical documents still demands specialized climate control.',
    traps: 'repositories 重音在 pos；demands 結尾 z 音不可吞掉。',
  },
  {
    id: 6,
    title: 'Behavioral Economics in Daily Choices',
    markedText:
      'Traditional economic models / assume that consumers / always make rational financial decisions. / However, / empirical studies reveal / that subtle changes / in how options are presented / can dramatically influence / what people ultimately purchase.',
    plainText:
      'Traditional economic models assume that consumers always make rational financial decisions. However, empirical studies reveal that subtle changes in how options are presented can dramatically influence what people ultimately purchase.',
    traps: '重點陷阱字：subtle 裡面的 b 不發音 (唸 suh-tl)！empirical 重音在 pir。',
  },
];
