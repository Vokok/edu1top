/* ============================================================
   quiz-engine.js — 퀴즈 엔진
   의존: quiz-data.js, quiz.css
   ============================================================

   흐름
   ────
   영상 재생 → 트리거 시간 도달 → pauseVideo()
   → 퀴즈 팝업 (2문제 순서대로)
   → 채점:
       0/2 정답 → 재시청 모달 → seekTo(섹션 시작) + playVideo()
       1/2 정답 → 경고 모달 → 확인 후 playVideo()
       2/2 정답 → 통과 모달 → playVideo()
   → localStorage 저장
*/

'use strict';

/* ══════════════════════════════════════════════════════════
   1. 상태
   ══════════════════════════════════════════════════════════ */
const QE = {
  player:       null,   // YT.Player 인스턴스
  userName:     '',
  lang:         'ko',   // 현재 언어 (index.html의 changeLanguage와 동기)
  learningMode: false,  // true 일 때만 퀴즈 발동

  // 현재 퀴즈 세션
  session: {
    triggerIdx:   -1,   // 현재 트리거 인덱스
    questions:    [],   // 선택된 2개 문제 객체 [{qIdx, q, ans, choices, choiceCnt}, ...]
    qCursor:       0,   // 0 또는 1 (현재 문제 번호)
    answers:      [],   // 사용자 정답 여부 [true/false, ...]
    scores:       [],   // 문제별 획득 점수
    startTimes:   [],   // 문제별 시작 timestamp
    firedSet:       new Set(), // 이미 발동한 트리거 인덱스 (재생 중 중복 방지)
    consecutiveWarn: 0,        // 연속 50%(warn) 카운터
    integrityCount:  0,        // 이탈 감지 누적 횟수 (1회=경고, 2회~=-1점)
    penaltyTotal:    0,        // 누적 감점 합계
  },

  // 전체 누적 결과 (localStorage 저장)
  results: [],
};

/* 섹션별 시작 시간(초) — 0/2 정답 시 되돌아갈 지점 */
const SECTION_START = [0, 91, 181, 321, 411, 541];

/* ══════════════════════════════════════════════════════════
   2. 유틸
   ══════════════════════════════════════════════════════════ */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr, n) {
  return shuffle(arr).slice(0, n);
}

function t(obj) {
  // obj = { ko: '...', en: '...' } — 현재 언어로 꺼냄
  return obj[QE.lang] || obj['ko'] || '';
}

