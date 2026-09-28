// Independently selected starter vocabulary, not a copied dictionary database.
// Each Korean gloss is the teaching sense used by this wordbook, not all senses.
export const TOPICS = Object.freeze([
 ['동물 친구','🐾'],['맛있는 음식','🍎'],['가족과 사람','👪'],['우리 몸','✋'],
 ['색과 모양','🎨'],['우리 집','🏠'],['학교와 물건','✏️'],['자연과 날씨','🌈'],
 ['움직임','🏃'],['느낌과 모습','😊'],['시간과 숫자','🕒'],['장소와 탈것','🚌']
]);
const lists = [
`cat|고양이
dog|개
bird|새
fish|물고기
duck|오리
pig|돼지
cow|소
hen|암탉
ant|개미
bee|벌
lion|사자
bear|곰
frog|개구리
rabbit|토끼
tiger|호랑이
horse|말
monkey|원숭이
elephant|코끼리
giraffe|기린
butterfly|나비`,
`apple|사과
banana|바나나
grape|포도
peach|복숭아
lemon|레몬
melon|멜론
cherry|체리
carrot|당근
potato|감자
tomato|토마토
bread|빵
rice|쌀; 밥
egg|달걀
milk|우유
water|물
juice|주스
cake|케이크
cookie|쿠키
cheese|치즈
ice cream|아이스크림`,
`mom|엄마
dad|아빠
mother|어머니
father|아버지
sister|여자 형제
brother|남자 형제
baby|아기
family|가족
friend|친구
boy|소년
girl|소녀
man|남자
woman|여자
child|어린이
people|사람들
teacher|선생님
student|학생
doctor|의사
nurse|간호사
farmer|농부`,
`head|머리
face|얼굴
eye|눈
ear|귀
nose|코
mouth|입
tooth|이; 치아
tongue|혀
hair|머리카락
neck|목
shoulder|어깨
arm|팔
hand|손
finger|손가락
leg|다리
knee|무릎
foot|발
toe|발가락
back|등; 뒤
body|몸`,
`red|빨간색
blue|파란색
yellow|노란색
green|초록색
pink|분홍색
purple|보라색
black|검은색
white|흰색
brown|갈색
gray|회색
orange|오렌지; 주황색
color|색
circle|동그라미
square|정사각형
triangle|삼각형
shape|모양
line|선
point|점
round|둥근
straight|곧은`,
`house|집
room|방
door|문
window|창문
wall|벽
floor|바닥
roof|지붕
bed|침대
pillow|베개
blanket|담요
chair|의자
table|탁자
sofa|소파
lamp|램프
clock|시계
mirror|거울
kitchen|부엌
bathroom|욕실
garden|정원
key|열쇠`,
`book|책
pen|펜
pencil|연필
eraser|지우개
ruler|자
paper|종이
bag|가방
desk|책상
notebook|공책
crayon|크레용
scissors|가위
glue|풀; 접착제
box|상자
cup|컵
plate|접시
spoon|숟가락
fork|포크
phone|전화기
computer|컴퓨터
umbrella|우산`,
`sun|해; 태양
moon|달
star|별
sky|하늘
cloud|구름
rain|비
snow|눈; 내리는 눈
wind|바람
rainbow|무지개
tree|나무
leaf|나뭇잎
flower|꽃
grass|풀; 잔디
seed|씨앗
river|강
sea|바다
mountain|산
forest|숲
stone|돌
sand|모래`,
`go|가다
come|오다
run|달리다
walk|걷다
jump|뛰어오르다
sit|앉다
stand|서다
eat|먹다
drink|마시다
sleep|자다
read|읽다
write|쓰다
draw|그리다
sing|노래하다
dance|춤추다
swim|수영하다
open|열다
close|닫다
help|돕다
play|놀다`,
`happy|행복한
sad|슬픈
angry|화가 난
scared|무서워하는
tired|피곤한
hungry|배고픈
thirsty|목마른
big|큰
small|작은
long|긴
short|짧은; 키가 작은
tall|키가 큰
hot|뜨거운
cold|차가운
warm|따뜻한
cool|시원한
fast|빠른
slow|느린
clean|깨끗한
dirty|더러운`,
`one|하나
two|둘
three|셋
four|넷
five|다섯
six|여섯
seven|일곱
eight|여덟
nine|아홉
ten|열
day|하루; 낮
night|밤
morning|아침
evening|저녁
today|오늘
tomorrow|내일
week|일주일
month|한 달
year|일 년
time|시간`,
`school|학교
park|공원
zoo|동물원
library|도서관
hospital|병원
store|가게
market|시장
farm|농장
beach|해변
city|도시
street|거리
bridge|다리; 건너는 다리
car|자동차
bus|버스
train|기차
bike|자전거
boat|배; 작은 배
ship|배; 큰 배
plane|비행기
truck|트럭`
];
export const BASE = Object.freeze(lists.flatMap((text,i)=>text.split('\n').map(line=>{
 const [word,meaning]=line.split('|'); const n=word.replace(/[^a-z]/g,'').length;
 return Object.freeze({id:'word:'+word,word,meaning,group:TOPICS[i][0],level:n<=4?1:n<=6?2:3,origin:'base'});
})));
