import { CustomImportedWfd } from '../utils/srs';

export interface WfdItem {
  id: number;
  text: string;
  textZh: string;
  freqTag: '🔥 11月新預測' | '⚡ 螢火蟲超高頻' | '💎 歷年必考經典' | '📥 自訂機經';
  trapNote: string;
  mnemonic: string;
  distractors: [string, string];
}

export const WFD_QUESTIONS: WfdItem[] = [
  {"id": 1, "text": "All industries consist of input, process, output and feedback.", "textZh": "所有產業皆由輸入、處理、輸出與回饋所組成。", "freqTag": "🔥 11月新預測", "trapNote": "主詞 industries 複數故 consist 不加 s；工程師最熟的 IPO+Feedback 系統模型！", "mnemonic": "想像你在寫系統架構圖：所有產業就是一個巨大 Function —— 丟進 Input → 跑 Process → 吐出 Output → 收使用者 Feedback！", "distractors": ["consists", "outputs"]},
  {"id": 2, "text": "Statistically speaking, the likelihood of the result is extremely low.", "textZh": "從統計學角度來看，該結果發生的可能性極低。", "freqTag": "🔥 11月新預測", "trapNote": "Statistically (-ally 雙 l)；likelihood (可能性，單數故動詞用 is)。", "mnemonic": "彩券頭獎統計學：Statistically 算起來中獎 likelihood 根本低到哭！", "distractors": ["statistical", "are"]},
  {"id": 3, "text": "His appointment to the Minister of Culture is seen as a demotion.", "textZh": "他被任命為文化部長一事被外界視為降職。", "freqTag": "⚡ 螢火蟲超高頻", "trapNote": "螢火蟲經典機經 #131500！appointment (雙 p)；Minister / Culture 大寫；demotion (降職)。", "mnemonic": "升官變發配邊疆：被派去管文化部 (Minister of Culture)，表面任命 appointment 其實是暗降 demotion！", "distractors": ["promotion", "appointed"]},
  {"id": 4, "text": "Islands in polar regions are ideal for astrophysicists and meteorologists to carry out field experiments.", "textZh": "極地島嶼非常適合天體物理學家與氣象學家進行實地實驗。", "freqTag": "🔥 11月新預測", "trapNote": "魔王長句拼寫：astrophysicists (複數 s) 與 meteorologists (氣象學家，複數 s)！", "mnemonic": "企鵝陪科學家加班：極地小島沒有光害，天體物理學家看星星、氣象學家吹冷風做實驗！", "distractors": ["region", "experiment"]},
  {"id": 5, "text": "Tact is the knack of making a point without making an enemy.", "textZh": "圓滑手腕就是既能表達觀點又不樹敵的獨門絕活。", "freqTag": "🔥 11月新預測", "trapNote": "Tact (圓滑機智) 與 knack (訣竅 k 不發音！) 押韻超好記！", "mnemonic": "資深工程師 Code Review 生存術：Tact 就是嘴完同事 Bug 卻不變敵人 (without making an enemy) 的神技 knack！", "distractors": ["tacts", "enemies"]},
  {"id": 6, "text": "Students must submit their assignments before the deadline on Friday.", "textZh": "學生必須在週五截止期限前繳交作業。", "freqTag": "⚡ 螢火蟲超高頻", "trapNote": "複數 Students / assignments；專有名詞 Friday 務必大寫。", "mnemonic": "週五下班前不交 PR (assignments)，週末就別想放假！", "distractors": ["student", "assignment"]},
  {"id": 7, "text": "The university library holds a wide collection of historical manuscripts.", "textZh": "大學圖書館館藏豐富的歷史手稿。", "freqTag": "⚡ 螢火蟲超高頻", "trapNote": "單數主詞 library 配 holds；manuscripts 記得加 s。", "mnemonic": "霍格華茲禁書區：大學圖書館鎖著一整櫃泛黃歷史手稿 manuscripts！", "distractors": ["hold", "manuscript"]},
  {"id": 8, "text": "Climate change is becoming an acceptable phenomenon amongst reputable scientists.", "textZh": "氣候變遷在知名科學家之間正成為被普遍認可的現象。", "freqTag": "⚡ 螢火蟲超高頻", "trapNote": "必考拼字：acceptable (-able)、phenomenon (單數)、scientists (複數)。", "mnemonic": "連最挑剔的大牌科學家 (reputable scientists) 都點頭承認氣候變遷這個現象 phenomenon！", "distractors": ["phenomena", "scientist"]},
  {"id": 9, "text": "All experimental procedures are outlined in the laboratory manual.", "textZh": "所有實驗步驟皆已列於實驗室手冊中。", "freqTag": "🔥 11月新預測", "trapNote": "procedures 複數配 are outlined (-ed 被動)！", "mnemonic": "進 Lab 先翻 README 手冊 (laboratory manual)，所有步驟 procedures 都畫好重點 outlined 了！", "distractors": ["procedure", "outline"]},
  {"id": 10, "text": "Please keep the keys with you because the front door often locks automatically.", "textZh": "請隨身攜帶鑰匙，因為前門經常會自動上鎖。", "freqTag": "🔥 11月新預測", "trapNote": "locks 第三人稱單數加 s；automatically (-ally)。", "mnemonic": "澳洲公寓慘案：出門倒垃圾沒帶 keys，大門啪一聲 locks automatically 直接在門外吹風！", "distractors": ["lock", "automatic"]},
  {"id": 11, "text": "The aerial photographs were promptly registered for thorough evaluation.", "textZh": "空拍照片已迅速登記以進行徹底評估。", "freqTag": "⚡ 螢火蟲超高頻", "trapNote": "四大魔王拼字齊聚：aerial (空拍)、promptly、registered (-ed)、thorough (徹底，別拼成 through)！", "mnemonic": "無人機拍完空拍照 (aerial photographs)，馬上掛號 registered 送去徹底體檢 thorough evaluation！", "distractors": ["through", "register"]},
  {"id": 12, "text": "Mutually exclusive events can be described as either complementary or opposite.", "textZh": "互斥事件可被描述為互補或相反。", "freqTag": "⚡ 螢火蟲超高頻", "trapNote": "described (-ed)；complementary 中間是 e (互補)，千萬別寫成 i (讚美)！", "mnemonic": "機率課丟硬幣：正面跟反面互斥 (mutually exclusive)，不是互補就是對立！", "distractors": ["complimentary", "describe"]},
  {"id": 13, "text": "A preliminary bibliography is due the week before the spring break.", "textZh": "初步參考書目須於春假前一週繳交。", "freqTag": "⚡ 螢火蟲超高頻", "trapNote": "preliminary (初步的) + bibliography (參考書目) 必背雙學術詞。", "mnemonic": "想放春假 spring break？前一週先把參考書目草稿 preliminary bibliography 交出來！", "distractors": ["bibliographies", "preliminaries"]},
  {"id": 14, "text": "The massive accumulation of data was converted into a communicable argument.", "textZh": "龐大的數據累積被轉化為可理解溝通的論點。", "freqTag": "⚡ 螢火蟲超高頻", "trapNote": "accumulation 雙 c；was converted (-ed)；communicable。", "mnemonic": "大數據工程師日常：把髒亂巨量資料 accumulation 轉檔 converted 成老闆聽得懂的論點！", "distractors": ["convert", "accumulate"]},
  {"id": 15, "text": "Extension requests for the assignment must be submitted before the deadline.", "textZh": "作業延期申請必須在截止日前提交。", "freqTag": "🔥 11月新預測", "trapNote": "Extension requests (複數 s)；submitted (雙 t + ed)。", "mnemonic": "想壓線求情延期？連延期申請單 (extension requests) 本身都有 deadline 啊！", "distractors": ["request", "submit"]},
  {"id": 16, "text": "The marine environment has been destroyed by pollution and unsustainable development.", "textZh": "海洋環境已因污染與不可持續的開發而遭到破壞。", "freqTag": "🔥 11月新預測", "trapNote": "has been destroyed (-ed)；unsustainable (un-sustain-able)。", "mnemonic": "大堡礁哭泣：污染加上亂蓋渡假村 (unsustainable development) 毀了海洋環境！", "distractors": ["destroy", "environments"]},
  {"id": 17, "text": "Our courses are designed to enhance critical and independent thinking skills.", "textZh": "我們的課程旨在強化批判性與獨立思考能力。", "freqTag": "🔥 11月新預測", "trapNote": "courses / skills 複數；are designed (-ed 被動)。", "mnemonic": "澳洲大學招生廣告台詞：課程專門設計來升級你的獨立思考技能包！", "distractors": ["course", "design"]},
  {"id": 18, "text": "Industry experts will discuss job opportunities in an automated workforce.", "textZh": "產業專家將探討自動化勞動力市場中的就業機會。", "freqTag": "🔥 11月新預測", "trapNote": "experts / opportunities 複數；an automated (-ed) workforce。", "mnemonic": "AI 時代論壇：專家上台聊機器人搶飯碗 (automated workforce) 後還有哪些職缺！", "distractors": ["expert", "automate"]},
  {"id": 19, "text": "The employment demand in engineering is increasing rapidly.", "textZh": "工程領域的就業需求正快速增長。", "freqTag": "🔥 11月新預測", "trapNote": "demand 單數配 is increasing；澳洲技術移民工程師利多句！", "mnemonic": "看著這句笑出來：工程師職缺需求正在澳洲火箭式飆升 increasing rapidly！", "distractors": ["demands", "rapid"]},
  {"id": 20, "text": "All the educational reforms have been inadequately implemented.", "textZh": "所有教育改革都未被妥善落實。", "freqTag": "🔥 11月新預測", "trapNote": "reforms 複數配 have been；inadequately (不足地) + implemented (-ed)。", "mnemonic": "政策寫得像詩，執行起來一團糟：教改全部 inadequately implemented！", "distractors": ["implement", "reform"]},
  {"id": 21, "text": "Archaeologists discovered tools and other artifacts near the tombs.", "textZh": "考古學家在古墓附近發現了工具與其他文物。", "freqTag": "🔥 11月新預測", "trapNote": "Archaeologists (aeo 拼法！)；discovered (-ed)；artifacts / tombs 複數。", "mnemonic": "蘿拉古墓奇兵：在古墓 tombs 旁邊挖出遠古工具跟神器 artifacts！", "distractors": ["artifact", "discover"]},
  {"id": 22, "text": "Requests for late submissions will not be accepted under any circumstances.", "textZh": "在任何情況下皆不接受遲交申請。", "freqTag": "🔥 11月新預測", "trapNote": "Requests / submissions / circumstances 三個複數 s 一個都不能少！", "mnemonic": "冷血教授公告：遲交？門都沒有！under any circumstances 絕不收件！", "distractors": ["submission", "circumstance"]},
  {"id": 23, "text": "The summer course was canceled due to insufficient enrolments.", "textZh": "暑修課程因報名人數不足而取消。", "freqTag": "🔥 11月新預測", "trapNote": "insufficient (雙 f)；enrolments (複數 s，英澳單 l 或美雙 l 皆給分)。", "mnemonic": "暑假大家只想去海邊衝浪，沒人選課 (insufficient enrolments) 直接倒班！", "distractors": ["sufficient", "enrolment"]},
  {"id": 24, "text": "Studies showed there is a positive correlation between the two variables.", "textZh": "研究顯示這兩個變數之間存在正相關。", "freqTag": "🔥 11月新預測", "trapNote": "showed 過去式；correlation (雙 r)；variables 複數。", "mnemonic": "刷題數與 PTE 分數這兩個 variables 呈現完美正相關 positive correlation！", "distractors": ["variable", "correlations"]},
  {"id": 25, "text": "The director of the gallery was grateful for the anonymous donation.", "textZh": "美術館館長對這筆匿名捐款深表感激。", "freqTag": "🔥 11月新預測", "trapNote": "grateful (注意是 grate 不是 great！)；anonymous (匿名的)。", "mnemonic": "神秘富豪半夜塞支票給美術館，館長超感恩 grateful 這個匿名課長 anonymous donation！", "distractors": ["greatful", "donations"]},
  {"id": 26, "text": "The earth's atmosphere is primarily composed of oxygen and nitrogen gases.", "textZh": "地球大氣層主要由氧氣與氮氣組成。", "freqTag": "🔥 11月新預測", "trapNote": "primarily；is composed (-ed) of；gases (一個 s 加 es！)。", "mnemonic": "國中理化送分題：大氣層就是氧氣＋氮氣兩種 gases 調出來的雞尾酒！", "distractors": ["composes", "gasses"]},
  {"id": 27, "text": "Food containing overabundant calories supplies little or no nutritional value.", "textZh": "熱量過剩的垃圾食物幾乎不提供任何營養價值。", "freqTag": "🔥 11月新預測", "trapNote": "主詞是單數不可數 Food，所以動詞是 supplies (第三人稱單數)！", "mnemonic": "深夜炸雞快樂餐：熱量爆表 overabundant calories，營養價值卻趨近於零！", "distractors": ["supply", "calorie"]},
  {"id": 28, "text": "Many diseases on the list have been eradicated.", "textZh": "清單上的許多疾病已被根除。", "freqTag": "🔥 11月新預測", "trapNote": "diseases 複數配 have been；eradicated (連根拔除，單 r)。", "mnemonic": "人類醫學成就解鎖：傳染病清單被一個個劃掉 eradicated！", "distractors": ["disease", "eradicate"]},
  {"id": 29, "text": "The investment will be dedicated to improving transport infrastructure.", "textZh": "該筆投資將專門用於改善交通基礎設施。", "freqTag": "🔥 11月新預測", "trapNote": "dedicated to 後接動名詞 improving (-ing)！千萬別寫成 improve！", "mnemonic": "墨爾本修地鐵：大筆資金 dedicated to improving 交通基建（to 是介系詞接 V-ing！）。", "distractors": ["improve", "dedicate"]},
  {"id": 30, "text": "Scientists recognized the different ice types according to the water molecule content.", "textZh": "科學家根據水分子含量辨識出不同的冰層類型。", "freqTag": "🔥 11月新預測", "trapNote": "recognized (-ed)；types 複數；molecule 單數修飾名詞 content。", "mnemonic": "愛斯基摩人有十種冰的名字，科學家則看水分子含量 molecule content 分類！", "distractors": ["molecules", "recognize"]},
  {"id": 31, "text": "Her design incorporates the best aspects of modern architecture.", "textZh": "她的設計融合了現代建築最優秀的元素。", "freqTag": "🔥 11月新預測", "trapNote": "單數主詞 design 配 incorporates (加 s)；aspects 複數；architecture。", "mnemonic": "雪梨歌劇院等級神作：把現代建築最讚的精華 aspects 全部 incorporates 進來！", "distractors": ["incorporate", "aspect"]},
  {"id": 32, "text": "Universities need to secure grants for research subjects.", "textZh": "各大學需要為研究課題爭取經費補助。", "freqTag": "🔥 11月新預測", "trapNote": "Universities / grants / subjects 三個複數！", "mnemonic": "校長日常化緣：到處寫計畫搶經費 grants 養實驗室！", "distractors": ["grant", "subject"]},
  {"id": 33, "text": "Chemical reactions occur when substances combine or change.", "textZh": "當物質結合或產生變化時就會發生化學反應。", "freqTag": "🔥 11月新預測", "trapNote": "occur (雙 c 單 r)；substances 複數故 combine 不加 s。", "mnemonic": "把曼陀珠丟進可樂：兩種物質 substances 一結合就噴發化學反應！", "distractors": ["occurs", "substance"]},
  {"id": 34, "text": "Coursework gives students the chance to thoroughly explore the subject.", "textZh": "平時課業讓學生有機會深入探索該學科。", "freqTag": "🔥 11月新預測", "trapNote": "Coursework 合寫不可數故 gives 加 s；thoroughly (徹底地)。", "mnemonic": "別抱怨作業多，Coursework 是讓你徹底挖寶 thoroughly explore 的機會！", "distractors": ["give", "throughly"]},
  {"id": 35, "text": "Class participation is an important part of your final grade.", "textZh": "課堂參與是你期末總成績的重要一環。", "freqTag": "🔥 11月新預測", "trapNote": "participation 單數配 is；an important part。", "mnemonic": "在澳洲上課別當隱形人，舉手發言 participation 直接佔期末分數！", "distractors": ["participations", "grades"]},
  {"id": 36, "text": "Mathematics provides a foundation for understanding and analyzing data.", "textZh": "數學為理解與分析數據提供了基礎。", "freqTag": "🔥 11月新預測", "trapNote": "學科名 Mathematics 結尾有 s 但視為單數，動詞 provides 必加 s！", "mnemonic": "寫機器學習前先拜數學大神：Mathematics (單數！) 給你分析資料的地基！", "distractors": ["provide", "foundations"]},
  {"id": 37, "text": "When you attend a job interview, punctuality is the key.", "textZh": "參加工作面試時，準時是關鍵。", "freqTag": "🔥 11月新預測", "trapNote": "punctuality (準時，名詞)。", "mnemonic": "面試遲到直接涼涼，準時進會議室 punctuality 才是拿到 Offer 的鑰匙！", "distractors": ["punctual", "interviews"]},
  {"id": 38, "text": "The students are supposed to assemble in the seminar hall before the announcement.", "textZh": "學生們應在公告發布前於研討廳集合。", "freqTag": "🔥 11月新預測", "trapNote": "are supposed (-ed 連音極輕必補！) to assemble (集合)。", "mnemonic": "像復仇者聯盟喊 Assemble！廣播前全體學生到研討廳集合！", "distractors": ["suppose", "assembled"]},
  {"id": 39, "text": "Social psychology is concerned with the understanding of human behaviors.", "textZh": "社會心理學關注對人類行為的理解。", "freqTag": "🔥 11月新預測", "trapNote": "is concerned (-ed) with；psychology 開頭 p 不發音！", "mnemonic": "讀心術學科：Social psychology 專門研究人類各種迷之行為！", "distractors": ["concern", "behavior"]},
  {"id": 40, "text": "A mixture is defined as a compound of chemically separate parts.", "textZh": "混合物被定義為由化學上各自獨立成分組成的複合物。", "freqTag": "🔥 11月新預測", "trapNote": "is defined (-ed)；chemically (-ally)；separate (中間是 a 不是 e：se-pa-rate！)。", "mnemonic": "拼字大魔王 separate：記住「裡頭有隻老鼠 a rat」(sep-a-rate) 永遠不會拼錯！", "distractors": ["seperate", "define"]},
  {"id": 41, "text": "The new law was harder to impose than the government thought.", "textZh": "新法律的推行比政府原先預想的更加困難。", "freqTag": "🔥 11月新預測", "trapNote": "impose (強制推行)；government 中間有 n！", "mnemonic": "政客拍腦袋立法，結果推行起來 harder to impose 直接踢鐵板！", "distractors": ["governments", "imposed"]},
  {"id": 42, "text": "The department has a higher proportion of postgraduate students.", "textZh": "該系所擁有較高比例的研究所學生。", "freqTag": "🔥 11月新預測", "trapNote": "proportion (比例)；postgraduate 不加 s 修飾複數 students。", "mnemonic": "資工系走廊望過去全是碩博士生 postgraduate students！", "distractors": ["proportions", "student"]},
  {"id": 43, "text": "It is really a comprehensive program that covers both theory and practice.", "textZh": "這確實是一門兼顧理論與實務的完整學程。", "freqTag": "🔥 11月新預測", "trapNote": "單數 program 配關係子句動詞 covers (加 s)；comprehensive。", "mnemonic": "理論跟寫 Code 實作全包了，超全方位 comprehensive 的神課！", "distractors": ["cover", "practices"]},
  {"id": 44, "text": "The nation achieved prosperity by opening its exports for trade.", "textZh": "該國透過開放出口貿易實現了繁榮。", "freqTag": "🔥 11月新預測", "trapNote": "過去式 achieved；prosperity (繁榮)；its 所有格不加撇號！", "mnemonic": "澳洲靠賣鐵礦跟羊毛出口 exports 發大財 achieved prosperity！", "distractors": ["it's", "achieve"]},
  {"id": 45, "text": "Optional tutorials are offered in the final week of the term.", "textZh": "學期最後一週會提供選修輔導課。", "freqTag": "🔥 11月新預測", "trapNote": "tutorials 複數配 are offered (-ed)。", "mnemonic": "期末考前抱佛腳救星：最後一週加開自由參加的輔導課 optional tutorials！", "distractors": ["tutorial", "offer"]},
  {"id": 46, "text": "Native speakers are always exempted from the exam for their own language.", "textZh": "母語人士在自己母語的考試中總是獲得免試。", "freqTag": "🔥 11月新預測", "trapNote": "exempted (-ed 豁免)。", "mnemonic": "叫澳洲人去考 PTE 英文？當然直接免試 exempted 啦！", "distractors": ["exempt", "speaker"]},
  {"id": 47, "text": "The vocabulary that has peculiar meanings is called jargon.", "textZh": "具有特殊專業含義的詞彙被稱為行話術語。", "freqTag": "🔥 11月新預測", "trapNote": "vocabulary 不可數單數配 has / is called；peculiar (獨特奇特的)；jargon (行話)。", "mnemonic": "工程師滿嘴 Kubernetes、Idempotent，外行人聽不懂的咒語就叫 jargon！", "distractors": ["jargons", "call"]},
  {"id": 48, "text": "Before choosing your university courses, you should consider your future career.", "textZh": "在選擇大學課程前，你應該先思考未來的職涯方向。", "freqTag": "🔥 11月新預測", "trapNote": "courses 複數；choosing 去 e 加 ing。", "mnemonic": "選錯科系畢業吃土，選課前先想想能不能辦澳洲技術移民 future career！", "distractors": ["course", "choose"]},
  {"id": 49, "text": "The university has evolved into a modern institution of higher education.", "textZh": "這所大學已演變為一所現代化的高等教育機構。", "freqTag": "🔥 11月新預測", "trapNote": "has evolved (-ed) into；institution。", "mnemonic": "百年老校裝上高速 Wi-Fi 跟 AI 實驗室，華麗進化 evolved into 現代學府！", "distractors": ["evolve", "institutions"]},
  {"id": 50, "text": "The new paper challenged many previously accepted theories.", "textZh": "這篇新論文挑戰了許多過去公認的理論。", "freqTag": "🔥 11月新預測", "trapNote": "過去式 challenged (-ed) + 過去分詞形容詞 accepted (-ed)；theories 複數。", "mnemonic": "學界震撼彈：一篇新 Paper 直接打臉老前輩們公認的 accepted theories！", "distractors": ["challenge", "theory"]},
  {"id": 51, "text": "Mature students usually adapt to university life extremely well.", "textZh": "成年回流學生通常能非常良好地適應大學生活。", "freqTag": "🔥 11月新預測", "trapNote": "adapt (適應，中間是 a) 別寫成 adopt (領養/採用)！", "mnemonic": "出社會工作過再回學校唸書的 mature students，時間管理大師超快適應 adapt！", "distractors": ["adopt", "adapts"]},
  {"id": 52, "text": "The industrial revolution in Europe was driven by steam technology.", "textZh": "歐洲工業革命是由蒸汽技術所推動的。", "freqTag": "🔥 11月新預測", "trapNote": "was driven by (被動)；revolution。", "mnemonic": "瓦特燒開水壺冒蒸氣 steam technology，直接推著歐洲工業革命往前衝！", "distractors": ["drove", "technologies"]},
  {"id": 53, "text": "Without a doubt, this theory has a number of limitations.", "textZh": "毫無疑問地，這項理論存在若干限制。", "freqTag": "🔥 11月新預測", "trapNote": "a number of 後接複數 limitations！", "mnemonic": "再牛的演算法也有邊界條件，毫無疑問有一堆 limitations！", "distractors": ["limitation", "doubts"]},
  {"id": 54, "text": "Banks charge interest on the money they lend to customers.", "textZh": "銀行對借給客戶的資金收取利息。", "freqTag": "🔥 11月新預測", "trapNote": "Banks 複數配 charge；interest 不可數不加 s；customers 複數。", "mnemonic": "銀行不是慈善機構，借錢 lend 給你當然要收利息 charge interest！", "distractors": ["charges", "interests"]},
  {"id": 55, "text": "Essays and assignments are spread out across the academic year.", "textZh": "論文與作業平均分散在整個學年當中。", "freqTag": "🔥 11月新預測", "trapNote": "spread 三態同形（千萬別自創 spreaded！）。", "mnemonic": "佛心課綱：作業不會擠在同一週爆炸，而是整學年平均攤開 spread out！", "distractors": ["spreaded", "essay"]},
  {"id": 56, "text": "Measures must be taken to prevent the unemployment rate from increasing.", "textZh": "必須採取措施防止失業率上升。", "freqTag": "🔥 11月新預測", "trapNote": "Measures (措施，複數) must be taken；prevent ... from V-ing。", "mnemonic": "央行緊急救市：趕快出招 take measures 擋住失業率往上衝！", "distractors": ["measure", "increase"]},
  {"id": 57, "text": "The printers automatically print both sides of each page.", "textZh": "印表機會自動進行雙面列印。", "freqTag": "🔥 11月新預測", "trapNote": "printers 複數配 print；both sides (複數) of each page (單數)！", "mnemonic": "省紙環保預設值：兩面 both sides 印在一張紙 each page 上！", "distractors": ["side", "pages"]},
  {"id": 58, "text": "Gravity is the force that attracts two bodies toward one another.", "textZh": "重力是吸引兩個物體彼此靠近的力量。", "freqTag": "🔥 11月新預測", "trapNote": "單數 force 配關係子句動詞 attracts (加 s)；bodies 複數。", "mnemonic": "牛頓蘋果砸頭：萬有引力 Gravity 讓兩個星體互相吸引 attracts！", "distractors": ["attract", "body"]},
  {"id": 59, "text": "Castles were designed to intimidate both local people and the enemies.", "textZh": "城堡的設計旨在震懾當地居民與外敵。", "freqTag": "🔥 11月新預測", "trapNote": "Castles (t 不發音！) 複數配 were designed (-ed)；intimidate (威懾)。", "mnemonic": "中世紀蓋超巨大石頭城堡，不只防敵人，連城裡老百姓看了都發抖 intimidate！", "distractors": ["castle", "enemy"]},
  {"id": 60, "text": "A celebrated theory is still the source of great controversy.", "textZh": "一項著名的理論至今仍是巨大爭議的根源。", "freqTag": "🔥 11月新預測", "trapNote": "celebrated (-ed 著名的)；controversy (爭議，單數)。", "mnemonic": "越紅的理論戰越兇：celebrated theory 在研討會上天天吵翻天 controversy！", "distractors": ["controversies", "celebrate"]},
  {"id": 61, "text": "Teaching assistants will receive a monthly stipend for housing.", "textZh": "教學助理將領取每月的住宿津貼。", "freqTag": "⚡ 螢火蟲超高頻", "trapNote": "receive (c 後接 ei！)；stipend (生活津貼)。", "mnemonic": "當助教改考卷雖然累，但每個月有租房補貼 monthly stipend 拿！", "distractors": ["recieve", "assist"]},
  {"id": 62, "text": "Before submitting your dissertation, your advisor must approve your application.", "textZh": "在提交學位論文前，你的指導教授必須核准你的申請。", "freqTag": "⚡ 螢火蟲超高頻", "trapNote": "submitting 雙 t；dissertation 雙 s。", "mnemonic": "老闆沒點頭簽名 approve，你的碩士論文 dissertation 按鈕都別想按提交！", "distractors": ["submiting", "disertation"]},
  {"id": 63, "text": "Participants were initially selected from a range of academic disciplines.", "textZh": "參與者最初是從多個學術領域中挑選出來。", "freqTag": "⚡ 螢火蟲超高頻", "trapNote": "initially 雙 l；selected (-ed)；disciplines (sc 拼法＋複數 s)。", "mnemonic": "跨系大亂鬥實驗：一開始先從各個科系 disciplines 抓壯丁！", "distractors": ["discipline", "initial"]},
  {"id": 64, "text": "Renewable energy sources are becoming increasingly competitive with fossil fuels.", "textZh": "再生能源與化石燃料相比正變得越來越具競爭力。", "freqTag": "⚡ 螢火蟲超高頻", "trapNote": "sources 與 fuels 皆複數；increasingly competitive。", "mnemonic": "太陽能板越來越便宜，現在正面單挑傳統石油煤炭 fossil fuels 完全不虛！", "distractors": ["source", "fuel"]},
  {"id": 65, "text": "The sociology department is highly regarded across the entire country.", "textZh": "社會學系在全國享有極高評價。", "freqTag": "⚡ 螢火蟲超高頻", "trapNote": "is highly regarded (-ed 連音超輕，務必補 ed！)。", "mnemonic": "全國排名第一的王牌科系，大家提起都豎起大拇指 highly regarded！", "distractors": ["regard", "departments"]},
  {"id": 66, "text": "Extra seminars will be scheduled to assist you with revision.", "textZh": "將安排額外的研討課協助你進行考前複習。", "freqTag": "⚡ 螢火蟲超高頻", "trapNote": "will be scheduled (-ed 極易漏 d！)；revision 不可數。", "mnemonic": "佛心助教怕大家被當，考前加開複習班 scheduled to assist！", "distractors": ["schedule", "revisions"]},
  {"id": 67, "text": "Digital transformation requires continuous investment in software infrastructure.", "textZh": "數位轉型需要對軟體基礎設施進行持續投資。", "freqTag": "💎 歷年必考經典", "trapNote": "requires 加 s；continuous (-ous)；infrastructure。", "mnemonic": "老闆想搞數位轉型卻不買雲端伺服器 infrastructure？得持續砸錢 continuous investment 才行！", "distractors": ["require", "continous"]},
  {"id": 68, "text": "Essays with few or no citations will be regarded as invalid.", "textZh": "幾乎沒有引用文獻的論文將被視為無效。", "freqTag": "⚡ 螢火蟲超高頻", "trapNote": "Essays / citations 複數；regarded (-ed) as invalid。", "mnemonic": "寫論文不附參考來源 citations？直接當作無效廢紙 invalid 退件！", "distractors": ["citation", "regard"]},
  {"id": 69, "text": "Effective communication skills are highly valued by contemporary employers.", "textZh": "有效的溝通技巧深受當代雇主重視。", "freqTag": "💎 歷年必考經典", "trapNote": "skills / employers 複數；are highly valued (-ed)；contemporary。", "mnemonic": "澳洲找軟體工作不只看 LeetCode，溝通能力更是當代老闆 contemporary employers 最愛！", "distractors": ["value", "employer"]},
  {"id": 70, "text": "Formal conclusions could be established through rigorous experiments.", "textZh": "正式結論可透過嚴謹的實驗加以確立。", "freqTag": "🔥 11月新預測", "trapNote": "conclusions / experiments 複數；established (-ed)；rigorous (嚴謹的)。", "mnemonic": "不靠感覺猜 Bug，跑完嚴謹壓測 rigorous experiments 才能下正式結論！", "distractors": ["conclusion", "rigorously"]},
];