function fmtTime(ms) {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}분 ${s % 60}초` : `${s}초`;
}

function el(id) { return document.getElementById(id); }

/* localStorage 키: "quiz_results_<userName>" */
function storageKey() { return `quiz_results_${QE.userName}`; }

function loadResults() {
  try { return JSON.parse(localStorage.getItem(storageKey()) || '[]'); } catch { return []; }
}

function saveResults(arr) {
  try { localStorage.setItem(storageKey(), JSON.stringify(arr)); } catch(e) { console.warn(e); }
}

/* ══════════════════════════════════════════════════════════
   3. YouTube IFrame API 연결
   ══════════════════════════════════════════════════════════ */

/* index.html의 onYouTubeIframeAPIReady 에서 호출:
     QE.initPlayer(playerInstance)
*/
function initPlayer(playerInstance) {
  QE.player = playerInstance;
  startPolling();
}

/* 0.5초 폴링으로 트리거 시간 감지 */
let _pollTimer = null;
function startPolling() {
  if (_pollTimer) return;
  _pollTimer = setInterval(() => {
    if (!QE.learningMode) return;                                              // 학습 모드 OFF → 일반 재생
    if (!QE.player || typeof QE.player.getCurrentTime !== 'function') return;
    const state = QE.player.getPlayerState();
    if (state !== 1) return; // 1 = 재생 중
    const cur = Math.floor(QE.player.getCurrentTime());
    QUIZ_DATA.triggers.forEach((trig, idx) => {
      if (QE.session.firedSet.has(idx)) return;
      if (cur >= trig.time) {
        QE.session.firedSet.add(idx);
        QE.player.pauseVideo();
        launchQuiz(idx);
      }
    });
  }, 500);
}

/* ══════════════════════════════════════════════════════════
   4. 이름 입력 모달
   ══════════════════════════════════════════════════════════ */
function showNameModal() {
  const m = el('nameModal');
  if (!m) return;
  m.classList.add('active');
  const inp = el('nameInput');
  if (inp) inp.focus();
}

function hideNameModal() {
  const m = el('nameModal');
  if (m) m.classList.remove('active');
}

/* ══════════════════════════════════════════════════════════
   5. 퀴즈 준비 (문제·보기 선택)
   ══════════════════════════════════════════════════════════ */
function launchQuiz(triggerIdx) {
  const trig = QUIZ_DATA.triggers[triggerIdx];
  const sess = QE.session;

  sess.triggerIdx = triggerIdx;
  sess.qCursor    = 0;
  sess.answers    = [];
  sess.scores     = [];
  sess.startTimes = [];

  // 5문제 풀에서 랜덤 2개 선택
  const pool = [...trig.qPool];
  const chosen = pickRandom(pool, 2);

  sess.questions = chosen.map(qIdx => {
    const raw = QUIZ_DATA.questions[qIdx];
    const qLang = raw[QE.lang] || raw['ko'];

    // 오답 10개 중 랜덤 2~4개 선택 → 정답 포함 3~5지선다
    const wrongCnt  = 2 + Math.floor(Math.random() * 3); // 2,3,4
    const chosenWrong = pickRandom(qLang.wrong, wrongCnt);
    const choices   = shuffle([qLang.ans, ...chosenWrong]);
    const choiceCnt = choices.length; // 3,4,5

    return { qIdx, q: qLang.q, ans: qLang.ans, choices, choiceCnt };
  });

  showQuestion();
}

/* ══════════════════════════════════════════════════════════
   6. 문제 렌더링
   ══════════════════════════════════════════════════════════ */
const NUM_LABELS = ['①','②','③','④','⑤'];

function showQuestion() {
  const sess  = QE.session;
  const qi    = sess.questions[sess.qCursor];
  const total = sess.questions.length; // 2
  const trig  = QUIZ_DATA.triggers[sess.triggerIdx];
  const sect  = QUIZ_DATA.sections[trig.section];

  // 점수 안내
  const pts = qi.choiceCnt;

  // 헤더
  el('quizSectionBadge').textContent = t(sect);
  el('quizCounter').textContent      = `${sess.qCursor + 1} / ${total}`;
  el('quizProgressFill').style.width = `${((sess.qCursor) / total) * 100}%`;
  el('quizScoreBadge').textContent   = `이 문제 배점: ${pts}점 (${pts}지선다)`;

  // 문제
  el('quizQuestion').textContent = qi.q;

  // 보기
  const optWrap = el('quizOptions');
  optWrap.innerHTML = '';
  qi.choices.forEach((ch, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option-btn';
    btn.dataset.idx = i;
    btn.innerHTML = `<span class="quiz-option-num">${NUM_LABELS[i]}</span><span class="quiz-option-text">${ch}</span>`;
    btn.addEventListener('click', () => selectOption(btn, ch, qi));
    optWrap.appendChild(btn);
  });

  // 피드백 팝업·다음 버튼·제출 버튼 초기화
  hideFeedback();
  el('quizNextWrap').style.display  = 'none';
  el('quizSubmitBtn').disabled      = true;
  el('quizSubmitBtn').onclick       = null;
  el('quizSubmitWrap').style.display = '';

  // 선택 추적
  qi._selected = null;

  // 타이머 시작
  sess.startTimes[sess.qCursor] = Date.now();
  startQuestionTimer(30);

  // 오버레이 표시 (항상 최상단부터 보이도록 scrollTop 리셋)
  const _ov = el('quizOverlay');
  _ov.scrollTop = 0;
  _ov.classList.add('active');
}

let _qTimer = null;
function startQuestionTimer(sec) {
  clearInterval(_qTimer);
  let left = sec;
  updateTimerUI(left, sec);
  _qTimer = setInterval(() => {
    left--;
    updateTimerUI(left, sec);
    if (left <= 0) {
      clearInterval(_qTimer);
      // 시간 초과 → 오답 처리
      submitAnswer(null);
    }
  }, 1000);
}

function updateTimerUI(left, total) {
  const fill = el('quizTimerFill');
  const num  = el('quizTimerNum');
  if (!fill || !num) return;
  const pct  = (left / total) * 100;
  fill.style.width = pct + '%';
  num.textContent  = left + '초';
  fill.className   = 'quiz-timer-fill' +
    (left <= 5 ? ' danger' : left <= 10 ? ' warning' : '');
}

/* ══════════════════════════════════════════════════════════
   7. 선택·제출
   ══════════════════════════════════════════════════════════ */
function selectOption(btn, choice, qi) {
  // 이미 피드백이 떴으면 무시
  if (el('quizFeedback').classList.contains('active')) return;

  // 이전 선택 해제
  document.querySelectorAll('.quiz-option-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  qi._selected = choice;

  const submitBtn = el('quizSubmitBtn');
  submitBtn.disabled = false;
  submitBtn.onclick  = () => submitAnswer(choice);
}

function submitAnswer(choice) {
  clearInterval(_qTimer);
  const sess = QE.session;
  const qi   = sess.questions[sess.qCursor];
  const elapsed = Date.now() - (sess.startTimes[sess.qCursor] || Date.now());

  const correct = (choice === qi.ans);
  sess.answers.push(correct);
  sess.scores.push(correct ? qi.choiceCnt : 0);

  // 모든 버튼 비활성화
  document.querySelectorAll('.quiz-option-btn').forEach(btn => {
    btn.disabled = true;
    const text = btn.querySelector('.quiz-option-text').textContent;
    if (text === qi.ans) {
      btn.classList.add('correct');
    } else if (text === choice && !correct) {
      btn.classList.add('wrong');
    }
  });

  // 피드백 표시
  showFeedback(correct, qi, elapsed);

  // 제출 버튼 숨기기 (팝업이 대신 표시)
  el('quizSubmitWrap').style.display = 'none';

  // 다음 버튼 표시
  const nextWrap = el('quizNextWrap');
  nextWrap.style.display = 'block';
  const nextBtn = el('quizNextBtn');

  if (sess.qCursor < sess.questions.length - 1) {
    nextBtn.textContent = '다음 문제 →';
    nextBtn.onclick     = () => {
      sess.qCursor++;
      showQuestion();
    };
    // 정답이면 1초 후 자동 이동
    if (correct) setTimeout(() => { sess.qCursor++; showQuestion(); }, 1000);
  } else {
    nextBtn.textContent = '결과 확인 →';
    nextBtn.onclick     = () => finishSession(elapsed);
    // 정답이면 1초 후 자동 결과
    if (correct) setTimeout(() => finishSession(elapsed), 1000);
  }
}

function showFeedback(correct, qi, elapsed) {
  // 팝업 래퍼 활성화
  const popup = el('quizFeedbackPopup');
  if (popup) {
    popup.className = 'quiz-fb-popup active ' + (correct ? 'correct-popup' : 'wrong-popup');
  }

  const fb = el('quizFeedback');
  fb.className = 'quiz-feedback active ' + (correct ? 'correct-fb' : 'wrong-fb');

  const icon  = correct ? '✅' : '❌';
  const title = correct ? '정답입니다!' : '오답입니다';
  const pts   = correct ? qi.choiceCnt  : 0;

  fb.innerHTML = `
    <div class="quiz-feedback-title">${icon} ${title}</div>
    <div class="quiz-feedback-ans">
      정답: <strong>${qi.ans}</strong><br>
      <span style="font-size:0.85rem;color:var(--qz-muted);">풀이 시간: ${fmtTime(elapsed)}</span>
    </div>
    <span class="quiz-feedback-score">+${pts}점</span>
  `;
}

function hideFeedback() {
  const fb = el('quizFeedback');
  if (fb) { fb.className = 'quiz-feedback'; fb.innerHTML = ''; }
  const popup = el('quizFeedbackPopup');
  if (popup) popup.className = 'quiz-fb-popup';
}

/* ══════════════════════════════════════════════════════════
   8. 세션 완료 → 채점 → 분기
   ══════════════════════════════════════════════════════════ */
function finishSession() {
  const sess    = QE.session;
  const correct = sess.answers.filter(Boolean).length;
  const total   = sess.answers.length; // 2
  const score   = sess.scores.reduce((a, b) => a + b, 0);
  const maxScore= sess.questions.reduce((a, q) => a + q.choiceCnt, 0);

  // 오버레이 닫기
  el('quizOverlay').classList.remove('active');
  hideFeedback();

  // 결과 저장
  recordSession(correct, total, score, maxScore);

  // 모든 트리거 완료 여부 확인 → 완료 시 차단 해제
  const allDone = QE.session.firedSet.size >= QUIZ_DATA.triggers.length;
  if (allDone) {
    QE.learningMode = false;
    const blocker = document.getElementById('videoBlocker');
    if (blocker) blocker.style.display = 'none';
    _unlockNav();
    _stopIntegrityWatch();
  }

  // consecutiveWarn 카운터 업데이트
  if (correct === 0) {
    QE.session.consecutiveWarn = 0; // 재시청 → 리셋
  } else if (correct < total) {
    QE.session.consecutiveWarn++;   // 50% 경고 → +1
  } else {
    QE.session.consecutiveWarn = 0; // 통과 → 리셋
  }

  // 연속 2회 경고 → 이전 섹션으로 이동
  if (QE.session.consecutiveWarn >= 2) {
    QE.session.consecutiveWarn = 0;
    showConsecWarnModal(score, maxScore, correct, total);
    return;
  }

  // 일반 분기
  if (correct === 0) {
    showRetryModal(score, maxScore, correct, total);
  } else if (correct < total) {
    showWarnModal(score, maxScore, correct, total);
  } else {
    showClearModal(score, maxScore, correct, total);
  }
}

/* ══════════════════════════════════════════════════════════
   9. 결과 저장 (localStorage)
   ══════════════════════════════════════════════════════════ */
function recordSession(correct, total, score, maxScore) {
  const sess   = QE.session;
  const trig   = QUIZ_DATA.triggers[sess.triggerIdx];
  const sect   = QUIZ_DATA.sections[trig.section];

  const record = {
    userName:    QE.userName,
    lang:        QE.lang,
    sectionIdx:  trig.section,
    sectionName: sect.ko,
    triggerTime: trig.time,
    correct,
    total,
    score,
    maxScore,
    accuracy:    Math.round((correct / total) * 100),
    details: sess.questions.map((qi, i) => ({
      qIdx:      qi.qIdx,
      question:  qi.q,
      userAns:   qi._selected || '(시간초과)',
      correctAns: qi.ans,
      isCorrect: sess.answers[i],
      pts:       sess.scores[i],
      choiceCnt: qi.choiceCnt,
      elapsed:   sess.startTimes[i]
        ? Date.now() - sess.startTimes[i]
        : 0,
    })),
    penalty:   QE.session.penaltyTotal,
    timestamp: new Date().toISOString(),
  };

  QE.results.push(record);
  saveResults(QE.results);

  // 인라인 결과 패널 + 상태바 갱신
  renderMyResultPanel();
  renderStatusBar();
}

/* ══════════════════════════════════════════════════════════
   10. 섹션 상태바 (영상 아래 뱃지)
   ══════════════════════════════════════════════════════════ */
function renderStatusBar() {
  const bar = el('quizStatusBar');
  if (!bar) return;

  // 섹션별 최신 결과 집계 (마지막 시도 기준)
  const latest = {}; // sectionIdx → record
  QE.results.forEach(r => {
    if (!latest[r.sectionIdx] || r.timestamp > latest[r.sectionIdx].timestamp) {
      latest[r.sectionIdx] = r;
    }
  });

  bar.innerHTML = QUIZ_DATA.sections.map((s, i) => {
    const r   = latest[i];
    let icon, label, bg, border;
    let dotColor, chipBg, chipBorder, dotChar;
    if (!r) {
      dotChar = ''; dotColor = '#94a3b8';
      chipBg = 'rgba(255,255,255,0.08)'; chipBorder = 'rgba(255,255,255,0.22)';
      label = '미완료';
    } else if (r.correct === r.total) {
      dotChar = '✓'; dotColor = '#4ade80';
      chipBg = 'rgba(22,163,74,0.22)'; chipBorder = '#4ade80';
      label = `${r.score}점 통과`;
    } else if (r.correct > 0) {
      dotChar = '!'; dotColor = '#fbbf24';
      chipBg = 'rgba(217,119,6,0.22)'; chipBorder = '#fbbf24';
      label = `${r.score}점 경고`;
    } else {
      dotChar = '✕'; dotColor = '#f87171';
      chipBg = 'rgba(220,38,38,0.22)'; chipBorder = '#f87171';
      label = '재시청';
    }
    const name = (s[QE.lang] || s.ko).replace(/^섹션 \d+: |^Section \d+: /, '');
    const dot = dotChar
      ? `<span style="width:16px;height:16px;border-radius:50%;background:${dotColor};color:#fff;
           font-size:0.6rem;font-weight:900;display:inline-flex;align-items:center;
           justify-content:center;flex-shrink:0;">${dotChar}</span>`
      : `<span style="width:10px;height:10px;border-radius:50%;background:${dotColor};
           display:inline-block;flex-shrink:0;"></span>`;
    return `<div style="
      display:inline-flex;align-items:center;gap:6px;
      padding:5px 12px;border-radius:20px;font-size:0.78rem;font-weight:700;
      background:${chipBg};border:1.5px solid ${chipBorder};color:#fff;
      cursor:default;white-space:nowrap;" title="${label}">
      ${dot} ${name}
    </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════════════════
   11. 모달들
   ══════════════════════════════════════════════════════════ */

/* ── 재시청 모달 (0/2) ── */
function showRetryModal(score, maxScore, correct, total) {
  const m = el('retryModal');
  if (!m) return;
  el('retryTitle').textContent = '다시 한번 확인해봐요!';
  el('retryDesc').innerHTML    =
    `${correct}/${total} 정답 (${score}/${maxScore}점)<br>
     해당 구간 영상부터 다시 시청한 뒤 퀴즈에 도전하세요.`;
  el('retryBtn').onclick = () => {
    m.classList.remove('active');
    // 섹션 시작 지점으로 이동 후 재생
    const startSec = SECTION_START[QE.session.triggerIdx] || 0;
    // 이 트리거를 firedSet에서 제거하여 재도전 허용
    QE.session.firedSet.delete(QE.session.triggerIdx);
    if (QE.player) {
      QE.player.seekTo(startSec, true);
      QE.player.playVideo();
    }
  };
  m.classList.add('active');
}

/* ── 경고 모달 (1/2) ── */
function showWarnModal(score, maxScore, correct, total) {
  const m = el('warnModal');
  if (!m) return;
  el('warnDesc').innerHTML =
    `${correct}/${total} 정답 (${score}/${maxScore}점)<br>
     아쉽지만 계속 진행할 수 있어요. 놓친 내용은 나중에 복습해보세요!`;
  el('warnScoreChip').textContent = `획득 점수 ${score}점`;
  el('warnContinueBtn').onclick = () => {
    m.classList.remove('active');
    if (QE.player) QE.player.playVideo();
  };
  el('warnRetryBtn').onclick = () => {
    m.classList.remove('active');
    const startSec = SECTION_START[QE.session.triggerIdx] || 0;
    QE.session.firedSet.delete(QE.session.triggerIdx);
    if (QE.player) {
      QE.player.seekTo(startSec, true);
      QE.player.playVideo();
    }
  };
  m.classList.add('active');
}

/* ── 연속 경고 모달 (2회 연속 50%) ── */
function showConsecWarnModal(score, maxScore, correct, total) {
  const m = el('consecWarnModal');
  if (!m) return;

  const sess     = QE.session;
  const trig     = QUIZ_DATA.triggers[sess.triggerIdx];
  const curSect  = trig ? trig.section : 0;          // 0-based 현재 섹션
  const prevSect = Math.max(0, curSect - 1);          // 이전 섹션 (최소 0)
  const sectName = QUIZ_DATA.sections[prevSect]
    ? QUIZ_DATA.sections[prevSect].name
    : 'S' + (prevSect + 1);
  const seekTime = SECTION_START[prevSect] || 0;

  el('consecWarnTitle').textContent =
    `⚠️ 연속 2회 경고 — 이전 구간으로 돌아갑니다`;
  el('consecWarnDesc').textContent =
    `"${sectName}" 구간부터 다시 학습합니다. 집중해서 시청 후 퀴즈를 풀어보세요!`;

  el('consecWarnBtn').onclick = () => {
    m.classList.remove('active');
    // 이전 섹션의 트리거를 firedSet에서 제거 → 재도전 허용
    QUIZ_DATA.triggers.forEach((t, i) => {
      if (t.section === prevSect) QE.session.firedSet.delete(i);
    });
    if (QE.player) {
      QE.player.seekTo(seekTime, true);
      QE.player.playVideo();
    }
  };
  m.classList.add('active');
}

/* ── 통과 모달 (2/2) ── */
function showClearModal(score, maxScore, correct, total) {
  const m = el('sectionClearModal');
  if (!m) return;
  el('clearScore').textContent = `${score} / ${maxScore}점`;
  el('clearDesc').textContent  =
    `${correct}/${total} 정답 — 완벽합니다! 다음 구간을 계속 시청하세요.`;
  el('clearBtn').onclick = () => {
    m.classList.remove('active');
    if (QE.player) QE.player.playVideo();
  };
  m.classList.add('active');
}

/* ══════════════════════════════════════════════════════════
   11. 인라인 개인 결과 패널 (index.html 하단)
   ══════════════════════════════════════════════════════════ */
function openMyResultPanel() {
  renderMyResultPanel();
  const ov = el('myResultOverlay');
  if (ov) ov.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeMyResultPanel() {
  const ov = el('myResultOverlay');
  if (ov) ov.classList.remove('active');
  document.body.style.overflow = '';
}

function goBackToVideo() {
  closeMyResultPanel();
  setTimeout(() => {
    const sec = document.getElementById('section-video');
    if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 180);
}

function renderMyResultPanel() {
  const panel = el('myResultPanel');
  if (!panel) return;

  const all = QE.results;

  // 열기 버튼 표시/숨김
  const openBtn = el('resultOpenBtnWrap');
  if (openBtn) openBtn.style.display = all.length ? 'flex' : 'none';

  if (!all.length) { panel.innerHTML = ''; return; }

  // KPI 계산
  const totalSessions = all.length;
  const totalCorrect  = all.reduce((s, r) => s + r.correct, 0);
  const totalQ        = all.reduce((s, r) => s + r.total, 0);
  const totalScore    = all.reduce((s, r) => s + r.score, 0);
  const totalMax      = all.reduce((s, r) => s + r.maxScore, 0);
  const accuracy      = totalQ ? Math.round((totalCorrect / totalQ) * 100) : 0;
  const passCount     = all.filter(r => r.correct === r.total).length;
  const allDetails    = all.flatMap(r => r.details || []);
  const avgTimeSec    = allDetails.length
    ? Math.round(allDetails.reduce((s, d) => s + (d.elapsed || 0), 0) / allDetails.length / 1000) : 0;

  // 섹션별 정확도
  const sectAcc = Array(6).fill(null).map(() => ({ c: 0, t: 0 }));
  all.forEach(r => {
    const si = r.sectionIdx;
    if (si >= 0 && si < 6) { sectAcc[si].c += r.correct; sectAcc[si].t += r.total; }
  });

  panel.innerHTML = `
    <div class="result-panel-card">
      <div class="result-panel-header">
        <div class="result-panel-header-text">
          <h2>📊 ${QE.userName}님의 학습 결과</h2>
          <p>총 ${totalSessions}회 퀴즈 참여</p>
        </div>
        <div class="result-panel-header-actions">
          <div class="result-user-avatar">${QE.userName.charAt(0) || '?'}</div>
          <button class="result-back-btn" onclick="QE.goBackToVideo()">← 영상으로 돌아가기</button>
        </div>
      </div>

      <!-- KPI -->
      <div class="result-kpi-grid">
        <div class="result-kpi-item" style="border-left-color:var(--qz-primary)">
          <div class="result-kpi-label">완료 섹션</div>
          <div class="result-kpi-value highlight">${totalSessions}</div>
          <div class="result-kpi-unit">/ 6</div>
        </div>
        <div class="result-kpi-item" style="border-left-color:${accuracy>=70?'#d97706':accuracy>=40?'#d97706':'#dc2626'}">
          <div class="result-kpi-label">전체 정답률</div>
          <div class="result-kpi-value ${accuracy >= 70 ? 'success' : accuracy >= 40 ? 'warning' : 'danger'}">${accuracy}%</div>
          <div class="result-kpi-unit">${totalCorrect} / ${totalQ} 문제</div>
        </div>
        <div class="result-kpi-item" style="border-left-color:var(--qz-primary)">
          <div class="result-kpi-label">획득 점수</div>
          <div class="result-kpi-value highlight">${totalScore}</div>
          <div class="result-kpi-unit">/ ${totalMax}점</div>
        </div>
        <div class="result-kpi-item" style="border-left-color:#16a34a">
          <div class="result-kpi-label">퀴즈 통과</div>
          <div class="result-kpi-value success">${passCount}</div>
          <div class="result-kpi-unit">회</div>
        </div>
        <div class="result-kpi-item" style="border-left-color:#7c3aed">
          <div class="result-kpi-label">평균 풀이 시간</div>
          <div class="result-kpi-value" style="color:#7c3aed">${avgTimeSec}</div>
          <div class="result-kpi-unit">초</div>
        </div>
      </div>

      <!-- 섹션별 막대 그래프 -->
      <div class="result-chart-wrap">
        <h3>섹션별 정답률</h3>
        <div class="bar-chart">
          ${QUIZ_DATA.sections.map((s, i) => {
            const sa  = sectAcc[i];
            const pct = sa.t ? Math.round((sa.c / sa.t) * 100) : null;
            const cls = pct === null ? '' : pct >= 70 ? 'success' : pct >= 40 ? 'warning' : 'danger';
            return `
              <div class="bar-row">
                <span class="bar-label">${s[QE.lang] || s.ko}</span>
                <div class="bar-track">
                  <div class="bar-fill ${cls}" style="width:${pct ?? 0}%"></div>
                </div>
                <span class="bar-val">${pct !== null ? pct + '%' : '미완료'}</span>
              </div>`;
          }).join('')}
        </div>
      </div>

      <!-- 상세 기록 테이블 -->
      <div class="result-table-wrap">
        <h3>문제별 상세 기록</h3>
        <table class="result-table">
          <thead>
            <tr>
              <th>섹션</th>
              <th>문제</th>
              <th>내 답</th>
              <th>결과</th>
              <th>점수</th>
              <th>풀이 시간</th>
            </tr>
          </thead>
          <tbody>
            ${all.flatMap(r =>
              r.details.map(d => `
                <tr>
                  <td style="white-space:nowrap">${r.sectionName}</td>
                  <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${d.question}">${d.question}</td>
                  <td style="max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${d.userAns}">${d.userAns}</td>
                  <td><span class="badge ${d.isCorrect ? 'badge-correct' : 'badge-wrong'}">${d.isCorrect ? '정답' : '오답'}</span></td>
                  <td><span class="badge badge-score">${d.pts}점</span></td>
                  <td>${fmtTime(d.elapsed || 0)}</td>
                </tr>`)
            ).join('')}
          </tbody>
        </table>
      </div>

      <!-- 링크 -->
      <div class="result-link-row">
        <a href="my-results.html?name=${encodeURIComponent(QE.userName)}" class="result-link-btn primary" target="_blank">
          📈 전체 통계 페이지 열기
        </a>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════════════════
   12. 기록 초기화
   ══════════════════════════════════════════════════════════ */
