// Trophies (id036): many small achievements, like the ones in mobile games.
// Each series is one measure with rising steps; every step is a trophy.
// Days and streaks get dense steps; volume series get wide ones so long
// sessions are not pushed too hard (docs/SPEC.md 14.7). Nothing is
// random, conditions are always shown (except a few secrets), and a trophy,
// once earned, is kept.
import { SKILLS, LANES } from './skills.js';
import { isUnlocked, isMastered, starsOf } from './session.js';

export const CATS = ['계속하기', '꾸준한 연습', '학습 주제', '성장', '보너스', '콤보', '정확도', '도파', '복습', '학년', '컬렉션', '비밀'];

const fmt = (n) => (n >= 10000 && n % 10000 === 0 ? `${n / 10000}만` : n.toLocaleString('ko-KR'));
const DOPA_LABEL = { 2: '100', 3: '1000', 4: '1만', 5: '10만', 6: '100만', 7: '1000만', 8: '1억', 9: '10억' };
const RANKS = ['bronze', 'silver', 'gold', 'rainbow'];
export const RANK_NAME = { bronze: '동', silver: '은', gold: '금', rainbow: '무지개', secret: '비밀' };

// Rank by position in its series: first ~30% bronze, then silver, gold, and the last step rainbow.
function rankAt(i, n) {
  if (n === 1) return 'gold';
  if (i === n - 1) return 'rainbow';
  return RANKS[Math.min(2, Math.floor((i / (n - 1)) * 3.3))];
}

