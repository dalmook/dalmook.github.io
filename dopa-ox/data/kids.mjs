// Grade-one starter pool. New IDs deliberately do not reuse the retired level-1 questions.
// Higher levels are not edited. 110 short concepts + 90 small-number examples.
const reference=(name,url)=>({name,url,checked:'2026-09-28'});
export const KIDS_SOURCES=Object.freeze({
 'kids-observe':reference('생활 속에서 확인하기','./KIDS.md#생활-관찰'),
 'kids-words':reference('쉬운 낱말과 생활 도구','./KIDS.md#낱말-뜻'),
 'kids-letters':reference('글자를 함께 읽어 봐요','./KIDS.md#한글-확인'),
 'kids-flag':reference('행정안전부 어린이 · 태극기','https://www.mois.go.kr/chd/sub/a05/birth/screen.do')
});
const questions=[];
function rows(category,text){
 for(const [i,line] of text.trim().split('\n').entries()){
  const [mark,statement,explanation,source]=line.split('|');
  if(!['O','X'].includes(mark)||!source)throw new Error('Invalid kids row');
  const id=`kids-${category}-${String(i+1).padStart(3,'0')}`;
  questions.push({id,family:id,category,level:1,answer:mark==='O',statement,explanation,source,kind:'curated',audience:'grade-1-starter'});
 }
}
rows('space',`
O|해는 빛을 내요.|해는 스스로 밝은 빛을 내요.|sun
X|우리는 달에서 살고 있어요.|우리는 달이 아니라 지구에서 살아요.|earth
O|달은 지구 주위를 돌아요.|달은 지구 곁을 빙글빙글 돌아요.|moon
X|태양은 지구보다 작아요.|태양은 지구보다 훨씬 커요.|sun
O|지구에는 바다와 땅이 있어요.|우리가 사는 지구에는 바다도, 땅도 있어요.|earth
X|달은 네모난 상자 모양이에요.|달은 공처럼 둥근 모양이에요.|moon
O|낮에는 해 덕분에 밝아요.|해에서 오는 빛이 낮을 밝혀 줘요.|sun
X|밤하늘의 달은 전등이에요.|달은 전등이 아니에요. 햇빛을 받아 밝게 보여요.|moon
O|해를 태양이라고도 불러요.|해와 태양은 같은 것을 부르는 말이에요.|sun
X|지구는 납작한 종이 모양이에요.|지구는 공처럼 둥근 모양이에요.|earth
`);
rows('science',`
O|얼음이 녹으면 물이 돼요.|차가운 얼음이 녹으면 액체인 물이 돼요.|kids-observe
X|물을 얼리면 돌이 돼요.|물을 얼리면 돌이 아니라 얼음이 돼요.|kids-observe
O|풍선에 바람을 넣으면 커져요.|풍선 안에 공기가 들어가서 커져요.|kids-observe
X|철로 만든 못은 종이로 만들어요.|철로 만든 못의 재료는 종이가 아니라 철이에요.|iron
O|얼음은 차가워요.|얼음은 차가운 물건이에요.|kids-observe
X|물은 언제나 딱딱해요.|액체인 물은 흐를 수 있어요.|kids-observe
O|빛이 있으면 물건을 볼 수 있어요.|빛 덕분에 물건의 모양과 색을 볼 수 있어요.|kids-observe
X|소리는 눈으로 들어요.|소리는 귀로 들어요. 눈으로는 보아요.|kids-observe
O|손뼉을 치면 소리가 나요.|두 손바닥을 마주치면 짝짝 소리가 나요.|kids-observe
X|얼음은 불처럼 뜨거워요.|얼음은 뜨겁지 않고 차가워요.|kids-observe
`);
rows('animals',`
O|기린은 목이 길어요.|기린의 긴 목을 떠올려 봐요.|giraffe
X|코끼리의 코는 아주 짧아요.|코끼리는 코가 아주 길어요.|elephant
O|펭귄은 물속에서 헤엄쳐요.|펭귄은 물속에서 헤엄을 잘 쳐요.|penguin
X|판다의 털은 온통 빨간색이에요.|판다는 흰 털과 검은 털이 있어요.|panda
O|박쥐는 날개로 날 수 있어요.|박쥐는 날개를 움직여 하늘을 날아요.|bat
X|타조는 물고기예요.|타조는 물고기가 아니라 새예요.|ostrich
O|코알라는 나무에 올라가요.|코알라는 나무 위에서 많은 시간을 보내요.|koala
X|코끼리는 날개로 하늘을 날아요.|코끼리는 날개가 없고 다리로 걸어요.|elephant
O|판다는 대나무를 먹어요.|대나무는 판다가 주로 먹는 먹이예요.|panda
X|기린은 다리가 두 개예요.|기린은 다리가 네 개예요.|giraffe
`);
rows('nature',`
O|비는 하늘에서 떨어지는 물이에요.|구름 속 물방울이 떨어지면 비가 와요.|water-cycle
X|눈이 녹으면 모래가 돼요.|하얀 눈이 녹으면 물이 돼요.|water-cycle
O|나무는 살아 있는 식물이에요.|나무는 물을 얻으며 자라는 식물이에요.|kids-observe
X|돌에는 나무처럼 잎이 자라요.|돌에는 나무의 잎이 자라지 않아요.|kids-observe
O|비가 오면 땅이 젖을 수 있어요.|비가 땅에 떨어져 땅을 적셔요.|water-cycle
X|구름은 딱딱한 돌덩이에요.|구름은 작은 물방울이나 얼음 알갱이로 이루어져요.|water-cycle
O|씨앗에서 새싹이 나올 수 있어요.|알맞은 곳에서 씨앗이 싹을 틔워요.|kids-observe
X|햇빛은 나무의 뿌리에서 나와요.|햇빛은 나무뿌리가 아니라 해에서 와요.|sun
O|바람이 불면 나뭇잎이 흔들려요.|움직이는 공기가 나뭇잎을 흔들어요.|kids-observe
X|비는 연필이 떨어지는 것이에요.|비는 연필이 아니라 물방울이에요.|water-cycle
`);
rows('world',`
O|바다에는 물이 아주 많아요.|바다에는 넓게 펼쳐진 물이 있어요.|ocean-water
X|강물은 하늘 위에만 있어요.|강물은 땅 위의 물길을 따라 흘러요.|water-cycle
O|섬은 주위가 물로 둘러싸인 땅이에요.|섬의 둘레에는 물이 있어요.|kids-words
X|산은 하늘에 떠 있는 구름이에요.|산은 땅이 높이 솟은 곳이에요.|kids-words
O|지도는 길을 찾는 데 도움이 돼요.|지도에는 길과 장소를 나타내요.|kids-words
X|우리 집 안이 지구 전체예요.|우리 집은 아주 큰 지구의 작은 한 부분이에요.|earth
O|다리로 강을 건널 수 있어요.|강 위에 놓은 다리는 건너편으로 이어져요.|kids-words
X|산과 바다는 모두 하늘에 있어요.|산과 바다는 우리가 사는 지구에 있어요.|earth
O|지구에는 여러 나라가 있어요.|한국 말고도 여러 나라가 있어요.|kids-words
X|사막은 언제나 깊은 바닷속에 있어요.|사막은 비가 적게 오는 땅이에요.|kids-words
`);
rows('heritage',`
O|궁궐은 옛날 왕이 살던 곳이에요.|왕과 왕실 사람들이 살던 큰 집이에요.|changdeok
X|성벽은 먹는 과자 이름이에요.|성벽은 성을 둘러싸서 지키는 벽이에요.|hwaseong
O|옛날 사진으로 옛 모습을 볼 수 있어요.|사진에 예전 사람과 물건의 모습이 남아 있어요.|kids-observe
X|박물관의 옛 물건은 모두 장난감이에요.|그릇이나 옷 등 여러 옛 물건도 있어요.|kids-words
O|옛날에도 사람들이 집에서 살았어요.|우리 조상들도 집을 짓고 살았어요.|villages
X|성문은 하늘에 떠 있는 구름이에요.|성문은 성을 드나드는 문이에요.|hwaseong
O|옛날에 쓰던 물건이 지금도 남아 있어요.|박물관 등에서 오래된 물건을 볼 수 있어요.|kids-words
X|한옥은 비행기 이름이에요.|한옥은 우리나라의 전통 집이에요.|villages
O|기와는 옛집 지붕에 쓰였어요.|기와를 얹은 옛집을 볼 수 있어요.|villages
X|궁궐은 물속을 다니는 잠수함이에요.|궁궐은 왕실 사람들이 지내던 건물이에요.|changdeok
`);
rows('korea',`
O|우리나라 국기는 태극기예요.|대한민국의 국기 이름은 태극기예요.|kids-flag
X|한글은 먹는 과자 이름이에요.|한글은 우리말을 적는 글자예요.|hangul
O|한복은 우리나라의 전통 옷이에요.|명절이나 특별한 날에 한복을 입기도 해요.|kids-words
X|설날은 운동장 이름이에요.|설날은 새해를 맞는 우리 명절이에요.|kids-words
O|추석에는 송편을 먹기도 해요.|송편은 추석에 먹는 떡이에요.|kids-words
X|윷놀이는 축구공을 차는 놀이예요.|윷가락을 던지고 말을 움직이는 놀이예요.|kids-words
O|한글로 우리말을 적을 수 있어요.|가, 나, 다처럼 한글로 말을 적어요.|hangul
X|김치는 신발 이름이에요.|김치는 채소로 만드는 음식이에요.|kids-words
O|태극기에는 빨강과 파랑이 있어요.|가운데 둥근 무늬에 두 색이 있어요.|kids-flag
X|세배는 공을 던지는 놀이예요.|새해에 어른께 절하며 인사하는 것이에요.|kids-words
`);
rows('language',`
O|'바다'의 첫 글자는 '바'예요.|'바다'를 바, 다로 나누어 읽어요.|kids-letters
X|'토끼'는 한 글자예요.|'토'와 '끼'로 두 글자예요.|kids-letters
O|'나무'는 두 글자예요.|'나'와 '무'로 두 글자예요.|kids-letters
X|'가'와 '나'는 같은 글자예요.|'가'와 '나'는 서로 다른 글자예요.|kids-letters
O|'구름'은 '구'로 시작해요.|첫 글자를 읽으면 '구'예요.|kids-letters
X|'사과'는 '고'로 끝나요.|마지막 글자는 '고'가 아니라 '과'예요.|kids-letters
O|ㄱ과 ㅏ를 모으면 '가'예요.|ㄱ과 ㅏ를 모아 '가'라고 적어요.|kids-letters
X|ㄴ과 ㅏ를 모으면 '다'예요.|ㄴ과 ㅏ를 모으면 '나'예요.|kids-letters
O|'우유'에는 '우'가 들어 있어요.|처음에 '우', 다음에 '유'를 적어요.|kids-letters
X|'하늘'은 세 글자예요.|'하'와 '늘'로 두 글자예요.|kids-letters
`);
rows('arts',`
O|노래는 목소리로 부를 수 있어요.|입으로 소리를 내며 노래해요.|kids-words
X|피아노는 밥을 담는 그릇이에요.|피아노는 소리를 내는 악기예요.|kids-words
O|붓으로 그림을 그릴 수 있어요.|붓에 물감을 묻혀 그림을 그려요.|kids-observe
X|색연필은 음식을 끓이는 도구예요.|색연필은 그림이나 글을 그릴 때 써요.|kids-words
O|동화책에는 이야기가 있어요.|동화책을 읽으며 이야기를 만나요.|kids-words
X|북은 소리가 나지 않는 악기예요.|북을 두드리면 둥둥 소리가 나요.|kids-observe
O|찰흙으로 여러 모양을 만들 수 있어요.|찰흙을 주물러 원하는 모양을 만들어요.|kids-observe
X|춤추는 것과 잠자는 것은 같아요.|몸을 움직여 춤추는 것과 자는 것은 달라요.|kids-words
O|빨강과 파랑은 색 이름이에요.|그림을 그릴 때 여러 색을 쓸 수 있어요.|kids-words
X|그림을 그릴 때는 색을 쓸 수 없어요.|색연필과 물감으로 색을 쓸 수 있어요.|kids-observe
`);
rows('sports',`
O|축구는 공으로 하는 운동이에요.|공을 차서 골대에 넣는 운동이에요.|football-ball
X|수영은 물 없이 바닥에서만 해요.|수영은 물속에서 몸을 움직여요.|kids-words
O|달리기는 다리를 움직여 달려요.|걷는 것보다 빠르게 달려 보아요.|kids-words
X|줄넘기는 줄을 들고 잠자는 놀이예요.|돌아가는 줄을 뛰어넘는 운동이에요.|kids-words
O|공을 손으로 던질 수 있어요.|손에 공을 쥐었다가 던질 수 있어요.|kids-observe
X|숨바꼭질은 모두 잠자는 놀이예요.|숨은 사람을 술래가 찾는 놀이예요.|kids-words
O|농구는 공을 골대에 넣는 운동이에요.|손으로 공을 던져 높은 골대에 넣어요.|kids-words
X|아이스 스케이트는 물속에서 타요.|스케이트는 얼음 위에서 타요.|kids-words
O|축구 골키퍼는 골문을 지켜요.|공이 골문에 들어오지 못하게 막아요.|football-players
X|축구공은 네모난 상자 모양이에요.|축구공은 둥근 모양이에요.|football-ball
`);
rows('tech',`
O|키보드로 글자를 입력할 수 있어요.|키보드의 글자 버튼을 눌러요.|kids-words
X|컴퓨터 화면은 신발처럼 신어요.|화면은 글과 그림을 보는 곳이에요.|kids-words
O|마우스로 화면의 버튼을 누를 수 있어요.|마우스를 움직여 버튼을 고르고 눌러요.|kids-words
X|휴대전화는 종이로 된 책이에요.|휴대전화는 전기를 쓰는 기계예요.|kids-words
O|카메라로 사진을 찍을 수 있어요.|사람이나 물건의 모습을 사진으로 남겨요.|kids-words
X|냉장고는 음식을 뜨겁게 보관해요.|냉장고는 음식을 차갑게 보관해요.|kids-words
O|시계로 시간을 볼 수 있어요.|시계의 숫자나 바늘로 시간을 알아봐요.|kids-words
X|전등을 켜면 방이 더 어두워져요.|전등을 켜면 빛이 나와 밝아져요.|kids-observe
O|선풍기는 바람을 일으켜요.|날개가 돌며 바람을 만들어요.|kids-words
X|세탁기는 음식을 굽는 기계예요.|세탁기는 옷을 빠는 기계예요.|kids-words
`);