function resetResults() {
  if (!confirm('모든 학습 기록을 초기화하시겠습니까?')) return;
  localStorage.removeItem(storageKey());
  QE.results = [];
  renderMyResultPanel();
}

/* ══════════════════════════════════════════════════════════
   13. 언어 동기 (index.html의 changeLanguage 훅용)
   ══════════════════════════════════════════════════════════ */
function setLang(lang) {
  QE.lang = lang;
  renderMyResultPanel();
  renderStatusBar();
}

/* ══════════════════════════════════════════════════════════
   13-b. 학습 모드 ON/OFF
   ══════════════════════════════════════════════════════════ */

/* index.html 의 "동영상 학습" 버튼이 호출 */
function activateLearningMode() {
  // 1. 폴링이 퀴즈를 발동하지 못하도록 학습 모드는 아직 false 유지
  QE.learningMode = false;

  // 2. 혹시 열려있는 퀴즈/팝업 전부 닫기
  clearInterval(_qTimer);
  ['quizOverlay','warnModal','retryModal','sectionClearModal'].forEach(id => {
    const m = el(id); if (m) m.classList.remove('active');
  });
  hideFeedback();
  const nextWrap   = el('quizNextWrap');
  const submitWrap = el('quizSubmitWrap');
  if (nextWrap)   nextWrap.style.display   = 'none';
  if (submitWrap) submitWrap.style.display = '';

  // 3. 세션 초기화 (firedSet 포함) — 영상 처음부터 재시작 대비
  QE.session = {
    triggerIdx: -1, questions: [], qCursor: 0,
    answers: [], scores: [], startTimes: [], firedSet: new Set(),
    consecutiveWarn: 0, integrityCount: 0, penaltyTotal: 0,
  };

  // 4. 영상을 처음으로 이동 후 정지
  if (QE.player && typeof QE.player.seekTo === 'function') {
    QE.player.seekTo(0, true);
    QE.player.pauseVideo();
  }

  // 5. 이름 입력 화면(인트로 모달) 표시
  showIntroModal();
}