// A series: { key, cat, title, metric, steps, name(v), desc(v) } or explicit items.
const SERIES_DEFS = [
  { key: 'streak', cat: '계속하기', title: '연속으로 플레이', metric: 'bestStreak', steps: [3, 5, 7, 10, 14, 21, 30, 50, 75, 100, 150, 200, 365], name: (v) => `${v}일 연속`, desc: (v) => `${v}일 연속 플레이하기` },
  { key: 'days', cat: '계속하기', title: '플레이한 날', metric: 'days', steps: [1, 3, 5, 7, 10, 15, 20, 30, 40, 50, 75, 100, 150, 200, 300, 365, 500, 730, 1000], name: (v) => `플레이한 날 ${fmt(v)}일`, desc: (v) => `플레이한 날이 총 ${fmt(v)}일` },
  { key: 'stickers', cat: '계속하기', title: '출석 스티커', metric: 'stickers', steps: [1, 7, 14, 30, 50, 100, 200, 365], name: (v) => `스티커 ${v}장`, desc: (v) => `출석 보너스 스티커를 ${v}장 모으기` },
  { key: 'crowns', cat: '계속하기', title: '왕관 스티커', metric: 'crowns', steps: [1, 3, 5, 10, 20, 52], name: (v) => `왕관 ${v}개`, desc: (v) => `7일째 왕관 스티커를 ${v}장 모으기` },
  { key: 'problems', cat: '꾸준한 연습', title: '푼 문제', metric: 'problems', steps: [10, 30, 50, 100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 20000, 30000, 50000, 100000], name: (v) => `${fmt(v)}문제 풀기`, desc: (v) => `총 ${fmt(v)}문제 풀기` },
  { key: 'cells', cat: '꾸준한 연습', title: '입력한 숫자', metric: 'cells', steps: [100, 500, 1000, 3000, 5000, 10000, 30000, 50000, 100000, 300000], name: (v) => `${fmt(v)}자리 입력하기`, desc: (v) => `정답 숫자를 총 ${fmt(v)}자리 입력하기` },
  { key: 'plays', cat: '꾸준한 연습', title: '플레이 횟수', metric: 'plays', steps: [1, 3, 5, 10, 20, 30, 50, 100, 200, 300, 500, 1000, 2000], name: (v) => `${fmt(v)}번 플레이하기`, desc: (v) => `드릴을 총 ${fmt(v)}번 끝까지 풀기` },
  { key: 'minutes', cat: '꾸준한 연습', title: '플레이 시간', metric: 'minutes', steps: [10, 30, 60, 120, 300, 600, 1200, 3000], name: (v) => (v >= 60 ? `총 ${v / 60}시간` : `총 ${v}분`), desc: (v) => `총 플레이 시간 ${v >= 60 ? `${v / 60}시간` : `${v}분`}` },
  { key: 'unlocked', cat: '학습 주제', title: '학습 주제 열림', metric: 'unlocked', steps: [3, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 58], name: (v) => `열림 ${v}개`, desc: (v) => `학습 주제를 ${v}개 열기` },
  { key: 'mastered', cat: '학습 주제', title: '학습 주제 완료', metric: 'mastered', steps: [1, 3, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 58], name: (v) => `완료 ${v}개`, desc: (v) => `학습 주제를 ${v}개 완료하기` },
  { key: 'gradeDone', cat: '학습 주제', title: '학년 전체 완료', items: [1, 2, 3, 4, 5, 6].map((g) => ({ id: `gradeDone-${g}`, metric: `gradeDone${g}`, need: 1, name: `${g}학년 전체 완료`, desc: `${g}학년 모든 학습 주제 완료하기` })) },
  { key: 'laneDone', cat: '학습 주제', title: '영역 전체 완료', items: LANES.map((l, i) => ({ id: `laneDone-${i}`, metric: `laneDone${i}`, need: 1, name: `${l} 완료`, desc: `「${l}」의 모든 학습 주제 완료하기` })) },
  { key: 'extras', cat: '보너스', title: '보너스 도전하기', metric: 'extras', steps: [1, 3, 5, 10, 20, 30, 50, 100, 200, 300], name: (v) => `보너스 ${v}회`, desc: (v) => `보너스에 ${v}번 도전하기` },
  { key: 'extraBest', cat: '보너스', title: '보너스 최고 기록', metric: 'extraBest', steps: [3, 5, 7, 10, 12, 15, 18, 20, 23, 25, 30], name: (v) => `한 번에 ${v}문제`, desc: (v) => `보너스 한 번에 ${v}문제 풀기` },
  { key: 'extraSolved', cat: '보너스', title: '보너스에서 푼 문제', metric: 'extraSolved', steps: [10, 30, 50, 100, 200, 300, 500, 1000, 2000, 3000], name: (v) => `보너스 ${fmt(v)}문제`, desc: (v) => `보너스에서 총 ${fmt(v)}문제 풀기` },
  { key: 'combo', cat: '콤보', title: '콤보', metric: 'maxCombo', steps: [5, 10, 15, 20, 30, 40, 50, 75, 100, 150, 200, 300], name: (v) => `${v}콤보`, desc: (v) => `${v}콤보 달성하기` },
  { key: 'perfects', cat: '정확도', title: '실수 없이 완료', metric: 'perfects', steps: [1, 3, 5, 10, 20, 30, 50, 100, 200, 300], name: (v) => `실수 없이 ${v}회`, desc: (v) => `첫 시도 정답률 100%로 ${v}번 끝까지 풀기` },
  { key: 'firstTry', cat: '정확도', title: '첫 시도 정답', metric: 'firstTry', steps: [10, 50, 100, 300, 500, 1000, 3000, 5000, 10000, 30000], name: (v) => `첫 시도 정답 ${fmt(v)}문제`, desc: (v) => `한 번에 맞힌 문제가 ${fmt(v)}문제` },
  { key: 'dopa', cat: '도파', title: '도파', metric: 'bestDopaL', steps: [2, 3, 4, 5, 6, 7, 8, 9], name: (v) => `${DOPA_LABEL[v]}도파`, desc: (v) => `한 번의 게임에서 도파 ${DOPA_LABEL[v]}넘기기` },
  { key: 'review', cat: '복습', title: '복습', metric: 'reviewSolved', steps: [1, 5, 10, 30, 50, 100, 200, 300], name: (v) => `복습 ${v}문제`, desc: (v) => `틀린 문제를 ${v}문제 다시 풀기` },
  ...[1, 2, 3, 4, 5, 6].map((g) => ({ key: `grade${g}`, cat: '학년', title: `${g}학년 문제 풀기`, metric: `gradePlays${g}`, steps: [1, 10, 30], name: (v) => `${g}학년 ${v}회`, desc: (v) => `「${g}학년」으로 ${v}번 플레이하기` })),
  { key: 'secret', cat: '비밀', title: '비밀', items: [
    { id: 'secret-perfect14', metric: 'flag:perfect14', need: 1, name: '14문제 완벽 정답', desc: '14문제를 틀리지 않고 풀기', secret: true },
    { id: 'secret-extraClean', metric: 'flag:extraClean', need: 1, name: '보너스 실수 없이', desc: '보너스 5문제 이상을 틀리지 않고 풀기', secret: true },
    { id: 'secret-sunday', metric: 'flag:sunday', need: 1, name: '일요일 수학', desc: '일요일에 플레이하기', secret: true },
    { id: 'secret-newyear', metric: 'flag:newyear', need: 1, name: '새해 첫 드릴', desc: '1월 1일에 플레이하기', secret: true },
    { id: 'secret-comeback', metric: 'flag:comeback', need: 1, name: '다시 만나 반가워요!', desc: '일주일 이상 쉬었다가 다시 플레이하기', secret: true },
    { id: 'secret-allmodes', metric: 'allModes', need: 1, name: '모든 모드 탐험', desc: '맞춤, 학년별, 연습, 복습 모드를 모두 플레이하기', secret: true },
  ] },
];