export function mergeAllWfdQuestions(customList: CustomImportedWfd[]): WfdItem[] {
  const mappedCustom: WfdItem[] = customList.map((c) => ({
    id: c.id,
    text: c.text,
    textZh: c.textZh,
    freqTag: '📥 自訂機經',
    trapNote: '自訂匯入預測題：注意句首大寫、複數 -s 與過去分詞 -ed 詞尾。',
    mnemonic: `來自「${c.sourceTag}」— 先用積木連擊熟悉語序，再挑戰盲打秒殺！`,
    distractors: ['the', 'were'],
  }));
  return [...mappedCustom, ...WFD_QUESTIONS];
}

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

export interface WordBrickTile {
  uid: string;
  word: string;
  isDistractor: boolean;
}

export function buildWordBricks(item: WfdItem): {
  targetTokens: string[];
  shuffledPool: WordBrickTile[];
} {
  const cleanWords = item.text
    .replace(/[.?!]+$/, '')
    .split(/\s+/)
    .filter(Boolean);

  const tiles: WordBrickTile[] = cleanWords.map((w, idx) => ({
    uid: `t-${item.id}-${idx}`,
    word: w,
    isDistractor: false,
  }));

  item.distractors.forEach((d, idx) => {
    tiles.push({
      uid: `d-${item.id}-${idx}`,
      word: d,
      isDistractor: true,
    });
  });

  // Deterministic-feel Fisher-Yates shuffle
  const shuffled = [...tiles];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return {
    targetTokens: cleanWords,
    shuffledPool: shuffled,
  };
}

export interface ClozeSegment {
  index: number;
  rawWord: string;
  cleanAnswer: string;
  isBlank: boolean;
}

export function buildSniperCloze(sentence: string): ClozeSegment[] {
  const words = sentence.split(/\s+/).filter(Boolean);
  // Pick up to 3 longest content words (>=5 chars) as high-value blanks
  const candidates = words
    .map((w, idx) => ({ idx, len: w.replace(/[^a-zA-Z]/g, '').length }))
    .filter((c) => c.len >= 5)
    .sort((a, b) => b.len - a.len)
    .slice(0, 3)
    .map((c) => c.idx);

  const blankSet = new Set(candidates);
  return words.map((w, idx) => ({
    index: idx,
    rawWord: w,
    cleanAnswer: w.replace(/[^a-zA-Z']/g, ''),
    isBlank: blankSet.has(idx),
  }));
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
  const periodOk = trimmed.endsWith('.') || trimmed.endsWith('?');

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