/* 인트로 모달 표시 */
function showIntroModal() {
  const m = el('learningIntroModal');
  if (m) m.classList.add('active');
}

function hideIntroModal() {
  const m = el('learningIntroModal');
  if (m) m.classList.remove('active');
}

/* 인트로 → "이름 입력" 버튼 클릭 시 */
function proceedToName() {
  hideIntroModal();
  if (!QE.userName) {
    showNameModal();
  } else {
    // 이름 이미 있음 → 재확인 없이 즉시 시작
    _startLearning();
  }
}

/* 인트로 → "취소" 버튼 클릭 시 */
function cancelLearningMode() {
  hideIntroModal();
  QE.learningMode = false;
  // 버튼 상태 원래대로
  const btn = document.getElementById('learningModeBtn');
  if (btn) { btn.classList.remove('active'); btn.textContent = '동영상 학습'; }
}

/* 실제 학습 시작 (이름 확인 완료 후 공통 호출) */
function _startLearning() {
  QE.results = loadResults();
  QE.session.firedSet = new Set();
  renderMyResultPanel();
  renderStatusBar();
  if (QE.player) {
    QE.player.seekTo(0, true);
    QE.player.playVideo();
  }
  // 영상이 0초부터 재생된 이후에 learningMode를 true로 — 중간 위치 트리거 오발 방지
  QE.learningMode = true;
  // 동영상 조작 차단
  const blocker = document.getElementById('videoBlocker');
  if (blocker) blocker.style.display = 'block';
  // 메뉴 이동 차단 + 페이지 이탈 경고
  _lockNav();
  // 이탈 감지 시작
  _startIntegrityWatch();
}

