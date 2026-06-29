// quiz-data.js
// 6섹션 × 5문제 = 30문제 | 언어: ko, en | 오답: 문제당 10개
// 출제 시 5문제 중 랜덤 2개 선택, 오답 중 랜덤 2~4개 + 정답 1개 = 3~5지선다

const QUIZ_DATA = {

  // ── 퀴즈 트리거: 영상 시간(초) + 해당 섹션 + 문제 풀 인덱스 ──
  triggers: [
    { time: 90,  section: 0, qPool: [0,1,2,3,4]   },  // 1:30
    { time: 180, section: 1, qPool: [5,6,7,8,9]   },  // 3:00
    { time: 320, section: 2, qPool: [10,11,12,13,14] }, // 5:20
    { time: 410, section: 3, qPool: [15,16,17,18,19] }, // 6:50
    { time: 540, section: 4, qPool: [20,21,22,23,24] }, // 9:00
    { time: 670, section: 5, qPool: [25,26,27,28,29] }  // 11:10
  ],

  // ── 섹션 제목 ──
  sections: [
    { ko: "섹션 1: 비전과 철학",       en: "Section 1: Vision & Philosophy" },
    { ko: "섹션 2: 에듀원탑 소개",     en: "Section 2: Edu1top Overview" },
    { ko: "섹션 3: AI·학습루프",       en: "Section 3: AI & Learning Loop" },
    { ko: "섹션 4: 배틀학습",          en: "Section 4: Battle Learning" },
    { ko: "섹션 5: 12년 로드맵",       en: "Section 5: 12-Year Roadmap" },
    { ko: "섹션 6: 기대효과·참여방법", en: "Section 6: Expected Effects & How to Join" }
  ],

  // ── 문제 30개 ──
  // 구조: { ko: { q, ans, wrong[10] }, en: { q, ans, wrong[10] } }
  questions: [

    // ══════════════════════════════════════════════
    // 섹션 1: 비전과 철학 (인덱스 0~4)
    // ══════════════════════════════════════════════

    // [0]
    {
      ko: {
        q: "이 플랫폼이 이주배경 학생들에게서 가장 먼저 회복시키려 하는 것은?",
        ans: "자존감",
        wrong: ["학습 성적","언어 능력","수학 실력","독해력","출석률","교우 관계","집중력","체력","발음 교정","암기력"]
      },
      en: {
        q: "What does this platform primarily aim to restore first in students with immigrant backgrounds?",
        ans: "Self-esteem",
        wrong: ["Academic grades","Language skills","Math ability","Reading comprehension","Attendance rate","Peer relationships","Concentration","Physical strength","Pronunciation correction","Memorization skills"]
      }
    },

    // [1]
    {
      ko: {
        q: "다음 중 이 플랫폼의 세 가지 핵심 기둥이 아닌 것은?",
        ans: "AI 번역 서비스",
        wrong: ["꿈담길","에듀원탑","배틀학습","언어 교실","부모 코칭 센터","진로 센터","특별 보충 강의","독서 프로그램","수학 특강","체험 학습"]
      },
      en: {
        q: "Which of the following is NOT one of the three core pillars of this platform?",
        ans: "AI Translation Service",
        wrong: ["Kkomdamgil","Edu1top","Battle Learning","Language Classroom","Parent Coaching Center","Career Center","Supplementary Lectures","Reading Program","Math Special Class","Experiential Learning"]
      }
    },

    // [2]
    {
      ko: {
        q: "이 플랫폼이 지향하는 교육 기간은?",
        ans: "12년 장기 성장 관리",
        wrong: ["단기 집중 1개월","6개월 속성 과정","1년 집중 교육","2년 기초 과정","3년 중기 과정","방학 특강","주말 집중반","시험 전 단기반","학기별 과정","분기별 과정"]
      },
      en: {
        q: "What is the educational duration this platform aims for?",
        ans: "12-year long-term growth management",
        wrong: ["1-month intensive","6-month fast-track","1-year intensive","2-year basic course","3-year mid-term","Vacation special","Weekend intensive","Pre-exam short course","Semester course","Quarterly course"]
      }
    },

    // [3]
    {
      ko: {
        q: "하이브리드 시스템에서 오프라인 센터 수업 빈도는?",
        ans: "주 2회 × 90분",
        wrong: ["주 1회 × 60분","주 3회 × 45분","매일 × 30분","월 2회 × 120분","주 5회 × 50분","월 1회 × 180분","주 2회 × 60분","격주 1회 × 90분","주 4회 × 30분","주 1회 × 120분"]
      },
      en: {
        q: "How often are offline center classes in the hybrid system?",
        ans: "Twice a week × 90 minutes",
        wrong: ["Once a week × 60 min","3 times a week × 45 min","Daily × 30 min","Twice a month × 120 min","5 times a week × 50 min","Once a month × 180 min","Twice a week × 60 min","Every other week × 90 min","4 times a week × 30 min","Once a week × 120 min"]
      }
    },

    // [4]
    {
      ko: {
        q: "이 플랫폼에서 도미노 비유로 설명한 핵심 교육 철학은?",
        ans: "자존감 회복이 모든 성장의 출발점",
        wrong: ["언어 장벽 극복이 최우선","성적 향상이 자신감을 만든다","친구 관계가 학습을 이끈다","부모 교육이 먼저다","교사 역량이 핵심이다","반복 학습이 기초다","시험 합격이 목표다","환경 개선이 우선이다","경쟁이 성장을 만든다","교재가 핵심이다"]
      },
      en: {
        q: "What core educational philosophy is explained using the domino metaphor in this platform?",
        ans: "Restoring self-esteem is the starting point of all growth",
        wrong: ["Overcoming language barriers is the top priority","Better grades build confidence","Friendships drive learning","Parent education comes first","Teacher skills are key","Repetition is the foundation","Passing exams is the goal","Improving environment comes first","Competition drives growth","Textbooks are the core"]
      }
    },

    // ══════════════════════════════════════════════
    // 섹션 2: 에듀원탑 소개 (인덱스 5~9)
    // ══════════════════════════════════════════════

    // [5]
    {
      ko: {
        q: "에듀원탑이 지원하는 언어는 몇 개국 언어인가?",
        ans: "24개국",
        wrong: ["10개국","50개국","12개국","30개국","15개국","20개국","8개국","100개국","5개국","36개국"]
      },
      en: {
        q: "How many languages does Edu1top support?",
        ans: "24 languages",
        wrong: ["10 languages","50 languages","12 languages","30 languages","15 languages","20 languages","8 languages","100 languages","5 languages","36 languages"]
      }
    },

    // [6]
    {
      ko: {
        q: "에듀원탑에서 학생의 모국어를 어떻게 활용하나요?",
        ans: "한국어 학습의 징검다리로 활용",
        wrong: ["모국어 사용 완전 금지","보조 교재로만 사용","번역 도구로만 활용","시험 언어로만 허용","방과 후에만 허용","모국어 교사에게만 허용","특별 수업에서만 허용","초급 단계에서만 허용","부모 상담 시에만 사용","수업 종료 후만 허용"]
      },
      en: {
        q: "How does Edu1top utilize a student's native language?",
        ans: "As a stepping stone for learning Korean",
        wrong: ["Completely prohibited","Only as supplementary material","Only as a translation tool","Only allowed in exams","Only allowed after school","Only allowed with native-language teachers","Only in special classes","Only in beginner stages","Only during parent consultations","Only after class ends"]
      }
    },

    // [7]
    {
      ko: {
        q: "STT 기술이 에듀원탑에서 하는 역할은?",
        ans: "학생의 발음 교정",
        wrong: ["자동 번역 제공","출석 체크","교재 스캔","영상 자막 생성","음악 재생","단어 암기 보조","문법 교정","필기 자동화","교사 평가","점수 자동 계산"]
      },
      en: {
        q: "What role does STT technology play in Edu1top?",
        ans: "Correcting student pronunciation",
        wrong: ["Providing automatic translation","Checking attendance","Scanning textbooks","Generating video subtitles","Playing music","Assisting word memorization","Correcting grammar","Automating note-taking","Evaluating teachers","Automatically calculating scores"]
      }
    },

    // [8]
    {
      ko: {
        q: "OCR 기능이 에듀원탑에서 하는 역할은?",
        ans: "종이 프린트물을 온라인 학습과 연동",
        wrong: ["얼굴 인식","성적 자동 입력","시험지 채점","출석 관리","동영상 변환","음성 녹음","번역 출력","교사 평가","학부모 알림","숙제 자동 제출"]
      },
      en: {
        q: "What role does the OCR feature play in Edu1top?",
        ans: "Linking paper printouts to online learning",
        wrong: ["Face recognition","Auto-entering grades","Grading test papers","Managing attendance","Converting video","Recording audio","Printing translations","Evaluating teachers","Notifying parents","Auto-submitting homework"]
      }
    },

    // [9]
    {
      ko: {
        q: "에듀원탑에서 학습 난이도를 조절하는 방식은?",
        ans: "실시간 반응 데이터로 AI가 자동 조절",
        wrong: ["교사가 수동으로 설정","학부모 요청에 따라","월말 시험 결과로","학년에 따라 고정","입학 시험으로 결정","주간 평가 후 조절","학생 선택에 맡김","전국 평균 기준","담임 교사 판단","학기 초 1회 결정"]
      },
      en: {
        q: "How does Edu1top adjust learning difficulty?",
        ans: "AI automatically adjusts based on real-time response data",
        wrong: ["Teacher sets it manually","Based on parent requests","Based on end-of-month test results","Fixed by grade level","Determined by entrance exam","Adjusted after weekly evaluation","Left to student choice","Based on national average","Determined by homeroom teacher","Set once at the start of semester"]
      }
    },

    // ══════════════════════════════════════════════
    // 섹션 3: AI·학습루프 (인덱스 10~14)
    // ══════════════════════════════════════════════

    // [10]
    {
      ko: {
        q: "에듀원탑의 특허받은 완전 학습 루프는 몇 단계인가?",
        ans: "8단계",
        wrong: ["5단계","12단계","3단계","10단계","6단계","7단계","9단계","4단계","15단계","2단계"]
      },
      en: {
        q: "How many steps does Edu1top's patented complete learning loop have?",
        ans: "8 steps",
        wrong: ["5 steps","12 steps","3 steps","10 steps","6 steps","7 steps","9 steps","4 steps","15 steps","2 steps"]
      }
    },

    // [11]
    {
      ko: {
        q: "학생이 문제를 틀렸을 때 AI가 취하는 행동은?",
        ans: "오답 원인 분석 후 하위 개념까지 거슬러 보충",
        wrong: ["같은 문제 반복 출제","더 쉬운 문제로 교체","교사에게 알림 전송","학부모에게 보고","학습 강제 종료","점수 차감만 처리","다음 단계 강제 진행","동영상 강의 자동 재생","경고 팝업만 표시","임의로 정답 처리"]
      },
      en: {
        q: "What does AI do when a student answers incorrectly?",
        ans: "Analyzes the error cause and supplements back to foundational concepts",
        wrong: ["Repeats the same question","Replaces with easier question","Sends alert to teacher","Reports to parents","Forces end of session","Only deducts score","Forces progression to next step","Automatically plays video lecture","Shows warning popup only","Marks it as correct arbitrarily"]
      }
    },

    // [12]
    {
      ko: {
        q: "다국어 TTS 기술이 에듀원탑에서 하는 역할은?",
        ans: "읽기에 공포심 있는 학생의 언어 장벽을 낮춤",
        wrong: ["교사를 완전 대체","번역 서비스 제공","시험 채점 자동화","출석 확인","숙제 알림 발송","음악 학습 지원","영어 발음만 교정","한국어 억양 평가","자동 강의 콘텐츠 생성","학부모 리포트 낭독"]
      },
      en: {
        q: "What role does multi-language TTS play in Edu1top?",
        ans: "Lowers language barriers for students with reading anxiety",
        wrong: ["Completely replaces teachers","Provides translation services","Automates test grading","Confirms attendance","Sends homework reminders","Supports music learning","Only corrects English pronunciation","Evaluates Korean accent","Auto-generates lecture content","Reads parent reports aloud"]
      }
    },

    // [13]
    {
      ko: {
        q: "완전 학습 루프에서 5단계 이후의 핵심 과정은?",
        ans: "오답 원인 분석 및 하위 단계 기초 개념 보충",
        wrong: ["다음 챕터로 강제 진행","점수 최종 집계","학부모에게 결과 통보","동영상 강의 시청","교사 면담 예약","자동 레벨업 처리","새 단어 암기 시작","게임 보상 지급","퀴즈 처음부터 재시작","학습 세션 종료"]
      },
      en: {
        q: "What is the key process after step 5 in the complete learning loop?",
        ans: "Analyzing error cause and supplementing foundational concepts from lower steps",
        wrong: ["Forcing progression to next chapter","Final score tabulation","Notifying parents of results","Watching video lecture","Scheduling teacher consultation","Automatic level-up","Starting new word memorization","Giving game rewards","Restarting quiz from scratch","Ending the learning session"]
      }
    },

    // [14]
    {
      ko: {
        q: "에듀원탑 학습 로드맵 3단계의 목표는?",
        ans: "문해력과 창작",
        wrong: ["수능 특기 심화","대학 입학 준비","취업 영어 완성","한국어 마스터","수학 심화 완성","과학 탐구 완성","진로 최종 결정","발표 스킬 완성","독서 인증 취득","글쓰기 자격 취득"]
      },
      en: {
        q: "What is the goal of step 3 in Edu1top's learning roadmap?",
        ans: "Literacy and creative writing",
        wrong: ["Advanced CSAT preparation","University entrance","Business English completion","Korean mastery","Advanced math completion","Science exploration completion","Final career decision","Presentation skills completion","Reading certification","Writing qualification"]
      }
    },

    // ══════════════════════════════════════════════
    // 섹션 4: 배틀학습 (인덱스 15~19)
    // ══════════════════════════════════════════════

    // [15]
    {
      ko: {
        q: "배틀학습에서 학생을 평가하는 기준은?",
        ans: "어제의 나보다 얼마나 성장했는가",
        wrong: ["전체 학생 성적 순위","반 내 등수","시험 점수 절대값","출석 횟수 합계","제출한 과제 수","교사 평가 점수","속도 경쟁 결과","정답 개수 합계","오답 없는 횟수","학부모 평가 점수"]
      },
      en: {
        q: "What is the evaluation standard in Battle Learning?",
        ans: "How much I grew compared to my yesterday-self",
        wrong: ["Overall student ranking","Class ranking","Absolute test score","Total attendance count","Number of submitted assignments","Teacher evaluation score","Speed competition result","Total correct answers","Number of perfect sessions","Parent evaluation score"]
      }
    },

    // [16]
    {
      ko: {
        q: "배틀이 끝난 후 AI가 하는 것은?",
        ans: "틀린 문제 원인 분석 및 보충 학습 연결",
        wrong: ["다음 배틀 일정 안내","점수 집계 후 종료","학부모에게 즉시 결과 전송","자동 레벨업 처리","상품 쿠폰 지급","교사에게 결과 보고","학습 세션 완전 종료","오답 목록 무시","동영상 강의 자동 재생","성적표 자동 출력"]
      },
      en: {
        q: "What does AI do after a Battle ends?",
        ans: "Analyzes wrong answers and connects to supplementary learning",
        wrong: ["Announces next battle schedule","Tallies score and ends","Immediately sends results to parents","Processes automatic level-up","Gives reward coupons","Reports results to teacher","Completely ends learning session","Ignores wrong answer list","Automatically plays video lecture","Auto-prints report card"]
      }
    },

    // [17]
    {
      ko: {
        q: "배틀학습에 없는 요소는?",
        ans: "전국 성적 석차 공개",
        wrong: ["콤보 보너스","NPC와의 대결","팀전 협력 배틀","개인전 배틀","즉각적인 오답 분석","공정한 평가 로직","게임형 몰입 요소","맞춤 보충 학습","성장 기반 평가","공평한 난이도 배정"]
      },
      en: {
        q: "Which element does NOT exist in Battle Learning?",
        ans: "Public national ranking disclosure",
        wrong: ["Combo bonus","Battles against NPC","Team cooperative battle","Individual battle","Immediate wrong-answer analysis","Fair evaluation logic","Game-style immersion elements","Customized supplementary learning","Growth-based evaluation","Fair difficulty assignment"]
      }
    },

    // [18]
    {
      ko: {
        q: "배틀학습에서 '공정한 배틀'을 가능하게 하는 것은?",
        ans: "동일한 노력 기준으로 평가하는 특허 맞춤 로직",
        wrong: ["같은 나이끼리만 대결","성적순 그룹 편성","교사가 수동으로 조정","완전 무작위 매칭","학부모 요청 반영","담임 선생님 판단","절대 점수만 비교","학년별 고정 기준","전국 평균 자동 적용","학생 자기 신고제"]
      },
      en: {
        q: "What enables 'fair battles' in Battle Learning?",
        ans: "Patented custom logic that evaluates by the same effort standard",
        wrong: ["Only matching same-age students","Grouping by grade rank","Teacher manually adjusts","Completely random matching","Reflecting parent requests","Homeroom teacher's judgment","Comparing only absolute scores","Fixed standards by grade","Automatic national average application","Student self-reporting system"]
      }
    },

    // [19]
    {
      ko: {
        q: "배틀학습의 세 가지 핵심 성장 동력은?",
        ans: "공정한 경쟁 + 강한 몰입감 + 빈틈없는 복습",
        wrong: ["순위 경쟁 + 상품 + 시험","속도 + 암기 + 발표","팀워크 + 교사 평가 + 점수","게임 + 번역 + 퀴즈","성적 + 출석 + 태도","영어 + 수학 + 과학","독서 + 글쓰기 + 발표","듣기 + 말하기 + 읽기","암기 + 반복 + 테스트","코딩 + 수학 + 논리"]
      },
      en: {
        q: "What are the three core growth drivers of Battle Learning?",
        ans: "Fair competition + Strong immersion + Thorough review",
        wrong: ["Ranking + Prizes + Exams","Speed + Memorization + Presentation","Teamwork + Teacher evaluation + Scores","Games + Translation + Quiz","Grades + Attendance + Attitude","English + Math + Science","Reading + Writing + Presentation","Listening + Speaking + Reading","Memorization + Repetition + Testing","Coding + Math + Logic"]
      }
    },

    // ══════════════════════════════════════════════
    // 섹션 5: 12년 로드맵 (인덱스 20~24)
    // ══════════════════════════════════════════════

    // [20]
    {
      ko: {
        q: "12년 성장 로드맵은 몇 개의 트랙으로 구성되나?",
        ans: "3개",
        wrong: ["2개","4개","5개","6개","1개","7개","8개","10개","12개","9개"]
      },
      en: {
        q: "How many tracks make up the 12-year growth roadmap?",
        ans: "3 tracks",
        wrong: ["2 tracks","4 tracks","5 tracks","6 tracks","1 track","7 tracks","8 tracks","10 tracks","12 tracks","9 tracks"]
      }
    },

    // [21]
    {
      ko: {
        q: "고등학교 구간에서 준비하는 것이 아닌 것은?",
        ans: "초등 기초 학력 재복습",
        wrong: ["AI 모의 면접","기업 연계 체험","수능 핵심 어휘","실전 자소서 작성","동문 네트워크 구축","진로 최종 설계","대학 기관 체험","취업 실전 준비","발표 능력 강화","어학 인증 준비"]
      },
      en: {
        q: "Which of the following is NOT part of the high school stage?",
        ans: "Re-reviewing elementary-level basic academic skills",
        wrong: ["AI mock interview","Corporate-linked experience","Key CSAT vocabulary","Practical self-introduction writing","Alumni network building","Final career design","University institution experience","Practical job preparation","Strengthening presentation skills","Language certification preparation"]
      }
    },

    // [22]
    {
      ko: {
        q: "꿈담길의 역할이 아닌 것은?",
        ans: "AI 학습 진단 및 오답 분석",
        wrong: ["강점 기반 진로 탐색","대학생 멘토 매칭","직업인 선배 연결","Zoom 부모 코칭","롤모델 멘토링","가정 지지망 구축","사회 진출 준비","진로 상담 제공","취업 기업 연계","자소서·면접 훈련"]
      },
      en: {
        q: "Which of the following is NOT a role of Kkomdamgil?",
        ans: "AI learning diagnosis and wrong-answer analysis",
        wrong: ["Strength-based career exploration","University student mentor matching","Connecting to senior professionals","Parent coaching via Zoom","Role model mentoring","Building family support network","Preparing for social entry","Providing career counseling","Corporate employment linkage","Resume and interview training"]
      }
    },

    // [23]
    {
      ko: {
        q: "12년 로드맵 트랙 2의 핵심 내용은?",
        ans: "이중 언어 강점을 살리는 모국어 보존 브릿지",
        wrong: ["한국어 집중 강화 과정","수학 심화 학습 트랙","대학 입시 준비 과정","직업 기술 훈련 트랙","체육 활동 강화","예술 교육 심화","과학 탐구 프로그램","코딩 교육 트랙","독서 인증 프로그램","봉사 활동 관리"]
      },
      en: {
        q: "What is the core content of Track 2 in the 12-year roadmap?",
        ans: "Native language preservation bridge that leverages bilingual strengths",
        wrong: ["Intensive Korean enhancement course","Advanced math learning track","University entrance preparation","Vocational skills training track","Physical activity enhancement","Advanced arts education","Science exploration program","Coding education track","Reading certification program","Volunteer activity management"]
      }
    },

    // [24]
    {
      ko: {
        q: "초등 저학년(1~2학년) 단계의 주요 목표는?",
        ans: "자존감 회복과 기초 한글·파닉스 잡기",
        wrong: ["수학 심화 선행","영어 회화 완성","진로 탐색 시작","내신 성적 관리","수능 대비 준비","자소서 작성 훈련","팀 프로젝트 수행","과학 탐구 활동","코딩 입문 교육","대학 정보 수집"]
      },
      en: {
        q: "What is the main goal of the early elementary (grades 1-2) stage?",
        ans: "Restoring self-esteem and establishing basic Korean reading & phonics",
        wrong: ["Advanced math acceleration","Completing English conversation","Starting career exploration","Managing school grades","CSAT preparation","Resume writing training","Conducting team projects","Science exploration activities","Beginner coding education","Collecting university information"]
      }
    },

    // ══════════════════════════════════════════════
    // 섹션 6: 기대효과·참여방법 (인덱스 25~29)
    // ══════════════════════════════════════════════

    // [25]
    {
      ko: {
        q: "이 플랫폼 참여의 첫 번째 단계는?",
        ans: "무료 AI 정밀 진단",
        wrong: ["수업료 납부","교재 구입","교사 면담 예약","반 배정 시험","입학 원서 제출","학부모 동의서 서명","온라인 가입 완료","오리엔테이션 참가","수준별 반 편성 시험","자기소개서 제출"]
      },
      en: {
        q: "What is the first step to participate in this platform?",
        ans: "Free AI precision diagnosis",
        wrong: ["Paying tuition","Buying textbooks","Scheduling teacher consultation","Class assignment test","Submitting application","Parent consent signature","Completing online registration","Attending orientation","Level-based class placement test","Submitting self-introduction"]
      }
    },

    // [26]
    {
      ko: {
        q: "이 플랫폼이 사회에 가져올 효과로 올바른 것은?",
        ans: "학업 중단 예방 및 글로벌 인재 파이프라인 구축",
        wrong: ["사교육비 절감","교사 수 대폭 감소","학교 통폐합 추진","시험 제도 폐지","외국어 학원 대체","교과서 완전 디지털화","입시 제도 전면 폐지","성적 공개 전면 금지","수업 시간 대폭 단축","방과후 학교 폐지"]
      },
      en: {
        q: "Which is a correct effect this platform brings to society?",
        ans: "Prevention of school dropout and building a global talent pipeline",
        wrong: ["Reducing private education costs","Significantly reducing teacher numbers","Consolidating schools","Abolishing the exam system","Replacing foreign language institutes","Fully digitalizing textbooks","Completely abolishing college entrance system","Completely banning grade disclosure","Drastically shortening class time","Abolishing after-school programs"]
      }
    },

    // [27]
    {
      ko: {
        q: "이 플랫폼에서 부모님에게 발송되는 것은?",
        ans: "다국어 성장 리포트",
        wrong: ["한국어 성적표만","출석부 사본","교사 편지","상벌점 기록부","교재 목록","수업료 청구서","학교 소식지","행사 안내문","급식 메뉴표","생활 기록부 사본"]
      },
      en: {
        q: "What is sent to parents in this platform?",
        ans: "Multi-language growth report",
        wrong: ["Korean-only report card","Attendance copy","Teacher letter","Merit/demerit record","Textbook list","Tuition invoice","School newsletter","Event notice","School lunch menu","Student life record copy"]
      }
    },

    // [28]
    {
      ko: {
        q: "꿈담길과 연계되어 고등학생이 경험하는 것은?",
        ans: "기업·대학 기관 체험 및 동문 네트워크",
        wrong: ["해외 유학 프로그램","아르바이트 알선","군사 훈련 체험","봉사 점수 관리","스포츠 특기 개발","예술 오디션 기회","외국어 자격증 취득","수능 특강 수강","독서 인증 취득","학교 축제 기획"]
      },
      en: {
        q: "What do high school students experience through Kkomdamgil?",
        ans: "Corporate and university institution experience plus alumni networking",
        wrong: ["Overseas study program","Part-time job placement","Military training experience","Managing volunteer hours","Sports talent development","Arts audition opportunities","Foreign language certification","CSAT special lectures","Reading certification","School festival planning"]
      }
    },

    // [29]
    {
      ko: {
        q: "이 플랫폼이 이주배경 아이들에 대해 지향하는 관점은?",
        ans: "부족한 결손이 아닌 사회의 강력한 자산",
        wrong: ["특별 지원이 필요한 대상","별도 학교가 필요한 집단","언어 교육만 받을 대상","빠른 동화가 필요한 그룹","성적이 낮은 학생 집단","사회적 부담이 되는 존재","임시 지원만 필요한 대상","이민자 자녀일 뿐인 집단","특수 교육 대상","한국어 학습자일 뿐"]
      },
      en: {
        q: "What perspective does this platform take toward children with immigrant backgrounds?",
        ans: "Powerful social assets, not deficient individuals",
        wrong: ["Subjects needing special support","Groups requiring separate schools","Only recipients of language education","Groups needing rapid assimilation","Students with low grades","Social burden","Only needing temporary support","Simply children of immigrants","Subjects of special education","Merely Korean language learners"]
      }
    }

  ] // end questions
}; // end QUIZ_DATA
