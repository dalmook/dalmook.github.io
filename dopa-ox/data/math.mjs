// 54 rule templates × 10 numeric instances. These are calculated variants,
// not 540 independently researched trivia facts. Every answer is recomputable.
const gcd=(a,b)=>b?gcd(b,a%b):a;
const choose=(n,r)=>{let v=1;for(let j=1;j<=r;j++)v=v*(n-j+1)/j;return Math.round(v);};
const prime=n=>n>=2&&Array.from({length:Math.max(0,Math.floor(Math.sqrt(n))-1)},(_,i)=>i+2).every(d=>n%d!==0);
const sum=a=>a.reduce((s,n)=>s+n,0);
export function proofValue(kind,p){
 const [a,b,c,d,e,f,g]=p;
 switch(kind){
 case 'add':return a+b;case 'sub':return a-b;case 'mul':return a*b;case 'div':return a/b;case 'mod':return a%b;case 'max':return Math.max(a,b);case 'next':return a+b;case 'digits':return a*10+b;
 case 'perimeter':return 2*(a+b);case 'sum3':return a+b+c;case 'round10':return Math.round(a/10)*10;case 'average':return sum(p)/p.length;case 'percent':return a*b/100;case 'area':return a*b;case 'volume':return a*b*c;case 'complement':return 180-a;case 'median':return [...p].sort((x,y)=>x-y)[Math.floor(p.length/2)];case 'series':return a*(a+1)/2;
 case 'gcd':return gcd(a,b);case 'lcm':return a*b/gcd(a,b);case 'power':return a**b;case 'polygon':return (a-2)*180;case 'choose':return choose(a,b);case 'multiples':return Math.floor(a/b);case 'surface':return 2*(a*b+a*c+b*c);case 'fractionNumerator':return (a*c)/gcd(a*c,b*d);
 case 'primeCount':return Array.from({length:a},(_,i)=>i+1).filter(prime).length;case 'divisorCount':return Array.from({length:a},(_,i)=>i+1).filter(x=>a%x===0).length;case 'permutation':return Array.from({length:b},(_,i)=>a-i).reduce((s,v)=>s*v,1);case 'dice':return sum(Array.from({length:6},(_,i)=>Array.from({length:6},(_,j)=>Number(i+j+2===a)).reduce((s,v)=>s+v,0)));case 'discriminant':return b*b-4*a*c;case 'weighted':return (a*b+c*d)/(b+d);case 'union':return a+b-c;
 case 'union3':return a+b+c-d-e-f+g;case 'totient':return Array.from({length:a},(_,i)=>i+1).filter(v=>gcd(v,a)===1).length;case 'crt':{for(let x=0;x<a*c;x++)if(x%a===b&&x%c===d)return x;throw new Error('No CRT solution');}
 case 'binomial':return choose(a,b);case 'subset':return 2**a;case 'divisorSum':return sum(Array.from({length:a},(_,i)=>i+1).filter(x=>a%x===0));case 'triangular':return a*(a+1)/2;case 'onto2':return 2**a-2;case 'squareSum':return a*(a+1)*(2*a+1)/6;
 default:throw new Error('Unknown proof '+kind);
 }
}
const BANK=[];
function add(level,slot,k,kind,p,question,explanation){
 const actual=proofValue(kind,p);if(!Number.isSafeInteger(actual))throw new Error('Nonintegral proof');
 const answer=(k+slot)%2===0,claim=actual+(answer?0:(slot%2?1:-1));
 BANK.push({id:`math-${level}-${slot}-${k}`,category:'math',level,answer,statement:question(claim),explanation:explanation(actual),source:'math-proof',family:`math-${level}-${slot}-${k}`,kind:'calculated',proof:{kind,params:p,actual,claim}});
}
for(let k=1;k<=10;k++){
 let l=1;
 add(l,1,k,'add',[k,k+2],v=>`${k} + ${k+2}의 값은 ${v}이다.`,a=>`${k} + ${k+2} = ${a}이다.`);
 add(l,2,k,'sub',[k+12,k],v=>`${k+12}에서 ${k}를 빼면 ${v}이다.`,a=>`${k+12} − ${k} = ${a}이다.`);
 add(l,3,k,'mul',[2,k],v=>`사탕이 ${k}개씩 담긴 봉지 2개의 사탕은 모두 ${v}개다.`,a=>`${k}개를 두 번 더하면 2 × ${k} = ${a}개다.`);
 add(l,4,k,'mul',[4,k],v=>`다리가 4개인 의자 ${k}개의 다리 수는 모두 ${v}개다.`,a=>`의자마다 4개씩이므로 4 × ${k} = ${a}개다.`);
 add(l,5,k,'max',[k+8,k+3],v=>`${k+8}과 ${k+3} 중 더 큰 수는 ${v}이다.`,a=>`두 수를 비교하면 ${a}이 더 크다.`);
 add(l,6,k,'next',[2*k,2],v=>`2씩 커지는 수열에서 ${2*k} 다음 수는 ${v}이다.`,a=>`${2*k} + 2 = ${a}이다.`);
 add(l,7,k,'mul',[3,k],v=>`삼각형 ${k}개에 있는 변을 각각 세어 더하면 ${v}개다.`,a=>`삼각형 하나의 변은 3개이므로 3 × ${k} = ${a}개다.`);
 add(l,8,k,'mul',[60,k],v=>`${k}시간은 ${v}분이다.`,a=>`1시간은 60분이므로 ${k} × 60 = ${a}분이다.`);
 add(l,9,k,'digits',[k%9+1,3],v=>`십의 자리 숫자가 ${k%9+1}, 일의 자리 숫자가 3인 두 자리 수는 ${v}이다.`,a=>`십의 자리 값 ${(k%9+1)*10}과 일의 자리 값 3을 더한 ${a}이다.`);
 l=2;
 add(l,1,k,'mul',[k+2,7],v=>`${k+2} × 7 = ${v}이다.`,a=>`${k+2}를 7번 더한 값은 ${a}이다.`);
 add(l,2,k,'div',[(k+3)*6,6],v=>`${(k+3)*6}을 6으로 나누면 몫은 ${v}이다.`,a=>`6 × ${a} = ${(k+3)*6}이므로 몫은 ${a}이다.`);
 add(l,3,k,'mod',[k+20,4],v=>`${k+20}을 4로 나눈 나머지는 ${v}이다.`,a=>`${k+20} = 4 × ${Math.floor((k+20)/4)} + ${a}이다.`);
 add(l,4,k,'perimeter',[k+2,4],v=>`가로 ${k+2}cm, 세로 4cm인 직사각형 둘레는 ${v}cm다.`,a=>`2 × (${k+2} + 4) = ${a}cm다.`);
 add(l,5,k,'sum3',[k+3,k+4,k+5],v=>`세 변이 ${k+3}cm, ${k+4}cm, ${k+5}cm인 삼각형 둘레는 ${v}cm다.`,a=>`세 변을 더하면 ${k+3} + ${k+4} + ${k+5} = ${a}cm다.`);
 add(l,6,k,'mul',[100,k+3],v=>`100원짜리 동전 ${k+3}개의 금액은 ${v}원이다.`,a=>`100 × ${k+3} = ${a}원이다.`);
 add(l,7,k,'add',[60*k,25],v=>`${k}시간 25분은 총 ${v}분이다.`,a=>`${k} × 60 + 25 = ${a}분이다.`);
 add(l,8,k,'mul',[24,k],v=>`하루를 24시간으로 계산하면 ${k}일은 ${v}시간이다.`,a=>`24 × ${k} = ${a}시간이다.`);
 add(l,9,k,'round10',[k*13+22],v=>`${k*13+22}을 일의 자리에서 반올림한 십의 자리 수는 ${v}이다.`,a=>`일의 자리 숫자를 보고 반올림하면 ${a}이다.`);
 l=3;
 add(l,1,k,'area',[k+4,k+2],v=>`가로 ${k+4}cm, 세로 ${k+2}cm인 직사각형 넓이는 ${v}㎠다.`,a=>`${k+4} × ${k+2} = ${a}㎠다.`);
 add(l,2,k,'percent',[20*k,25],v=>`${20*k}의 25%는 ${v}이다.`,a=>`25%는 4분의 1이므로 ${20*k} ÷ 4 = ${a}이다.`);
 add(l,3,k,'average',[k,k+3,k+6],v=>`${k}, ${k+3}, ${k+6}의 평균은 ${v}이다.`,a=>`세 수의 합 ${3*k+9}을 3으로 나누면 ${a}이다.`);
 add(l,4,k,'add',[k,2],v=>`${k}/20 + 2/20을 분모 20으로 나타내면 분자는 ${v}이다.`,a=>`분모가 같으므로 분자 ${k}와 2를 더한 ${a}이다. 약분 전 표현이다.`);
 add(l,5,k,'mul',[k+1,10],v=>`0.${String(k+1).padStart(2,'0')}을 1,000배 하면 ${v}이다.`,a=>`${(k+1)/100} × 1,000 = ${a}이다.`);
 add(l,6,k,'volume',[k+1,3,4],v=>`세 모서리가 ${k+1}cm, 3cm, 4cm인 직육면체 부피는 ${v}㎤다.`,a=>`${k+1} × 3 × 4 = ${a}㎤다.`);
 add(l,7,k,'complement',[k*10+15],v=>`한 직선 위에서 이웃한 두 각 중 하나가 ${k*10+15}도라면 다른 각은 ${v}도다.`,a=>`두 각의 합이 180도이므로 180 − ${k*10+15} = ${a}도다.`);
 add(l,8,k,'median',[k+9,k+2,k+5],v=>`${k+9}, ${k+2}, ${k+5}의 중앙값은 ${v}이다.`,a=>`작은 순서로 정렬했을 때 가운데 값은 ${a}이다.`);
 add(l,9,k,'series',[k+4],v=>`1부터 ${k+4}까지 자연수를 모두 더하면 ${v}이다.`,a=>`1 + … + ${k+4} = ${k+4} × ${k+5} ÷ 2 = ${a}이다.`);
 l=4;
 add(l,1,k,'gcd',[6*k,9*k],v=>`${6*k}과 ${9*k}의 최대공약수는 ${v}이다.`,a=>`두 수의 공약수 중 가장 큰 수는 ${a}이다.`);
 add(l,2,k,'lcm',[4*k,6*k],v=>`${4*k}과 ${6*k}의 최소공배수는 ${v}이다.`,a=>`최소공배수 = 두 수의 곱 ÷ 최대공약수 = ${a}이다.`);
 add(l,3,k,'power',[k+1,3],v=>`${k+1}의 세제곱은 ${v}이다.`,a=>`${k+1} × ${k+1} × ${k+1} = ${a}이다.`);
 add(l,4,k,'polygon',[k+3],v=>`평면의 볼록 ${k+3}각형의 내각의 합은 ${v}도다.`,a=>`(${k+3} − 2) × 180 = ${a}도다.`);
 add(l,5,k,'choose',[k+3,2],v=>`${k+3}명 중 순서 없이 2명을 고르는 방법은 ${v}가지다.`,a=>`${k+3} × ${k+2} ÷ 2 = ${a}가지다.`);
 add(l,6,k,'multiples',[k*11+23,7],v=>`1부터 ${k*11+23}까지의 자연수 중 7의 배수는 ${v}개다.`,a=>`${k*11+23} ÷ 7의 정수 몫이 ${a}이므로 ${a}개다.`);
 add(l,7,k,'surface',[k+1,3,4],v=>`모서리가 ${k+1}cm, 3cm, 4cm인 직육면체 겉넓이는 ${v}㎠다.`,a=>`2 × (${k+1}×3 + ${k+1}×4 + 3×4) = ${a}㎠다.`);
 add(l,8,k,'fractionNumerator',[k+1,12,3,5],v=>`(${k+1}/12) × (3/5)를 기약분수로 만들면 분자는 ${v}이다.`,a=>`${(k+1)*3}/60을 약분하면 분자는 ${a}이다.`);
 add(l,9,k,'average',[2*k,4*k,6*k,8*k],v=>`${2*k}, ${4*k}, ${6*k}, ${8*k}의 산술평균은 ${v}이다.`,a=>`네 수의 합 ${20*k}을 4로 나누면 ${a}이다.`);
 l=5;
 add(l,1,k,'primeCount',[k*3+10],v=>`1 이상 ${k*3+10} 이하의 소수는 ${v}개다.`,a=>`해당 소수는 ${Array.from({length:k*3+10},(_,i)=>i+1).filter(prime).join(', ')}로 총 ${a}개다.`);
 add(l,2,k,'divisorCount',[12*k],v=>`${12*k}의 양의 약수는 모두 ${v}개다.`,a=>`1부터 ${12*k}까지 나누어떨어지는 양의 정수를 세면 ${a}개다.`);
 add(l,3,k,'choose',[k+4,3],v=>`${k+4}개 중 순서 없이 3개를 고르는 방법은 ${v}가지다.`,a=>`${k+4} × ${k+3} × ${k+2} ÷ 6 = ${a}가지다.`);
 add(l,4,k,'permutation',[k+3,3],v=>`서로 다른 ${k+3}개에서 3개를 골라 순서 있게 놓는 방법은 ${v}가지다.`,a=>`${k+3} × ${k+2} × ${k+1} = ${a}가지다.`);
 add(l,5,k,'dice',[k+1],v=>`구별되는 보통 주사위 2개의 눈의 합이 ${k+1}인 순서쌍은 ${v}개다.`,a=>`각 눈이 1~6인 (첫째 눈, 둘째 눈)을 세면 ${a}개다.`);
 add(l,6,k,'mod',[2**(k+2),7],v=>`2의 ${k+2}제곱을 7로 나눈 나머지는 ${v}이다.`,a=>`2^${k+2} = ${2**(k+2)}이고, 이를 7로 나눈 나머지는 ${a}이다.`);
 add(l,7,k,'discriminant',[1,k+3,k],v=>`방정식 x² + ${k+3}x + ${k} = 0의 판별식 값은 ${v}이다.`,a=>`b² − 4ac = ${k+3}² − 4×${k} = ${a}이다.`);
 add(l,8,k,'weighted',[k*3,2,k*3+6,1],v=>`값 ${k*3}의 가중치가 2, 값 ${k*3+6}의 가중치가 1이면 가중평균은 ${v}이다.`,a=>`(${k*3}×2 + ${k*3+6}) ÷ 3 = ${a}이다.`);
 add(l,9,k,'union',[k+12,k+15,k],v=>`A가 ${k+12}개, B가 ${k+15}개이고 공통 원소가 ${k}개면 합집합의 원소는 ${v}개다.`,a=>`중복을 한 번 빼므로 ${k+12} + ${k+15} − ${k} = ${a}개다.`);
 l=6;
 add(l,1,k,'union3',[k+20,k+22,k+24,6,7,8,2],v=>`세 집합의 크기가 ${k+20}, ${k+22}, ${k+24}이고 두 집합씩의 교집합 크기가 6, 7, 8, 세 집합의 공통 크기가 2이면 합집합 크기는 ${v}이다.`,a=>`포함배제 원리: ${k+20}+${k+22}+${k+24}−6−7−8+2 = ${a}이다.`);
 add(l,2,k,'totient',[k*4+8],v=>`1부터 ${k*4+8}까지 중 ${k*4+8}과 서로소인 자연수의 개수는 ${v}개다.`,a=>`최대공약수가 1인 수를 세는 오일러 피 함수 값은 ${a}이다.`);
 add(l,3,k,'crt',[5,k%5,7,k%7],v=>`5로 나눈 나머지가 ${k%5}, 7로 나눈 나머지가 ${k%7}인 가장 작은 음이 아닌 정수는 ${v}이다.`,a=>`0부터 34까지 두 조건을 모두 만족하는 값은 ${a}이다.`);
 add(l,4,k,'binomial',[k+5,4],v=>`다항식 (1+x)의 ${k+5}제곱에서 x⁴의 계수는 ${v}이다.`,a=>`이항정리에 따라 ${k+5}개에서 4개를 고르는 조합 수 ${a}이다.`);
 add(l,5,k,'subset',[k+2],v=>`원소가 ${k+2}개인 집합의 부분집합은 공집합을 포함해 ${v}개다.`,a=>`각 원소의 포함·미포함 두 선택을 곱해 2^${k+2} = ${a}개다.`);
 add(l,6,k,'divisorSum',[k*6+6],v=>`${k*6+6}의 양의 약수를 모두 더하면 ${v}이다.`,a=>`약수 ${Array.from({length:k*6+6},(_,i)=>i+1).filter(x=>(k*6+6)%x===0).join(', ')}의 합은 ${a}이다.`);
 add(l,7,k,'triangular',[k+5],v=>`원소가 ${k+5}개인 수열에서 길이 1 이상의 연속 부분 구간은 ${v}개다.`,a=>`길이별 개수의 합 ${k+5} + ${k+4} + … + 1 = ${a}개다.`);
 add(l,8,k,'onto2',[k+2],v=>`원소가 ${k+2}개인 집합에서 원소가 2개인 집합으로 가는 전사함수는 ${v}개다.`,a=>`전체 함수 2^${k+2}개에서 한 값만 쓰는 상수함수 2개를 빼면 ${a}개다.`);
 add(l,9,k,'squareSum',[k+3],v=>`1²부터 ${k+3}²까지 제곱수를 모두 더하면 ${v}이다.`,a=>`n(n+1)(2n+1)/6에 n=${k+3}을 넣으면 ${a}이다.`);
}
export default BANK;