/* 학습 중 메뉴/이탈 차단 */
function _lockNav() {
  document.querySelectorAll('.nav-bar a, .mobile-nav-drawer nav a').forEach(a => {
    a.dataset.hrefBak = a.getAttribute('href') || '';
    a.setAttribute('href', 'javascript:void(0)');
    a.classList.add('nav-locked');
    a.addEventListener('click', _navLockAlert, true);
  });
  const hbtn = document.getElementById('hamburgerBtn');
  if (hbtn) hbtn.classList.add('nav-locked-btn');
  window.addEventListener('beforeunload', _beforeUnloadHandler);
}

function _navLockAlert(e) {
  e.preventDefault();
  e.stopPropagation();
  // 화면 상단에 토스트 경고
  let toast = document.getElementById('learningLockToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'learningLockToast';
    toast.style.cssText = 'position:fixed;top:70px;left:50%;transform:translateX(-50%);' +
      'background:#dc2626;color:#fff;padding:10px 20px;border-radius:8px;font-weight:700;' +
      'font-size:0.88rem;z-index:99999;box-shadow:0 4px 16px rgba(0,0,0,0.3);white-space:nowrap;';
    document.body.appendChild(toast);
  }
  toast.textContent = '🔒 학습이 끝난 후 이동할 수 있습니다';
  toast.style.display = 'block';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.display = 'none'; }, 2000);
}