// Other features add their own series (id045). Keep this list append-only.
export const SERIES = [];
export const TROPHIES = [];
export const TROPHY = {};
export function addSeries(def) {
  const items = def.items
    ? def.items.map((it, i, a) => ({ rank: it.secret ? 'secret' : rankAt(i, a.length), ...it }))
    : def.steps.map((v, i, a) => ({ id: `${def.key}-${v}`, metric: def.metric, need: v, name: def.name(v), desc: def.desc(v), rank: rankAt(i, a.length) }));
  const series = { key: def.key, cat: def.cat, title: def.title, items: items.map((it) => ({ ...it, series: def.key, cat: def.cat, reward: it.reward || null })) };
  SERIES.push(series);
  for (const it of series.items) { TROPHIES.push(it); TROPHY[it.id] = it; }
  return series;
}
SERIES_DEFS.forEach(addSeries);

// id045: the features added after id036 (stars, quests, hammer, rust,
// time capsule, "のびたよ", collection).
[
  { key: 'questDays', cat: '계속하기', title: '미션 모두 달성', metric: 'questDays', steps: [1, 3, 7, 14, 30, 50, 100, 200, 365], name: (v) => `모두 달성 ${v}일`, desc: (v) => `오늘의 미션을 모두 달성한 날이 ${v}일` },
  { key: 'questRun', cat: '계속하기', title: '미션 연속', metric: 'questRun', steps: [2, 3, 5, 7, 14, 30], name: (v) => `미션 ${v}일 연속`, desc: (v) => `${v}일 연속으로 모든 미션 완료하기` },
  { key: 'hammer', cat: '계속하기', title: '연속 출석 지킴이', metric: 'hammerUsed', steps: [1, 3, 10], name: (v) => (v === 1 ? '첫 출석 지키기' : `출석 유지 ${v}회`), desc: (v) => `연속 출석 지킴이를 ${v}번 사용하기` },
  { key: 'starsTotal', cat: '학습 주제', title: '별 개수', metric: 'starsTotal', steps: [5, 10, 25, 50, 75, 100, 150, 200, 250, 290], name: (v) => `별 ${v}개`, desc: (v) => `학습 별을 총 ${v}개 모으기` },
  { key: 'star5', cat: '학습 주제', title: '별 5개 학습 주제', metric: 'star5', steps: [1, 3, 5, 10, 20, 30, 58], name: (v) => `☆5 ${v}개`, desc: (v) => `별 5개 학습 주제를 ${v}개 만들기` },
  { key: 'gradeStar3', cat: '학습 주제', title: '학년 전체 별 3개', items: [1, 2, 3, 4, 5, 6].map((g) => ({ id: `gradeStar3-${g}`, metric: `gradeStar3${g}`, need: 1, name: `${g}학년 전체 별 3개`, desc: `${g}학년 모든 주제에서 별 3개 이상 달성하기` })) },
  { key: 'polished', cat: '성장', title: '다시 반짝반짝', metric: 'polished', steps: [1, 3, 5, 10, 30, 50], name: (v) => `반짝반짝 ${v}회`, desc: (v) => `복습이 필요한 주제를 ${v}번 복습하기` },
  { key: 'capsules', cat: '성장', title: '타임캡슐', metric: 'capsules', steps: [1, 3, 5, 10, 30], name: (v) => `캡슐 ${v}개`, desc: (v) => `타임캡슐을 ${v}개 열기` },
  { key: 'capsuleFaster', cat: '성장', title: '예전보다 빨라요', metric: 'capsuleFaster', steps: [1, 5, 10], name: (v) => `예전보다 빠르게 ${v}회`, desc: (v) => `타임캡슐 문제를 예전보다 빨리 풀기(${v}회)` },
  { key: 'grew', cat: '성장', title: '실력이 늘었어요!', metric: 'grew', steps: [1, 5, 10, 30, 50, 100], name: (v) => `실력 향상 ${v}회`, desc: (v) => `결과에서 「실력이 늘었어요!」를 ${v}번 확인하기` },
  { key: 'items', cat: '컬렉션', title: '컬렉션', metric: 'itemsOwned', steps: [10, 20, 30, 40, 47], name: (v) => `컬렉션 ${v}개`, desc: (v) => `컬렉션을 ${v}개 모으기` },
  { key: 'catComplete', cat: '컬렉션', title: '모두 모았어요', metric: 'catComplete', steps: [1, 3, 5, 8], name: (v) => `${v}종류 모두 달성`, desc: (v) => `컬렉션의 ${v}종류 모두 모으기` },
].forEach(addSeries);

