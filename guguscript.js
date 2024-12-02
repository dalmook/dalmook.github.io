// guguscript.js

// 단별 과일 이미지 설정 (로컬 이미지 경로로 업데이트)
const DAN_IMAGES = {
    1: 'images/사과.png',    // 1단: 사과 이미지 URL
    2: 'images/오렌지.png',  // 2단: 오렌지 이미지 URL
    3: 'images/바나나.png',  // 3단: 바나나 이미지 URL
    4: 'images/포도.png',    // 4단: 포도 이미지 URL
    5: 'images/키위.png',    // 5단: 키위 이미지 URL
    6: 'images/수박.png',    // 6단: 수박 이미지 URL
    7: 'images/딸기.png',    // 7단: 딸기 이미지 URL
    8: 'images/배.png',      // 8단: 배 이미지 URL
    9: 'images/감.png'       // 9단: 감 이미지 URL
};

// 단별 과일 이름 설정
const DAN_FRUITS = {
    1: '사과',
    2: '오렌지',
    3: '바나나',
    4: '포도',
    5: '키위',
    6: '수박',
    7: '딸기',
    8: '배',
    9: '감'
};

const DAN_SELECT = document.getElementById('dan-select');
// 입력란을 제거했으므로 해당 요소는 더 이상 존재하지 않습니다.
// const DAN_INPUT = document.getElementById('dan-input');
const SUBMIT_BUTTON = document.getElementById('submit-dan');
const VISUAL_CONTAINER = document.getElementById('card-container');
const CARD_CONTENT = document.getElementById('card-content');
const CARD_DESCRIPTION = document.getElementById('card-description'); // 설명 텍스트 요소 추가
const FEEDBACK = document.getElementById('feedback');
const PREV_BUTTON = document.getElementById('prev-button');
const NEXT_BUTTON = document.getElementById('next-button');

let currentDan = null;
let currentStep = 1; // 현재 카드 단계 (1~9)
const totalSteps = 9;

// 숫자를 한글로 변환하는 함수
function getKoreanNumber(number){
    const numbers = ["영", "하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];
    if(number <=10){
        return numbers[number];
    } else if(number >10 && number <=20){
        return `${numbers[10]} ${numbers[number-10]}`;
    } else {
        // 복잡한 숫자 처리는 여기서 추가 가능
        return number;
    }
}

// 제출 버튼 클릭 시 단 선택 처리
SUBMIT_BUTTON.addEventListener('click', function() {
    let dan = DAN_SELECT.value;

    dan = parseInt(dan);

    if (dan >=1 && dan <=9){
        FEEDBACK.textContent = '';
        currentDan = dan;
        currentStep = 1;
        generateCard(dan, currentStep);
        VISUAL_CONTAINER.classList.remove('hidden');
        updateNavigationButtons();
    } else {
        VISUAL_CONTAINER.classList.add('hidden');
        FEEDBACK.textContent = '1부터 9까지의 단을 선택해주세요.';
    }
});

// 이전 버튼 클릭 시
PREV_BUTTON.addEventListener('click', function() {
    if (currentStep > 1){
        currentStep--;
        generateCard(currentDan, currentStep);
        updateNavigationButtons();
    }
});

// 다음 버튼 클릭 시
NEXT_BUTTON.addEventListener('click', function() {
    if (currentStep < totalSteps){
        currentStep++;
        generateCard(currentDan, currentStep);
        updateNavigationButtons();
    }
});

// 카드 생성 함수
function generateCard(dan, step){
    const result = dan * step;
    const fruit = DAN_FRUITS[dan] || '과일';
    const fruitImage = DAN_IMAGES[dan] || DAN_IMAGES[1];

    // 상세 설명 생성
    // 사용자가 제안한 방식으로 수정했습니다.
    let description = `${fruit} ${dan}개 ${getKoreanNumber(step)}묶음, 총 ${result}개`;

    // 카드 내용 설정
    CARD_CONTENT.innerHTML = `
        <h2>${dan}단</h2>
        <p>${dan} × ${step} = ${result}</p>
        <div class="fruit-group">
            ${generateFruitGroups(dan, step)}
        </div>
    `;

    // 설명 텍스트 업데이트
    CARD_DESCRIPTION.textContent = description;
    CARD_DESCRIPTION.classList.remove('hidden');

    // 애니메이션 효과
    const card = document.getElementById('card-content');
    card.classList.remove('show');
    void card.offsetWidth; // 리플로우 강제
    card.classList.add('show');
}

// 과일 묶음 생성 함수
function generateFruitGroups(dan, step){
    let fruitHTML = '';
    for(let i=0; i<step; i++){
        fruitHTML += `
            <div class="bundle">
                ${generateFruits(dan)}
            </div>
        `;
    }
    return fruitHTML;
}

// 묶음 내 과일 이미지 생성 함수
function generateFruits(dan){
    const numFruitsPerBundle = dan; // 각 단수에 따라 묶음 내 과일 개수 설정
    let fruits = '';
    for(let j=0; j<numFruitsPerBundle; j++){
        fruits += `<img src="${DAN_IMAGES[dan]}" alt="${DAN_FRUITS[dan]}" class="fruit">`;
    }
    return fruits;
}

// 이전/다음 버튼 활성화 상태 업데이트 함수
function updateNavigationButtons(){
    PREV_BUTTON.disabled = currentStep === 1;
    NEXT_BUTTON.disabled = currentStep === totalSteps;

    // 버튼 스타일 변경
    PREV_BUTTON.style.opacity = currentStep === 1 ? '0.5' : '1';
    NEXT_BUTTON.style.opacity = currentStep === totalSteps ? '0.5' : '1';
}