function _beforeUnloadHandler(e) {
  e.preventDefault();
  e.returnValue = '학습이 진행 중입니다. 페이지를 떠나면 학습 데이터가 저장되지 않을 수 있습니다.';
  return e.returnValue;
}

/* ══════════════════════════════════════════════════════════
   학습 이탈 감지 (스크롤 / 스와이프)
   ══════════════════════════════════════════════════════════ */
let _integrityScrollY = 0;
let _integrityCooldown = false; // 팝업 중복 방지

function _onIntegrityViolation() {
  if (!QE.learningMode) return;
  if (_integrityCooldown) return;
  _integrityCooldown = true;

  // 스크롤 원위치
  window.scrollTo({ top: _integrityScrollY, behavior: 'instant' });

  // 횟수 증가
  QE.session.integrityCount++;
  const count   = QE.session.integrityCount;
  const isWarn  = count === 1;           // 1회 = 경고만
  const penalty = isWarn ? 0 : 1;       // 2회~ = -1점
  if (penalty > 0) QE.session.penaltyTotal += penalty;

  // 관리자 기록 저장
  _logIntegrity(count, penalty);

  // 팝업 표시
  _showIntegrityPopup(count, isWarn, penalty);

  // 3.5초 후 자동 닫힘 → 프로그램 영상 섹션으로 이동 + 쿨다운 해제
  setTimeout(() => {
    const m = document.getElementById('integrityModal');
    if (m) m.classList.remove('active');
    // 영상 섹션으로 스크롤 이동 후 scrollY 기준 갱신
    const sec = document.getElementById('section-video');
    if (sec) {
      sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => { _integrityScrollY = window.scrollY; }, 600);
    }
    _integrityCooldown = false;
  }, 3500);
}