// Only counting, +/- within ten, comparing, neighbours and number words.
const ending=n=>[0,1,3,6,7,8].includes(n%10)?'이에요':'예요';
const words=['영','하나','둘','셋','넷','다섯','여섯','일곱','여덟','아홉','열'];
function numeric(slot,k,kind,params,statement,explain){
 const [a,b]=params;
 const actual=kind==='add'?a+b:kind==='sub'?a-b:Math.max(a,b);
 const answer=(slot+k)%2===0;
 const claim=answer?actual:(actual===0?1:actual-1);
 const id=`kids-math-${slot}-${k}`;
 questions.push({id,family:id,category:'math',level:1,answer,statement:statement(claim),explanation:explain(actual),source:'math-proof',kind:'calculated',audience:'grade-1-starter',proof:{kind,params,actual,claim}});
}
for(let k=1;k<=10;k++){
 const a=(k-1)%5+1,b=k<=5?1:2;
 numeric(1,k,'add',[a,b],v=>`${a} + ${b} = ${v}${ending(v)}.`,v=>`${a}개에 ${b}개를 더하면 ${v}개예요.`);
 numeric(2,k,'sub',[k,k%3],v=>`${k} - ${k%3} = ${v}${ending(v)}.`,v=>`${k}개에서 ${k%3}개를 빼면 ${v}개예요.`);
 const n=k-1, dots=n?'●'.repeat(n):'없음';
 numeric(3,k,'add',[n,0],v=>`동그라미 ${dots}는 ${v}개예요.`,v=>v?`하나씩 세면 ${v}개예요.`:'하나도 없으면 0개예요.');
 numeric(4,k,'max',[k,(k+3)%10+1],v=>`${k}과 ${(k+3)%10+1} 중 큰 수는 ${v}${ending(v)}.`,v=>`두 수를 비교하면 ${v}이 더 커요.`);
 numeric(5,k,'add',[k-1,1],v=>`${k-1} 다음 수는 ${v}${ending(v)}.`,v=>`${k-1}에서 하나 더 세면 ${v}${ending(v)}.`);
 numeric(6,k,'sub',[k,1],v=>`${k} 바로 앞의 수는 ${v}${ending(v)}.`,v=>`${k}에서 하나를 빼면 ${v}${ending(v)}.`);
 numeric(7,k,'add',[k-1,1],v=>`연필 ${k-1}개에 1개를 더하면 ${v}개예요.`,v=>`${k-1} + 1 = ${v}이므로 ${v}개예요.`);
 numeric(8,k,'sub',[k,1],v=>`사과 ${k}개에서 1개를 먹으면 ${v}개 남아요.`,v=>`${k} - 1 = ${v}이므로 ${v}개 남아요.`);
 numeric(9,k,'add',[k,0],v=>`'${words[k]}'를 숫자로 쓰면 ${v}${ending(v)}.`,v=>`'${words[k]}'를 숫자로 쓰면 ${v}${ending(v)}.`);
}
export const KIDS=Object.freeze(questions);
export function replaceKids(original){
 const byCategory=new Map();for(const q of KIDS){if(!byCategory.has(q.category))byCategory.set(q.category,[]);byCategory.get(q.category).push(q);}
 const used=new Map();const result=original.map(q=>{
  if(q.level!==1)return q;
  const n=used.get(q.category)||0;used.set(q.category,n+1);
  const replacement=byCategory.get(q.category)?.[n];if(!replacement)throw new Error('Kids replacement mismatch');
  return replacement;
 });
 if([...used.values()].reduce((a,b)=>a+b,0)!==KIDS.length)throw new Error('Incomplete kids replacement');
 return result;
}
