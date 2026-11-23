export interface SgdSpeaker {
  id: number;
  text: string;
  audio: string;
  textZh: string;
  image: string;
}

export interface SgdQuestion {
  id: number;
  topic: string;
  topicZh: string;
  image: string;
  fullAudio: string;
  speakers: SgdSpeaker[];
}

export const SGD_QUESTIONS: SgdQuestion[] = [
  {
    "id": 1,
    "topic": "student accommodation",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they enjoy dormitory life because of the shared kitchen",
        "audio": "audio/q1_s1.mp3",
        "textZh": "第一位講者說他們喜歡宿舍生活，因為有共用廚房",
        "image": "images/q1_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they prefer a private apartment for more privacy",
        "audio": "audio/q1_s2.mp3",
        "textZh": "第二位講者說他們偏好私人公寓，以獲得更多隱私",
        "image": "images/q1_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they value living on campus because it is close to classrooms",
        "audio": "audio/q1_s3.mp3",
        "textZh": "第三位講者說他們重視住在校園裡，因為離教室很近",
        "image": "images/q1_s3.webp"
      }
    ],
    "fullAudio": "audio/q1_full.mp3",
    "image": "images/q1.webp",
    "topicZh": "學生住宿"
  },
  {
    "id": 2,
    "topic": "career plans after graduation",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they prefer joining a big company for structured training",
        "audio": "audio/q2_s1.mp3",
        "textZh": "第一位講者說他們偏好加入大公司接受系統化培訓",
        "image": "images/q2_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they value meaningful work in the non-profit sector",
        "audio": "audio/q2_s2.mp3",
        "textZh": "第二位講者說他們重視在非營利組織做有意義的工作",
        "image": "images/q2_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they consider postgraduate study to explore career options",
        "audio": "audio/q2_s3.mp3",
        "textZh": "第三位講者說他們考慮讀研究所來探索職涯選項",
        "image": "images/q2_s3.webp"
      }
    ],
    "fullAudio": "audio/q2_full.mp3",
    "image": "images/q2.webp",
    "topicZh": "畢業後的職涯規劃"
  },
  {
    "id": 3,
    "topic": "writing university essays",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they find essay writing overwhelming",
        "audio": "audio/q3_s1.mp3",
        "textZh": "第一位講者說他們覺得寫論文令人不知所措",
        "image": "images/q3_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they suggest understanding the question first",
        "audio": "audio/q3_s2.mp3",
        "textZh": "第二位講者說他們建議先理解題目",
        "image": "images/q3_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they recommend using the campus writing center",
        "audio": "audio/q3_s3.mp3",
        "textZh": "第三位講者說他們推薦使用校園寫作中心",
        "image": "images/q3_s3.webp"
      }
    ],
    "fullAudio": "audio/q3_full.mp3",
    "image": "images/q3.webp",
    "topicZh": "撰寫大學論文"
  },
  {
    "id": 4,
    "topic": "the anniversary celebration",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they want to book a nice restaurant downtown",
        "audio": "audio/q4_s1.mp3",
        "textZh": "第一位講者說他們想預訂市中心一家不錯的餐廳",
        "image": "images/q4_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they prefer hosting it on campus because it is more convenient",
        "audio": "audio/q4_s2.mp3",
        "textZh": "第二位講者說他們偏好在校園舉辦，因為比較方便",
        "image": "images/q4_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they suggest using the Business Building's event room",
        "audio": "audio/q4_s3.mp3",
        "textZh": "第三位講者說他們建議使用商學院大樓的活動室",
        "image": "images/q4_s3.webp"
      }
    ],
    "fullAudio": "audio/q4_full.mp3",
    "image": "images/q4.webp",
    "topicZh": "週年慶祝活動"
  },
  {
    "id": 5,
    "topic": "presentation skills",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they feel nervous during presentations",
        "audio": "audio/q5_s1.mp3",
        "textZh": "第一位講者說他們上台簡報時會緊張",
        "image": "images/q5_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they suggest practicing in front of friends to build confidence",
        "audio": "audio/q5_s2.mp3",
        "textZh": "第二位講者說他們建議在朋友面前練習來建立信心",
        "image": "images/q5_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they recommend looking at the audience's chin to reduce pressure",
        "audio": "audio/q5_s3.mp3",
        "textZh": "第三位講者說他們推薦看觀眾的下巴來減輕壓力",
        "image": "images/q5_s3.webp"
      }
    ],
    "fullAudio": "audio/q5_full.mp3",
    "image": "images/q5.webp",
    "topicZh": "簡報技巧"
  },
  {
    "id": 6,
    "topic": "managing assignments",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they feel pressure from too many assignments",
        "audio": "audio/q6_s1.mp3",
        "textZh": "第一位講者說他們因為太多作業而感到壓力",
        "image": "images/q6_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they suggest breaking large tasks into smaller ones",
        "audio": "audio/q6_s2.mp3",
        "textZh": "第二位講者說他們建議把大任務拆成小任務",
        "image": "images/q6_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they believe studying during the most productive hours is important",
        "audio": "audio/q6_s3.mp3",
        "textZh": "第三位講者說他們認為在最有生產力的時段讀書很重要",
        "image": "images/q6_s3.webp"
      }
    ],
    "fullAudio": "audio/q6_full.mp3",
    "image": "images/q6.webp",
    "topicZh": "管理作業"
  },
  {
    "id": 7,
    "topic": "the university field trip",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they are unsure about joining because of their part-time job",
        "audio": "audio/q7_s1.mp3",
        "textZh": "第一位講者說他們因為打工而不確定是否參加",
        "image": "images/q7_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they believe the trip offers valuable learning opportunities",
        "audio": "audio/q7_s2.mp3",
        "textZh": "第二位講者說他們認為這趟旅行提供寶貴的學習機會",
        "image": "images/q7_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they think the trip is a good chance to meet new people",
        "audio": "audio/q7_s3.mp3",
        "textZh": "第三位講者說他們覺得這趟旅行是認識新朋友的好機會",
        "image": "images/q7_s3.webp"
      }
    ],
    "fullAudio": "audio/q7_full.mp3",
    "image": "images/q7.webp",
    "topicZh": "大學校外教學"
  },
  {
    "id": 8,
    "topic": "online classes",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they get easily distracted during online lectures",
        "audio": "audio/q8_s1.mp3",
        "textZh": "第一位講者說他們上線上課程時容易分心",
        "image": "images/q8_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they enjoy online learning because it offers flexibility",
        "audio": "audio/q8_s2.mp3",
        "textZh": "第二位講者說他們喜歡線上學習因為有彈性",
        "image": "images/q8_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they prefer face-to-face learning for better campus experience",
        "audio": "audio/q8_s3.mp3",
        "textZh": "第三位講者說他們偏好面對面學習以獲得更好的校園體驗",
        "image": "images/q8_s3.webp"
      }
    ],
    "fullAudio": "audio/q8_full.mp3",
    "image": "images/q8.webp",
    "topicZh": "線上課程"
  },
  {
    "id": 9,
    "topic": "using AI for proofreading",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they want to use AI to check grammar",
        "audio": "audio/q9_s1.mp3",
        "textZh": "第一位講者說他們想用 AI 來檢查文法",
        "image": "images/q9_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they worry about the risk of plagiarism",
        "audio": "audio/q9_s2.mp3",
        "textZh": "第二位講者說他們擔心抄襲的風險",
        "image": "images/q9_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they believe AI is just a tool for polishing work",
        "audio": "audio/q9_s3.mp3",
        "textZh": "第三位講者說他們認為 AI 只是潤飾作品的工具",
        "image": "images/q9_s3.webp"
      }
    ],
    "fullAudio": "audio/q9_full.mp3",
    "image": "images/q9.webp",
    "topicZh": "使用 AI 校對"
  },
  {
    "id": 10,
    "topic": "using phones in lectures",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they notice students get distracted by phones in class",
        "audio": "audio/q10_s1.mp3",
        "textZh": "第一位講者說他們注意到學生上課被手機分心",
        "image": "images/q10_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they find phones useful for recording lectures",
        "audio": "audio/q10_s2.mp3",
        "textZh": "第二位講者說他們覺得手機錄製講座很有用",
        "image": "images/q10_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they believe phones can be used for interactive activities",
        "audio": "audio/q10_s3.mp3",
        "textZh": "第三位講者說他們認為手機可以用於互動活動",
        "image": "images/q10_s3.webp"
      }
    ],
    "fullAudio": "audio/q10_full.mp3",
    "image": "images/q10.webp",
    "topicZh": "課堂使用手機"
  },
  {
    "id": 11,
    "topic": "commuting to university",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they like taking the bus because they can read during the ride",
        "audio": "audio/q11_s1.mp3",
        "textZh": "第一位講者說他們喜歡搭公車因為可以在車上看書",
        "image": "images/q11_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they find the train is often late",
        "audio": "audio/q11_s2.mp3",
        "textZh": "第二位講者說他們覺得火車常常誤點",
        "image": "images/q11_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they prefer cycling because it saves money",
        "audio": "audio/q11_s3.mp3",
        "textZh": "第三位講者說他們偏好騎腳踏車因為省錢",
        "image": "images/q11_s3.webp"
      }
    ],
    "fullAudio": "audio/q11_full.mp3",
    "image": "images/q11.webp",
    "topicZh": "通勤上大學"
  },
  {
    "id": 12,
    "topic": "the new lecturer",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they think the lecturer is genuine and encouraging",
        "audio": "audio/q12_s1.mp3",
        "textZh": "第一位講者說他們覺得講師真誠且令人鼓舞",
        "image": "images/q12_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they appreciate the lecturer's clear and patient answers",
        "audio": "audio/q12_s2.mp3",
        "textZh": "第二位講者說他們欣賞講師清楚且有耐心的回答",
        "image": "images/q12_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they learn about personal growth in the lecturer's class",
        "audio": "audio/q12_s3.mp3",
        "textZh": "第三位講者說他們在講師的課上學到個人成長",
        "image": "images/q12_s3.webp"
      }
    ],
    "fullAudio": "audio/q12_full.mp3",
    "image": "images/q12.webp",
    "topicZh": "新講師"
  },
  {
    "id": 13,
    "topic": "final year accommodation",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they want to move back to campus because of a bad roommate experience",
        "audio": "audio/q13_s1.mp3",
        "textZh": "第一位講者說他們想搬回校園因為有不好的室友經驗",
        "image": "images/q13_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they plan to share a flat with ambitious friends",
        "audio": "audio/q13_s2.mp3",
        "textZh": "第二位講者說他們打算和有上進心的朋友合租公寓",
        "image": "images/q13_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they already have a friend to share a place with",
        "audio": "audio/q13_s3.mp3",
        "textZh": "第三位講者說他們已經有朋友可以一起合租",
        "image": "images/q13_s3.webp"
      }
    ],
    "fullAudio": "audio/q13_full.mp3",
    "image": "images/q13.webp",
    "topicZh": "大四住宿"
  },
  {
    "id": 14,
    "topic": "the 1500-word essay",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they already finish their essay by planning ahead",
        "audio": "audio/q14_s1.mp3",
        "textZh": "第一位講者說他們透過提前規劃已經完成論文",
        "image": "images/q14_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they suggest going to a café to brainstorm ideas",
        "audio": "audio/q14_s2.mp3",
        "textZh": "第二位講者說他們建議去咖啡廳腦力激盪想法",
        "image": "images/q14_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they recommend writing the main content first",
        "audio": "audio/q14_s3.mp3",
        "textZh": "第三位講者說他們推薦先寫主要內容",
        "image": "images/q14_s3.webp"
      }
    ],
    "fullAudio": "audio/q14_full.mp3",
    "image": "images/q14.webp",
    "topicZh": "1500 字論文"
  },
  {
    "id": 15,
    "topic": "staying active at university",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they find joining clubs too expensive",
        "audio": "audio/q15_s1.mp3",
        "textZh": "第一位講者說他們覺得加入社團太貴",
        "image": "images/q15_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they recommend using the campus swimming pool for free exercise",
        "audio": "audio/q15_s2.mp3",
        "textZh": "第二位講者說他們推薦使用校園游泳池免費運動",
        "image": "images/q15_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they enjoy walking in green areas to relax",
        "audio": "audio/q15_s3.mp3",
        "textZh": "第三位講者說他們喜歡在綠地散步放鬆",
        "image": "images/q15_s3.webp"
      }
    ],
    "fullAudio": "audio/q15_full.mp3",
    "image": "images/q15.webp",
    "topicZh": "在大學保持活力"
  },
  {
    "id": 16,
    "topic": "choosing a meeting place",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they want to meet in the library for borrowing books",
        "audio": "audio/q16_s1.mp3",
        "textZh": "第一位講者說他們想在圖書館見面借書",
        "image": "images/q16_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they think the library is too noisy",
        "audio": "audio/q16_s2.mp3",
        "textZh": "第二位講者說他們覺得圖書館太吵",
        "image": "images/q16_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they suggest moving to a quiet coffee shop after borrowing books",
        "audio": "audio/q16_s3.mp3",
        "textZh": "第三位講者說他們建議借完書後移到安靜的咖啡廳",
        "image": "images/q16_s3.webp"
      }
    ],
    "fullAudio": "audio/q16_full.mp3",
    "image": "images/q16.webp",
    "topicZh": "選擇見面地點"
  },
  {
    "id": 17,
    "topic": "asking for an extension",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they always finish work at the last minute",
        "audio": "audio/q17_s1.mp3",
        "textZh": "第一位講者說他們總是在最後一刻才完成作業",
        "image": "images/q17_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they mix up the deadline",
        "audio": "audio/q17_s2.mp3",
        "textZh": "第二位講者說他們搞混了截止日期",
        "image": "images/q17_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they get a two-day extension from the professor",
        "audio": "audio/q17_s3.mp3",
        "textZh": "第三位講者說他們從教授那裡獲得兩天延期",
        "image": "images/q17_s3.webp"
      }
    ],
    "fullAudio": "audio/q17_full.mp3",
    "image": "images/q17.webp",
    "topicZh": "要求延期"
  },
  {
    "id": 18,
    "topic": "preparing for final exams",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they consider forming a study group for support",
        "audio": "audio/q18_s1.mp3",
        "textZh": "第一位講者說他們考慮組讀書會互相支持",
        "image": "images/q18_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they suggest doing past papers to prepare",
        "audio": "audio/q18_s2.mp3",
        "textZh": "第二位講者說他們建議做考古題來準備",
        "image": "images/q18_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they believe getting enough sleep is important for memory",
        "audio": "audio/q18_s3.mp3",
        "textZh": "第三位講者說他們認為充足睡眠對記憶力很重要",
        "image": "images/q18_s3.webp"
      }
    ],
    "fullAudio": "audio/q18_full.mp3",
    "image": "images/q18.webp",
    "topicZh": "準備期末考"
  },
  {
    "id": 19,
    "topic": "dealing with noisy neighbours",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they cannot sleep because their neighbours play loud music",
        "audio": "audio/q19_s1.mp3",
        "textZh": "第一位講者說他們因為鄰居放大聲音樂而無法入睡",
        "image": "images/q19_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they suggest talking to the neighbours directly",
        "audio": "audio/q19_s2.mp3",
        "textZh": "第二位講者說他們建議直接跟鄰居溝通",
        "image": "images/q19_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they recommend reporting to the housing office",
        "audio": "audio/q19_s3.mp3",
        "textZh": "第三位講者說他們推薦向宿舍管理處舉報",
        "image": "images/q19_s3.webp"
      }
    ],
    "fullAudio": "audio/q19_full.mp3",
    "image": "images/q19.webp",
    "topicZh": "處理吵鬧的鄰居"
  },
  {
    "id": 20,
    "topic": "reading before class",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they find lectures difficult to follow",
        "audio": "audio/q20_s1.mp3",
        "textZh": "第一位講者說他們覺得上課內容很難跟上",
        "image": "images/q20_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they suggest going through the reading list first",
        "audio": "audio/q20_s2.mp3",
        "textZh": "第二位講者說他們建議先看閱讀清單",
        "image": "images/q20_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they recommend using the library website to find materials",
        "audio": "audio/q20_s3.mp3",
        "textZh": "第三位講者說他們推薦使用圖書館網站找資料",
        "image": "images/q20_s3.webp"
      }
    ],
    "fullAudio": "audio/q20_full.mp3",
    "image": "images/q20.webp",
    "topicZh": "課前閱讀"
  },
  {
    "id": 21,
    "topic": "free online courses",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they notice many famous universities now offer free courses",
        "audio": "audio/q21_s1.mp3",
        "textZh": "第一位講者說他們注意到很多名校現在提供免費課程",
        "image": "images/q21_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they think it seems too good to be true",
        "audio": "audio/q21_s2.mp3",
        "textZh": "第二位講者說他們覺得好到不像真的",
        "image": "images/q21_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they find many students enroll but few complete the courses",
        "audio": "audio/q21_s3.mp3",
        "textZh": "第三位講者說他們發現很多學生報名但很少人完成",
        "image": "images/q21_s3.webp"
      }
    ],
    "fullAudio": "audio/q21_full.mp3",
    "image": "images/q21.webp",
    "topicZh": "免費線上課程"
  },
  {
    "id": 22,
    "topic": "planning an essay",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they usually outline first before doing research",
        "audio": "audio/q22_s1.mp3",
        "textZh": "第一位講者說他們通常先列大綱再做研究",
        "image": "images/q22_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they believe understanding the question before writing is essential",
        "audio": "audio/q22_s2.mp3",
        "textZh": "第二位講者說他們認為寫作前先理解題目是必要的",
        "image": "images/q22_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they consider getting feedback on the draft most valuable",
        "audio": "audio/q22_s3.mp3",
        "textZh": "第三位講者說他們覺得獲得草稿回饋最有價值",
        "image": "images/q22_s3.webp"
      }
    ],
    "fullAudio": "audio/q22_full.mp3",
    "image": "images/q22.webp",
    "topicZh": "規劃論文"
  },
  {
    "id": 23,
    "topic": "the university bookstore",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they find e-books cause eye strain after long reading",
        "audio": "audio/q23_s1.mp3",
        "textZh": "第一位講者說他們覺得電子書長時間閱讀會眼睛疲勞",
        "image": "images/q23_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they prefer physical books for taking notes",
        "audio": "audio/q23_s2.mp3",
        "textZh": "第二位講者說他們偏好實體書方便做筆記",
        "image": "images/q23_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they believe the bookstore could have survived by selling stationery",
        "audio": "audio/q23_s3.mp3",
        "textZh": "第三位講者說他們認為書店如果賣文具可以存活下來",
        "image": "images/q23_s3.webp"
      }
    ],
    "fullAudio": "audio/q23_full.mp3",
    "image": "images/q23.webp",
    "topicZh": "大學書店"
  },
  {
    "id": 24,
    "topic": "group discussions",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they feel nervous speaking in front of classmates",
        "audio": "audio/q24_s1.mp3",
        "textZh": "第一位講者說他們在同學面前發言會緊張",
        "image": "images/q24_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they dislike it when one person takes over the discussion",
        "audio": "audio/q24_s2.mp3",
        "textZh": "第二位講者說他們不喜歡一個人主導整個討論",
        "image": "images/q24_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they enjoy group discussions because they can learn from peers",
        "audio": "audio/q24_s3.mp3",
        "textZh": "第三位講者說他們喜歡小組討論因為可以向同儕學習",
        "image": "images/q24_s3.webp"
      }
    ],
    "fullAudio": "audio/q24_full.mp3",
    "image": "images/q24.webp",
    "topicZh": "小組討論"
  },
  {
    "id": 25,
    "topic": "course selection",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they believe courses helpful for the major should come first",
        "audio": "audio/q25_s1.mp3",
        "textZh": "第一位講者說他們認為對主修有幫助的課應該優先",
        "image": "images/q25_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they value practical skill-building courses",
        "audio": "audio/q25_s2.mp3",
        "textZh": "第二位講者說他們重視培養實用技能的課程",
        "image": "images/q25_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they prefer choosing courses based on personal interest",
        "audio": "audio/q25_s3.mp3",
        "textZh": "第三位講者說他們偏好根據個人興趣選課",
        "image": "images/q25_s3.webp"
      }
    ],
    "fullAudio": "audio/q25_full.mp3",
    "image": "images/q25.webp",
    "topicZh": "選課"
  },
  {
    "id": 26,
    "topic": "social media",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they find social media distracting",
        "audio": "audio/q26_s1.mp3",
        "textZh": "第一位講者說他們覺得社群媒體令人分心",
        "image": "images/q26_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they notice students waste time scrolling",
        "audio": "audio/q26_s2.mp3",
        "textZh": "第二位講者說他們注意到學生浪費時間滑手機",
        "image": "images/q26_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they believe social media helps students stay connected",
        "audio": "audio/q26_s3.mp3",
        "textZh": "第三位講者說他們認為社群媒體幫助學生保持聯繫",
        "image": "images/q26_s3.webp"
      }
    ],
    "fullAudio": "audio/q26_full.mp3",
    "image": "images/q26.webp",
    "topicZh": "社群媒體"
  },
  {
    "id": 27,
    "topic": "large group lectures",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they think large lectures help share content efficiently",
        "audio": "audio/q27_s1.mp3",
        "textZh": "第一位講者說他們認為大班講座能有效分享內容",
        "image": "images/q27_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they find lectures boring",
        "audio": "audio/q27_s2.mp3",
        "textZh": "第二位講者說他們覺得講座很無聊",
        "image": "images/q27_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they believe face-to-face interaction is valuable",
        "audio": "audio/q27_s3.mp3",
        "textZh": "第三位講者說他們認為面對面互動很有價值",
        "image": "images/q27_s3.webp"
      }
    ],
    "fullAudio": "audio/q27_full.mp3",
    "image": "images/q27.webp",
    "topicZh": "大班講座"
  },
  {
    "id": 28,
    "topic": "teaching styles",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they prefer interactive classes with technology",
        "audio": "audio/q28_s1.mp3",
        "textZh": "第一位講者說他們偏好使用科技的互動式課堂",
        "image": "images/q28_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they think a balance between information and discussion is needed",
        "audio": "audio/q28_s2.mp3",
        "textZh": "第二位講者說他們認為需要在資訊和討論之間取得平衡",
        "image": "images/q28_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they find real-world examples helpful for understanding",
        "audio": "audio/q28_s3.mp3",
        "textZh": "第三位講者說他們覺得真實案例有助於理解",
        "image": "images/q28_s3.webp"
      }
    ],
    "fullAudio": "audio/q28_full.mp3",
    "image": "images/q28.webp",
    "topicZh": "教學風格"
  },
  {
    "id": 29,
    "topic": "taking a gap year",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they support taking a gap year for real-world experience",
        "audio": "audio/q29_s1.mp3",
        "textZh": "第一位講者說他們支持休學一年獲得真實世界經驗",
        "image": "images/q29_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they believe it helps personal growth",
        "audio": "audio/q29_s2.mp3",
        "textZh": "第二位講者說他們認為這有助於個人成長",
        "image": "images/q29_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they worry about losing momentum",
        "audio": "audio/q29_s3.mp3",
        "textZh": "第三位講者說他們擔心會失去學習動力",
        "image": "images/q29_s3.webp"
      }
    ],
    "fullAudio": "audio/q29_full.mp3",
    "image": "images/q29.webp",
    "topicZh": "休學一年（Gap Year）"
  },
  {
    "id": 30,
    "topic": "joining student clubs",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they enjoy joining clubs to make friends",
        "audio": "audio/q30_s1.mp3",
        "textZh": "第一位講者說他們喜歡加入社團交朋友",
        "image": "images/q30_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they decide not to join because clubs are too time-consuming",
        "audio": "audio/q30_s2.mp3",
        "textZh": "第二位講者說他們決定不加入因為社團太花時間",
        "image": "images/q30_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they plan to join because club activities build useful skills",
        "audio": "audio/q30_s3.mp3",
        "textZh": "第三位講者說他們打算加入因為社團活動培養實用技能",
        "image": "images/q30_s3.webp"
      }
    ],
    "fullAudio": "audio/q30_full.mp3",
    "image": "images/q30.webp",
    "topicZh": "加入學生社團"
  },
  {
    "id": 31,
    "topic": "the development of AI",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they feel excited about generative AI",
        "audio": "audio/q31_s1.mp3",
        "textZh": "第一位講者說他們對生成式 AI 感到興奮",
        "image": "images/q31_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they think AI is useful for repetitive tasks",
        "audio": "audio/q31_s2.mp3",
        "textZh": "第二位講者說他們認為 AI 對重複性工作很有用",
        "image": "images/q31_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they worry AI could lead to job losses",
        "audio": "audio/q31_s3.mp3",
        "textZh": "第三位講者說他們擔心 AI 可能導致失業",
        "image": "images/q31_s3.webp"
      }
    ],
    "fullAudio": "audio/q31_full.mp3",
    "image": "images/q31.webp",
    "topicZh": "AI 的發展"
  },
  {
    "id": 32,
    "topic": "new experiences at university",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they come from a small town and find everything exciting",
        "audio": "audio/q32_s1.mp3",
        "textZh": "第一位講者說他們來自小鎮覺得一切都很新鮮",
        "image": "images/q32_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they do not enjoy social events",
        "audio": "audio/q32_s2.mp3",
        "textZh": "第二位講者說他們不喜歡社交活動",
        "image": "images/q32_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they believe balancing activities with study is important",
        "audio": "audio/q32_s3.mp3",
        "textZh": "第三位講者說他們認為平衡課外活動和學習很重要",
        "image": "images/q32_s3.webp"
      }
    ],
    "fullAudio": "audio/q32_full.mp3",
    "image": "images/q32.webp",
    "topicZh": "大學新體驗"
  },
  {
    "id": 33,
    "topic": "volunteering experiences",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they develop leadership skills by being an orientation leader",
        "audio": "audio/q33_s1.mp3",
        "textZh": "第一位講者說他們當迎新領隊培養了領導力",
        "image": "images/q33_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they learn useful skills by volunteering at the library",
        "audio": "audio/q33_s2.mp3",
        "textZh": "第二位講者說他們在圖書館當志工學到實用技能",
        "image": "images/q33_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they find working at an animal shelter emotionally demanding",
        "audio": "audio/q33_s3.mp3",
        "textZh": "第三位講者說他們覺得在動物收容所工作情感上很辛苦",
        "image": "images/q33_s3.webp"
      }
    ],
    "fullAudio": "audio/q33_full.mp3",
    "image": "images/q33.webp",
    "topicZh": "志工經驗"
  },
  {
    "id": 34,
    "topic": "library complaints",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they notice students watching videos without headphones",
        "audio": "audio/q34_s1.mp3",
        "textZh": "第一位講者說他們注意到學生不戴耳機看影片",
        "image": "images/q34_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they suggest setting up a silent zone",
        "audio": "audio/q34_s2.mp3",
        "textZh": "第二位講者說他們建議設立安靜區域",
        "image": "images/q34_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they complain about strong-smelling food in the library",
        "audio": "audio/q34_s3.mp3",
        "textZh": "第三位講者說他們抱怨圖書館裡有人帶味道很重的食物",
        "image": "images/q34_s3.webp"
      }
    ],
    "fullAudio": "audio/q34_full.mp3",
    "image": "images/q34.webp",
    "topicZh": "圖書館投訴"
  },
  {
    "id": 35,
    "topic": "digital materials",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they prefer physical textbooks because they cause less eye strain",
        "audio": "audio/q35_s1.mp3",
        "textZh": "第一位講者說他們偏好實體教科書因為比較不傷眼",
        "image": "images/q35_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they find digital materials more efficient with search functions",
        "audio": "audio/q35_s2.mp3",
        "textZh": "第二位講者說他們覺得數位教材有搜尋功能更有效率",
        "image": "images/q35_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they believe reading from screens makes it harder to absorb content",
        "audio": "audio/q35_s3.mp3",
        "textZh": "第三位講者說他們認為看螢幕更難吸收內容",
        "image": "images/q35_s3.webp"
      }
    ],
    "fullAudio": "audio/q35_full.mp3",
    "image": "images/q35.webp",
    "topicZh": "數位教材"
  },
  {
    "id": 36,
    "topic": "draft assignments",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they write too much but miss the key points",
        "audio": "audio/q36_s1.mp3",
        "textZh": "第一位講者說他們寫太多但遺漏重點",
        "image": "images/q36_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they try to include every detail",
        "audio": "audio/q36_s2.mp3",
        "textZh": "第二位講者說他們試圖涵蓋每個細節",
        "image": "images/q36_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they recommend making a clear outline first",
        "audio": "audio/q36_s3.mp3",
        "textZh": "第三位講者說他們推薦先列清楚的大綱",
        "image": "images/q36_s3.webp"
      }
    ],
    "fullAudio": "audio/q36_full.mp3",
    "image": "images/q36.webp",
    "topicZh": "作業草稿"
  },
  {
    "id": 37,
    "topic": "the new library",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they are impressed by the natural light in the building",
        "audio": "audio/q37_s1.mp3",
        "textZh": "第一位講者說他們對建築裡的自然光印象深刻",
        "image": "images/q37_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they find it too noisy",
        "audio": "audio/q37_s2.mp3",
        "textZh": "第二位講者說他們覺得太吵了",
        "image": "images/q37_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they think smaller meeting rooms would be better",
        "audio": "audio/q37_s3.mp3",
        "textZh": "第三位講者說他們覺得小型會議室會更好",
        "image": "images/q37_s3.webp"
      }
    ],
    "fullAudio": "audio/q37_full.mp3",
    "image": "images/q37.webp",
    "topicZh": "新圖書館"
  },
  {
    "id": 38,
    "topic": "the new timetable",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they have many early morning classes",
        "audio": "audio/q38_s1.mp3",
        "textZh": "第一位講者說他們有很多早晨的課",
        "image": "images/q38_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they need coffee to stay awake for early classes",
        "audio": "audio/q38_s2.mp3",
        "textZh": "第二位講者說他們需要咖啡才能在早課保持清醒",
        "image": "images/q38_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they prefer having classes in the afternoon",
        "audio": "audio/q38_s3.mp3",
        "textZh": "第三位講者說他們偏好下午的課",
        "image": "images/q38_s3.webp"
      }
    ],
    "fullAudio": "audio/q38_full.mp3",
    "image": "images/q38.webp",
    "topicZh": "新課表"
  },
  {
    "id": 39,
    "topic": "where to have lunch",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they suggest the school cafeteria because it is nearby",
        "audio": "audio/q39_s1.mp3",
        "textZh": "第一位講者說他們建議去學校餐廳因為比較近",
        "image": "images/q39_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they are very hungry and do not mind where they go",
        "audio": "audio/q39_s2.mp3",
        "textZh": "第二位講者說他們很餓不在意去哪裡",
        "image": "images/q39_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they prefer an off-campus restaurant",
        "audio": "audio/q39_s3.mp3",
        "textZh": "第三位講者說他們偏好校外的餐廳",
        "image": "images/q39_s3.webp"
      }
    ],
    "fullAudio": "audio/q39_full.mp3",
    "image": "images/q39.webp",
    "topicZh": "午餐去哪吃"
  },
  {
    "id": 40,
    "topic": "the sociology conference",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they feel excited about the conference",
        "audio": "audio/q40_s1.mp3",
        "textZh": "第一位講者說他們對研討會感到興奮",
        "image": "images/q40_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they suggest doing a joint presentation because their topics overlap",
        "audio": "audio/q40_s2.mp3",
        "textZh": "第二位講者說他們建議聯合報告因為主題重疊",
        "image": "images/q40_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they want to practice beforehand to get feedback",
        "audio": "audio/q40_s3.mp3",
        "textZh": "第三位講者說他們想事先練習以獲得回饋",
        "image": "images/q40_s3.webp"
      }
    ],
    "fullAudio": "audio/q40_full.mp3",
    "image": "images/q40.webp",
    "topicZh": "社會學研討會"
  },
  {
    "id": 41,
    "topic": "campus sustainability",
    "speakers": [
      {
        "id": 1,
        "text": "The first speaker said they believe shared bikes can help the environment",
        "audio": "audio/q41_s1.mp3",
        "textZh": "第一位講者說他們認為共享腳踏車有助環保",
        "image": "images/q41_s1.webp"
      },
      {
        "id": 2,
        "text": "The second speaker said they encourage cycling for environmental benefits",
        "audio": "audio/q41_s2.mp3",
        "textZh": "第二位講者說他們鼓勵騎腳踏車以獲得環保效益",
        "image": "images/q41_s2.webp"
      },
      {
        "id": 3,
        "text": "The third speaker said they suggest setting up recycling points on campus",
        "audio": "audio/q41_s3.mp3",
        "textZh": "第三位講者說他們建議在校園設立回收站",
        "image": "images/q41_s3.webp"
      }
    ],
    "fullAudio": "audio/q41_full.mp3",
    "image": "images/q41.webp",
    "topicZh": "校園永續發展"
  }
];