function _showIntegrityPopup(count, isWarn, penalty) {
  const m = document.getElementById('integrityModal');
  if (!m) return;

  document.getElementById('integrityCount').textContent  = count + '회';
  document.getElementById('integrityMsg').textContent    = isWarn
    ? '⚠️ 1회 경고입니다. 다음 이탈부터 점수가 감점됩니다.'
    : `🔴 ${count}회 이탈 — ${penalty}점 감점이 적용됩니다.`;
  document.getElementById('integrityReport').textContent =
    '이 내용은 선생님(관리자)에게 기록됩니다.';

  // 카운트다운 표시
  let sec = 3;
  const cd = document.getElementById('integrityCd');
  if (cd) {
    cd.textContent = sec + '초 후 닫힘';
    clearInterval(cd._t);
    cd._t = setInterval(() => {
      sec--;
      if (sec <= 0) { clearInterval(cd._t); return; }
      cd.textContent = sec + '초 후 닫힘';
    }, 1000);
  }
  m.classList.add('active');
}

function _logIntegrity(count, penalty) {
  const key  = 'quiz_integrity_log';
  const logs = JSON.parse(localStorage.getItem(key) || '[]');
  logs.push({
    userName: QE.userName || '(미입력)',
    time:     new Date().toISOString(),
    count,
    penalty,
    page:     location.href,
  });
  // 최근 500건만 유지
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  localStorage.setItem(key, JSON.stringify(logs));
}

