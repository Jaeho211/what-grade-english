import { startQuiz, submitAnswer, shuffleChoices, QUESTION_COUNT, timeLimitMs, type Session, type Evidence } from '../quiz/engine.ts';
import { LEVELS, type EnglishQuestion, type Domain } from '../quiz/schema.ts';

const root = document.querySelector<HTMLElement>('#app')!;
const labels: Record<Domain, string> = { vocabulary: '문맥 어휘', usage: '문장 이해', reading: '짧은 글 읽기', discourse: '글의 흐름' };
const recentKey = 'what-grade-english:recent:v1';
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
let bank: EnglishQuestion[] = [];
let session: Session | null = null;
let phase: 'home' | 'question' | 'feedback' | 'result' = 'home';
let startedAt = 0;
let wallStartedAt = 0;
let frame = 0;
let recent: string[] = [];
try {
  const value = JSON.parse(localStorage.getItem(recentKey) ?? '[]');
  if (Array.isArray(value)) recent = value.filter(id => typeof id === 'string').slice(0, 400);
} catch { /* Private browsing and blocked storage still allow play. */ }

function shell(content: string) {
  root.innerHTML = `<header class="brand"><span class="brand-mark" aria-hidden="true">E</span><span>WHAT GRADE <strong>ENGLISH</strong></span></header>${content}<footer>10문제로 추정한 재미용 영어 학년이에요.<br>듣기·말하기·쓰기 능력 전체를 평가하지 않아요.</footer>`;
}
function home() {
  cancelAnimationFrame(frame);
  phase = 'home';
  shell(`<section class="hero"><span class="eyebrow">짧게 풀고, 나를 발견하는 영어 퀴즈</span><h1>나의 영어<br><span>학년은?</span></h1><p class="intro">익숙한 한 문장부터<br>생각이 필요한 짧은 글까지.</p><div class="facts"><span><b>10</b>문제</span><span><b>20–30</b>초씩</span><span><b>초6–고3</b></span></div><button class="primary" id="start">내 영어 학년 알아보기 <span aria-hidden="true">→</span></button><p class="hint">모르는 문제는 넘어가도 괜찮아요.</p></section><section class="preview"><span class="eyebrow">어떤 문제를 풀까요?</span><p lang="en">Small questions.<br><em>A little discovery.</em></p><div class="tags">${Object.values(labels).map(label => `<span>${label}</span>`).join('')}</div></section>`);
  document.querySelector('#start')!.addEventListener('click', begin);
}
function begin() {
  session = startQuiz(bank, { recentIds: recent });
  showQuestion();
}
function showQuestion() {
  if (!session?.pending) { showResult(); return; }
  session = { ...session, pending: shuffleChoices(session.pending) };
  const q = session.pending!;
  phase = 'question';
  const index = session.history.length + 1;
  shell(`<section class="quiz"><div class="question-top"><span class="eyebrow">QUESTION ${String(index).padStart(2, '0')} <span class="muted">/ ${QUESTION_COUNT}</span></span><span class="domain">${labels[q.domain]}</span></div><div class="progress" role="progressbar" aria-label="퀴즈 진행" aria-valuenow="${index}" aria-valuemin="0" aria-valuemax="10"><span style="width:${index * 10}%"></span></div><div class="timer-row"><span>남은 시간</span><strong id="timer" role="timer" aria-label="남은 시간">${timeLimitMs(q) / 1000}<span>초</span></strong></div><article class="question-card"><p class="passage" lang="en">${escape(q.passage)}</p><h1 class="prompt" tabindex="-1">${escape(q.prompt)}</h1><div class="choices">${q.choices.map((choice, i) => `<button class="choice" data-answer="${i}"><span class="choice-number">${i + 1}</span><span>${escape(choice)}</span></button>`).join('')}</div></article><button class="skip" id="skip">넘어가기 <span aria-hidden="true">→</span></button><div id="feedback" aria-live="polite"></div></section>`);
  document.querySelectorAll<HTMLButtonElement>('[data-answer]').forEach(button => button.addEventListener('click', () => finish(Number(button.dataset.answer), q.id)));
  document.querySelector('#skip')!.addEventListener('click', () => finish('skip', q.id));
  document.querySelector<HTMLElement>('.prompt')?.focus({ preventScroll: true });
  // Stop any feedback scrolling and show the new passage before starting its timer.
  window.scrollTo({ top: 0, behavior: 'instant' });
  // Start after content is in the DOM, using both monotonic and wall time to cover suspension.
  startedAt = performance.now();
  wallStartedAt = Date.now();
  tick(q.id);
}
function elapsed() { return Math.max(performance.now() - startedAt, Date.now() - wallStartedAt, 0); }
function tick(id: string) {
  if (phase !== 'question' || session?.pending?.id !== id) return;
  const remaining = Math.max(0, timeLimitMs(session.pending) - elapsed());
  const timer = document.querySelector('#timer');
  if (timer) { timer.innerHTML = `${Math.ceil(remaining / 1000)}<span>초</span>`; timer.classList.toggle('urgent', remaining <= 5000); }
  if (!remaining) { finish('timeout', id); return; }
  frame = requestAnimationFrame(() => tick(id));
}
function finish(answer: number | 'skip' | 'timeout', id: string) {
  if (phase !== 'question' || !session?.pending || session.pending.id !== id) return;
  phase = 'feedback'; // Locks duplicate clicks before changing state.
  cancelAnimationFrame(frame);
  const next = submitAnswer(bank, session, answer, elapsed(), { recentIds: recent });
  const evidence = next.history.at(-1)!;
  recent = [id, ...recent.filter(value => value !== id)].slice(0, 400);
  try { localStorage.setItem(recentKey, JSON.stringify(recent)); } catch { /* Continue without persistence. */ }
  document.querySelectorAll<HTMLButtonElement>('.choice').forEach((button, i) => {
    button.disabled = true;
    if (i === evidence.question.answer) button.classList.add('correct');
    if (typeof answer === 'number' && i === answer && evidence.outcome === 'incorrect') button.classList.add('incorrect');
  });
  document.querySelector<HTMLButtonElement>('#skip')!.hidden = true;
  const title = { correct: '정답이에요!', incorrect: '다음에는 맞힐 수 있어요', timeout: '시간이 끝났어요', skip: '이 문제는 넘어갔어요' }[evidence.outcome];
  document.querySelector('#feedback')!.innerHTML = `<section class="feedback ${evidence.outcome === 'correct' ? 'success' : ''}"><h2>${title}</h2><p class="answer-line">정답: ${escape(evidence.question.choices[evidence.question.answer])}</p><p>${escape(evidence.question.explanation)}</p><button class="primary" id="next">${next.result ? '내 결과 보기' : '다음 문제'} <span aria-hidden="true">→</span></button></section>`;
  session = next;
  document.querySelector<HTMLButtonElement>('#next')!.addEventListener('click', () => { if (phase !== 'feedback') return; showQuestion(); });
  document.querySelector<HTMLElement>('#next')?.focus({ preventScroll: true });
  // Reveal the explanation and its action without making the player scroll after every answer.
  document.querySelector<HTMLElement>('.feedback')?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    block: 'end',
  });
}
function review(e: Evidence, i: number) {
  const status = { correct: '정답', incorrect: '오답', skip: '넘어감', timeout: '시간 초과' }[e.outcome];
  const chosen = typeof e.selectedAnswer === 'number' ? e.question.choices[e.selectedAnswer] : status;
  return `<details class="review"><summary><span>${i + 1}. ${labels[e.question.domain]}</span><span class="review-status ${e.outcome === 'correct' ? 'good' : ''}">${status}</span></summary><div class="review-body"><p class="passage" lang="en">${escape(e.question.passage)}</p><p><b>${escape(e.question.prompt)}</b></p><p>내 답: ${escape(chosen)}</p><p>정답: ${escape(e.question.choices[e.question.answer])}</p><p class="explanation">${escape(e.question.explanation)}</p></div></details>`;
}
function showResult() {
  if (!session?.result) return;
  phase = 'result';
  const result = session.result;
  const label = LEVELS.find(item => item.level === result.level)!.label;
  const badgeLabel = label.replace('초등학교 ', '초').replace('중학교 ', '중').replace('고등학교 ', '고').replace('학년', '');
  const correct = session.history.filter(e => e.outcome === 'correct').length;
  shell(`<section class="result"><span class="eyebrow">나의 영어 학년</span><div class="result-badge" aria-hidden="true">${badgeLabel}</div><h1>지금 나의 영어 실력은<br><strong>${label} 수준</strong></h1><p class="result-note">${result.status === 'confirmed' ? '여러 영역의 문제를 풀어 본 결과로 추정했어요.' : '정답 근거가 적어 결과 범위의 시작 학년으로 표시했어요.'}</p><div class="result-stats"><div><b>${correct}<small> / 10</small></b><span>맞힌 문제</span></div><div><b>${new Set(session.history.filter(e => e.outcome === 'correct').map(e => e.question.domain)).size}<small> / 4</small></b><span>정답을 맞힌 영역</span></div></div><button class="primary" id="share">내 결과 자랑하기 <span aria-hidden="true">↗</span></button><p id="share-status" class="hint" aria-live="polite"></p><button class="secondary" id="again">한 번 더 도전하기</button></section><section class="review-list"><h2>문제 다시 보기 <span>10</span></h2><p class="hint">문제를 누르면 정답과 해설을 볼 수 있어요.</p>${session.history.map(review).join('')}</section>`);
  document.querySelector('#again')!.addEventListener('click', begin);
  document.querySelector('#share')!.addEventListener('click', () => share(label, correct));
  document.querySelector<HTMLHeadingElement>('.result h1')!.setAttribute('tabindex', '-1');
  document.querySelector<HTMLElement>('.result h1')?.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
}
async function share(label: string, correct: number) {
  const text = `나의 영어 학년은 ${label}! 10문제 중 ${correct}개 정답. 너의 영어 학년도 알아봐!`;
  const url = new URL('.', location.href).href;
  const status = document.querySelector('#share-status')!;
  try {
    if (navigator.share) { await navigator.share({ title: '나의 영어 학년은?', text, url }); return; }
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(`${text}\n${url}`); status.textContent = '결과와 링크를 복사했어요.'; return; }
    status.innerHTML = `<label>이 내용을 복사해서 공유해 주세요.<textarea readonly>${escape(text + '\n' + url)}</textarea></label>`;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    status.innerHTML = `<label>이 내용을 복사해서 공유해 주세요.<textarea readonly>${escape(text + '\n' + url)}</textarea></label>`;
  }
}
document.addEventListener('visibilitychange', () => { if (phase === 'question' && !document.hidden && session?.pending) { cancelAnimationFrame(frame); tick(session.pending.id); } });
try {
  const response = await fetch(new URL('../quiz/data/bank.json', import.meta.url));
  if (!response.ok) throw new Error('Unable to load questions');
  bank = await response.json();
  // Fail before showing the start button if a deployment is incomplete.
  startQuiz(bank);
  home();
} catch {
  shell('<section class="hero"><h1>문제를 불러오지 못했어요</h1><p>잠시 후 다시 시도해 주세요.</p><button class="primary" id="reload">다시 불러오기</button></section>');
  document.querySelector('#reload')!.addEventListener('click', () => location.reload());
}
