// Unlockable show (id041): backgrounds, correct marks, particles, music,
// Dopakichi's costume and colour, the crowd and the finale. Each item is the
// reward of one trophy (never random), so what is unlocked follows from the
// trophies earned; only the player's choice per category is saved.
import { TROPHY } from './trophies.js';

export const CATS = [
  { key: 'bg', name: '배경' },
  { key: 'mark', name: '정답 표시' },
  { key: 'particle', name: '색종이' },
  { key: 'music', name: '음악' },
  { key: 'costume', name: '옷 갈아입기' },
  { key: 'color', name: '도파키치 색상' },
  { key: 'crowd', name: '응원단' },
  { key: 'finale', name: '피날레' },
];

// base: available from the start. trophy: the trophy whose reward it is.
export const ITEMS = [];
export const ITEM = {};
export function addItems(list) {
  for (const it of list) {
    ITEMS.push(it); ITEM[it.id] = it;
    if (it.trophy && TROPHY[it.trophy]) TROPHY[it.trophy].reward = it.id;
  }
}
addItems([
  { id: 'bg:classic', cat: 'bg', name: '햇살 무늬', base: true },
  { id: 'mark:hanamaru', cat: 'mark', name: '참 잘했어요', base: true },
  { id: 'particle:classic', cat: 'particle', name: '색종이', base: true },
  { id: 'music:classic', cat: 'music', name: '마림바 행진곡', base: true },
  { id: 'costume:none', cat: 'costume', name: '없음', base: true },
  { id: 'color:pink', cat: 'color', name: '분홍', base: true },
  { id: 'crowd:classic', cat: 'crowd', name: '알록달록', base: true },
  { id: 'finale:classic', cat: 'finale', name: '거대 도파키치', base: true },
]);
// id041: one sample per category, to prove the pipeline end to end.
// Rewards follow effort and coming back (plays, days, streaks, stars earned by
// practice), not the placement check, which can master many skills at once.
addItems([
  { id: 'costume:cap', cat: 'costume', name: '모자', trophy: 'days-1' },
  { id: 'particle:note', cat: 'particle', name: '음표', trophy: 'days-3' },
  { id: 'mark:stamp', cat: 'mark', name: '정답 도장', trophy: 'plays-3' },
  { id: 'bg:night', cat: 'bg', name: '밤하늘', trophy: 'streak-3' },
  { id: 'color:blue', cat: 'color', name: '파랑', trophy: 'plays-5' },
  { id: 'finale:fireworks', cat: 'finale', name: '불꽃놀이', trophy: 'extras-5' },
  { id: 'music:chip', cat: 'music', name: '8비트', trophy: 'plays-10' },
  { id: 'crowd:costume', cat: 'crowd', name: '꾸민 응원단', trophy: 'firstTry-50' },
]);
// id042: backgrounds, correct marks and particles.
addItems([
  { id: 'bg:sea', cat: 'bg', name: '바다와 거품', trophy: 'problems-100' },
  { id: 'bg:festival', cat: 'bg', name: '축제', trophy: 'days-15' },
  { id: 'bg:paper', cat: 'bg', name: '종이 공작', trophy: 'problems-200' },
  { id: 'bg:space', cat: 'bg', name: '우주', trophy: 'extras-10' },
  { id: 'mark:medal', cat: 'mark', name: '메달', trophy: 'streak-7' },
  { id: 'mark:crown', cat: 'mark', name: '왕관', trophy: 'perfects-3' },
  { id: 'mark:ring', cat: 'mark', name: '불꽃 고리', trophy: 'combo-30' },
  { id: 'particle:petal', cat: 'particle', name: '꽃잎', trophy: 'stickers-7' },
  { id: 'particle:digit', cat: 'particle', name: '숫자', trophy: 'cells-1000' },
  { id: 'particle:bubble', cat: 'particle', name: '거품', trophy: 'review-10' },
  { id: 'particle:candy', cat: 'particle', name: '사탕', trophy: 'extraBest-10' },
]);
// id043: songs (8비트 is the id041 sample).
addItems([
  { id: 'music:matsuri', cat: 'music', name: '축제 음악', trophy: 'streak-5' },
  { id: 'music:brass', cat: 'music', name: '브라스 밴드', trophy: 'days-5' },
  { id: 'music:electro', cat: 'music', name: '일렉트로', trophy: 'extras-3' },
]);
// id044: costumes, colours, crowd and finales (id045 moved three rewards to the new series).
addItems([
  { id: 'costume:hachimaki', cat: 'costume', name: '머리띠', trophy: 'problems-50' },
  { id: 'costume:cape', cat: 'costume', name: '망토', trophy: 'combo-20' },
  { id: 'costume:glasses', cat: 'costume', name: '동그란 안경', trophy: 'firstTry-100' },
  { id: 'costume:ribbon', cat: 'costume', name: '리본', trophy: 'stickers-14' },
  { id: 'costume:crown', cat: 'costume', name: '왕관', trophy: 'streak-14' },
  { id: 'costume:wizard', cat: 'costume', name: '마법사 모자', trophy: 'star5-1' },
  { id: 'costume:headphones', cat: 'costume', name: '헤드폰', trophy: 'capsules-1' },
  { id: 'color:mint', cat: 'color', name: '초록', trophy: 'days-7' },
  { id: 'color:snow', cat: 'color', name: '눈꽃 흰색', trophy: 'questDays-7' },
  { id: 'color:yellow', cat: 'color', name: '노랑', trophy: 'problems-300' },
  { id: 'color:violet', cat: 'color', name: '보라', trophy: 'extraSolved-100' },
  { id: 'color:gold', cat: 'color', name: '황금', trophy: 'streak-30' },
  { id: 'color:rainbow', cat: 'color', name: '무지개', trophy: 'days-100' },
  { id: 'crowd:rainbow', cat: 'crowd', name: '무지개 응원단', trophy: 'days-30' },
  { id: 'crowd:twins', cat: 'crowd', name: '쌍둥이 응원단', trophy: 'starsTotal-100' },
  { id: 'finale:parade', cat: 'finale', name: '퍼레이드', trophy: 'streak-10' },
  { id: 'finale:rocket', cat: 'finale', name: '로켓', trophy: 'extras-20' },
]);

export const isUnlocked = (it, got = {}) => !!(it && (it.base || (it.trophy && got[it.trophy])));
export const unlockedIn = (cat, got) => ITEMS.filter((it) => it.cat === cat && isUnlocked(it, got));
export const defaultEquip = () => Object.fromEntries(CATS.map((c) => [c.key, 'auto']));

// The look for one play: fixed choices stay; "auto" picks among the unlocked
// ones so every play can look and sound a little different.
export function pickLook(equip = {}, got = {}, rng = Math.random) {
  const look = {};
  for (const { key } of CATS) {
    const want = equip[key];
    const own = unlockedIn(key, got);
    if (want && want !== 'auto' && own.some((it) => it.id === want)) look[key] = want;
    else look[key] = own[Math.floor(rng() * own.length)].id;
  }
  return look;
}
// The part after "cat:" (what the show modules switch on).
export const variant = (id) => (id ? id.split(':')[1] : 'classic');
