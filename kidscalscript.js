// kidscalscript.js

// 과일 데이터
const fruitsData = {
    apple: { name: '사과', img: 'images/사과.png' },
    pear: { name: '배', img: 'images/배.png' },
    watermelon: { name: '수박', img: 'images/수박.png' },
    kiwi: { name: '키위', img: 'images/키위.png' },
    banana: { name: '바나나', img: 'images/바나나.png' },
    orange: { name: '오렌지', img: 'images/오렌지.png' },
    strawberry: { name: '딸기', img: 'images/딸기.png' },
    persimmon: { name: '감', img: 'images/감.png' },
    grape: { name: '포도', img: 'images/포도.png' }
};

// 과일 카운트 데이터
const fruitCounts = {
    apple: 0,
    pear: 0,
    watermelon: 0,
    kiwi: 0,
    banana: 0,
    orange: 0,
    strawberry: 0,
    persimmon: 0,
    grape: 0
};

// 계산 로직 변수
let currentValue = 0;
let currentOperator = null;
let previousValue = 0;
let previousOperator = null;

// 마지막으로 클릭한 과일을 추적하는 변수
let lastClickedFruit = null;

// DOM 요소
const displayArea = document.getElementById('display-area');
const resultArea = document.getElementById('result-area');
const fruitButtons = document.querySelectorAll('.fruit-button');
const operatorButtons = document.querySelectorAll('.operator');

// 과일 버튼 클릭 이벤트
fruitButtons.forEach(button => {
    button.addEventListener('click', () => {
        const fruit = button.getAttribute('data-fruit');
        lastClickedFruit = fruit; // 마지막 클릭한 과일 업데이트
        addFruit(fruit);
        updateFruitCount(fruit);
    });
});

// 연산자 버튼 클릭 이벤트
operatorButtons.forEach(button => {
    button.addEventListener('click', () => {
        const operator = button.getAttribute('data-operator');
        handleOperator(operator);
    });
});

// 과일 추가 함수
function addFruit(fruit) {
    currentValue += 1;
    updateDisplay(fruit);
}

// 과일 카운트 업데이트 함수
function updateFruitCount(fruit) {
    fruitCounts[fruit] += 1;
    const countElement = document.getElementById(`count-${fruit}`);
    if (countElement) {
        countElement.textContent = fruitCounts[fruit];
    }
}

// 연산자 처리 함수
function handleOperator(operator) {
    if (operator === '=') {
        if (currentOperator && previousValue !== null) {
            const result = calculate(previousValue, currentOperator, currentValue);
            displayResult(result);
            // 초기화
            currentValue = 0;
            currentOperator = null;
            previousValue = null;
            previousOperator = null;
            updateDisplay(); // 계산 후 디스플레이 초기화
        }
    } else {
        if (currentOperator && previousValue !== null) {
            // 연속된 연산자 처리
            previousValue = calculate(previousValue, currentOperator, currentValue);
            previousOperator = operator;
            currentOperator = operator;
            currentValue = 0;
        } else {
            previousValue = currentValue;
            previousOperator = operator;
            currentOperator = operator;
            currentValue = 0;
        }
        updateDisplay(); // 연산자 클릭 시 디스플레이 업데이트
    }
}

// 계산 함수
function calculate(a, operator, b) {
    switch(operator) {
        case '+':
            return a + b;
        case '-':
            return a - b;
        case '*':
            return a * b;
        case '/':
            return b !== 0 ? a / b : 0;
        default:
            return 0;
    }
}

// 디스플레이 업데이트 함수
function updateDisplay(lastFruit = null) {
    // 현재 계산식 표시
    displayArea.innerHTML = '';

    if (previousValue !== null && previousValue > 0) {
        // 이전 피연산자 표시 (과일 이미지)
        for (let i = 0; i < previousValue; i++) {
            const fruitImg = document.createElement('img');
            fruitImg.src = fruitsData[lastFruit].img; // 이전 피연산자도 마지막 과일로 설정
            fruitImg.alt = fruitsData[lastFruit].name;
            displayArea.appendChild(fruitImg);
        }

        // 연산자 표시
        if (currentOperator) {
            const operatorSpan = document.createElement('span');
            operatorSpan.textContent = ` ${getOperatorSymbol(currentOperator)} `;
            operatorSpan.style.fontSize = '24px';
            operatorSpan.style.margin = '5px';
            displayArea.appendChild(operatorSpan);
        }
    }

    // 현재 피연산자 표시 (과일 이미지)
    for (let i = 0; i < currentValue; i++) {
        const fruitImg = document.createElement('img');
        fruitImg.src = fruitsData[lastFruit].img;
        fruitImg.alt = fruitsData[lastFruit].name;
        displayArea.appendChild(fruitImg);
    }

    // 마지막 추가된 과일 강조 표시 (선택 사항)
    if (lastFruit) {
        const lastFruitImg = document.createElement('img');
        lastFruitImg.src = fruitsData[lastFruit].img;
        lastFruitImg.alt = fruitsData[lastFruit].name;
        lastFruitImg.style.width = '30px';
        lastFruitImg.style.height = '30px';
        lastFruitImg.style.margin = '2px';
        lastFruitImg.style.border = '2px solid #ff0000';
        displayArea.appendChild(lastFruitImg);
    }
}

// 결과 표시 함수
function displayResult(result) {
    resultArea.innerHTML = '';
    const roundedResult = Math.round(result);
    const resultFruit = lastClickedFruit || 'apple'; // 마지막 클릭한 과일을 결과 과일로 사용, 없으면 사과

    for (let i = 0; i < roundedResult; i++) {
        const fruitImg = document.createElement('img');
        fruitImg.src = fruitsData[resultFruit].img;
        fruitImg.alt = fruitsData[resultFruit].name;
        resultArea.appendChild(fruitImg);
    }
}