// Numbers every trophy is measured against, from the saved state.
// snap: { stats, prog, bestStreak, stickers, crowns, ...extra metrics }
export function trophyMetrics(snap) {
  const s = snap.stats || {};
  const prog = snap.prog || { skills: {} };
  const m = {
    bestStreak: snap.bestStreak || 0, days: s.days || 0, stickers: snap.stickers || 0, crowns: snap.crowns || 0,
    problems: s.problems || 0, cells: s.cells || 0, plays: s.plays || 0, minutes: Math.floor((s.playMs || 0) / 60000),
    unlocked: SKILLS.filter((x) => isUnlocked(prog, x.id)).length, mastered: SKILLS.filter((x) => isMastered(prog, x.id)).length,
    extras: s.extras || 0, extraBest: s.extraBest || 0, extraSolved: s.extraSolved || 0, maxCombo: s.maxCombo || 0,
    perfects: s.perfects || 0, firstTry: s.firstTry || 0, bestDopaL: Math.floor((s.bestDopaL || 0) + 1e-9), reviewSolved: s.reviewSolved || 0,
  };
  const stars = Object.fromEntries(SKILLS.map((x) => [x.id, starsOf(prog, x.id)]));
  m.starsTotal = Object.values(stars).reduce((a, b) => a + b, 0);
  m.star5 = Object.values(stars).filter((n) => n >= 5).length;
  m.polished = s.polished || 0; m.capsules = s.capsules || 0; m.capsuleFaster = s.capsuleFaster || 0; m.grew = s.grew || 0;
  for (let g = 1; g <= 6; g++) {
    m[`gradeStar3${g}`] = SKILLS.filter((x) => x.grade === g).every((x) => stars[x.id] >= 3) ? 1 : 0;
    m[`gradeDone${g}`] = SKILLS.filter((x) => x.grade === g).every((x) => isMastered(prog, x.id)) ? 1 : 0;
    m[`gradePlays${g}`] = (s.grades || {})[g] || 0;
  }
  LANES.forEach((_, i) => { m[`laneDone${i}`] = SKILLS.filter((x) => x.lane === i).every((x) => isMastered(prog, x.id)) ? 1 : 0; });
  for (const [k, v] of Object.entries(s.flags || {})) if (v) m[`flag:${k}`] = 1;
  const modes = s.modes || {};
  m.allModes = ['level', 'grade', 'practice', 'review'].every((k) => modes[k]) ? 1 : 0;
  Object.assign(m, snap.extra || {});
  return m;
}
export const valueOf = (m, metric) => m[metric] || 0;

// Earn every trophy whose condition is met. Returns the new ones (in list order).
// `state` is the saved { got: { id: time } }; the first call earns what the
// existing records already reach and marks them as a batch.
export function evaluate(state, metrics, at = Date.now()) {
  state.got = state.got || {};
  const fresh = [];
  for (const t of TROPHIES) {
    if (state.got[t.id]) continue;
    if (valueOf(metrics, t.metric) >= t.need) { state.got[t.id] = at; fresh.push(t); }
  }
  if (!state.init) { state.init = true; state.batch = fresh.map((t) => t.id); return []; }
  return fresh;
}

export const earnedCount = (state) => TROPHIES.filter((t) => state.got && state.got[t.id]).length;

// Progress of one series for the list screen.
export function seriesView(series, state, metrics) {
  const got = series.items.filter((t) => state.got && state.got[t.id]);
  const next = series.items.find((t) => !(state.got && state.got[t.id]));
  const top = got[got.length - 1] || null;
  return { series, got, next, top, value: next ? valueOf(metrics, next.metric) : null };
}