function _startIntegrityWatch() {
  _integrityScrollY = window.scrollY;
  window.addEventListener('scroll',     _integrityScrollHandler, { passive: true });
  window.addEventListener('touchmove',  _integrityScrollHandler, { passive: true });
}

function _stopIntegrityWatch() {
  window.removeEventListener('scroll',    _integrityScrollHandler);
  window.removeEventListener('touchmove', _integrityScrollHandler);
  _integrityCooldown = false;
}

function _integrityScrollHandler() {
  if (!QE.learningMode) return;
  // 허용 범위(±30px) 벗어나면 이탈로 간주
  if (Math.abs(window.scrollY - _integrityScrollY) > 30) {
    _onIntegrityViolation();
  }
}

function _unlockNav() {
  document.querySelectorAll('.nav-bar a, .mobile-nav-drawer nav a').forEach(a => {
    if (a.dataset.hrefBak !== undefined) {
      a.setAttribute('href', a.dataset.hrefBak);
      delete a.dataset.hrefBak;
    }
    a.classList.remove('nav-locked');
    a.removeEventListener('click', _navLockAlert, true);
  });
  const hbtn = document.getElementById('hamburgerBtn');
  if (hbtn) hbtn.classList.remove('nav-locked-btn');
  window.removeEventListener('beforeunload', _beforeUnloadHandler);
  const toast = document.getElementById('learningLockToast');
  if (toast) toast.style.display = 'none';
}

function deactivateLearningMode() {
  QE.learningMode = false;

  // 1. 퀴즈 타이머 정지
  clearInterval(_qTimer);

  // 2. 열려있는 모든 팝업 닫기
  ['learningIntroModal','quizOverlay','warnModal','retryModal','sectionClearModal','nameModal']
    .forEach(id => { const m = el(id); if (m) m.classList.remove('active'); });

  // 3. 피드백 팝업·제출 버튼 초기화
  hideFeedback();
  const nextWrap   = el('quizNextWrap');
  const submitWrap = el('quizSubmitWrap');
  if (nextWrap)   nextWrap.style.display   = 'none';
  if (submitWrap) submitWrap.style.display = '';

  // 4. session 전체 초기화 (다음 학습 때 처음부터 퀴즈 가능)
  QE.session = {
    triggerIdx: -1,
    questions:  [],
    qCursor:    0,
    answers:    [],
    scores:     [],
    startTimes: [],
    firedSet:   new Set(),
  };

  // 5. 영상 처음(0초)으로 이동 후 일시정지
  if (QE.player && typeof QE.player.seekTo === 'function') {
    QE.player.seekTo(0, true);
    QE.player.pauseVideo();
  }

  // 6. 버튼 OFF 상태 복원 (index.html toggleLearningMode 에서도 처리하지만 안전망)
  const btn = document.getElementById('learningModeBtn');
  if (btn) { btn.classList.remove('active'); btn.textContent = '동영상 학습'; }

  // 7. 동영상 조작 차단 해제
  const blocker = document.getElementById('videoBlocker');
  if (blocker) blocker.style.display = 'none';
  // 8. 메뉴 이동 잠금 해제 + 이탈 감지 정지
  _unlockNav();
  _stopIntegrityWatch();
}

/* ══════════════════════════════════════════════════════════
   14. DOM 초기화
   ══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  /* 이름 제출 */
  const nameForm = el('nameForm');
  if (nameForm) {
    nameForm.addEventListener('submit', e => { e.preventDefault(); submitName(); });
  }
  const nameBtn = el('nameSubmitBtn');
  if (nameBtn) nameBtn.addEventListener('click', submitName);

  const nameInput = el('nameInput');
  if (nameInput) {
    nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitName(); });
  }

  /* 퀴즈 제출 버튼 초기 상태 */
  const subBtn = el('quizSubmitBtn');
  if (subBtn) subBtn.disabled = true;

  /* 이름 자동 복원 (모달은 학습 버튼 클릭 시에만 표시) */
  const saved = localStorage.getItem('quiz_last_user');
  if (saved) {
    const inp = el('nameInput');
    if (inp) inp.value = saved;
    QE.userName = saved;
    QE.results  = loadResults();
    renderMyResultPanel();
    renderStatusBar();
  }
});

function submitName() {
  const inp  = el('nameInput');
  const name = inp ? inp.value.trim() : '';
  if (!name) {
    if (inp) { inp.style.borderColor = 'var(--qz-danger)'; setTimeout(() => inp.style.borderColor = '', 600); }
    return;
  }
  QE.userName = name;
  localStorage.setItem('quiz_last_user', name);
  hideNameModal();
  _startLearning();
}

/* ══════════════════════════════════════════════════════════
   15. 전역 노출
   ══════════════════════════════════════════════════════════ */
window.QE = Object.assign(QE, {
  initPlayer,
  setLang,
  resetResults,
  renderMyResultPanel,
  openMyResultPanel,
  closeMyResultPanel,
  goBackToVideo,
  renderStatusBar,
  showNameModal,
  submitName,
  activateLearningMode,
  deactivateLearningMode,
  showIntroModal,
  proceedToName,
  cancelLearningMode,
});
