// kidscalscript.js

// 과일 데이터
const fruitsData = {
    apple: { name: '사과', img: 'https://via.placeholder.com/50x50.png?text=🍎' },
    banana: { name: '바나나', img: 'https://via.placeholder.com/50x50.png?text=🍌' },
    orange: { name: '오렌지', img: 'https://via.placeholder.com/50x50.png?text=🍊' },
    grape: { name: '포도', img: 'https://via.placeholder.com/50x50.png?text=🍇' },
    strawberry: { name: '딸기', img: 'https://via.placeholder.com/50x50.png?text=🍓' },
    pineapple: { name: '파인애플', img: 'https://via.placeholder.com/50x50.png?text=🍍' },
    watermelon: { name: '수박', img: 'https://via.placeholder.com/50x50.png?text=🍉' },
    cherry: { name: '체리', img: 'https://via.placeholder.com/50x50.png?text=🍒' },
    pear: { name: '배', img: 'https://via.placeholder.com/50x50.png?text=🍐' }
};

// 계산 로직 변수
let currentOperand = 0;
let currentOperator = null;
let previousOperand = null;

// DOM 요소
const displayArea = document.getElementById('display-area');
const resultArea = document.getElementById('result-area');
const fruitButtons = document.querySelectorAll('.fruit-button');
const operatorButtons = document.querySelectorAll('.operator');

// 과일 버튼 클릭 이벤트
fruitButtons.forEach(button => {
    button.addEventListener('click', () => {
        addFruit(button.getAttribute('data-fruit'));
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
    currentOperand += 1;
    updateDisplay(fruit);
}

// 연산자 처리 함수
function handleOperator(operator) {
    if (operator === '=') {
        if (currentOperator && previousOperand !== null) {
            const result = calculate(previousOperand, currentOperator, currentOperand);
            displayResult(result);
            // 초기화
            currentOperand = 0;
            currentOperator = null;
            previousOperand = null;
            updateDisplay();
        }
    } else {
        if (currentOperator && previousOperand !== null) {
            // 연속된 연산자 처리
            previousOperand = calculate(previousOperand, currentOperator, currentOperand);
            currentOperator = operator;
            currentOperand = 0;
        } else {
            previousOperand = currentOperand;
            currentOperator = operator;
            currentOperand = 0;
        }
        updateDisplay();
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

    if (previousOperand !== null) {
        // 이전 피연산자 표시
        for (let i = 0; i < previousOperand; i++) {
            const fruitImg = document.createElement('img');
            fruitImg.src = getRandomFruitImage();
            fruitImg.style.width = '30px';
            fruitImg.style.height = '30px';
            fruitImg.style.margin = '2px';
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

    // 현재 피연산자 표시
    for (let i = 0; i < currentOperand; i++) {
        const fruitImg = document.createElement('img');
        fruitImg.src = getRandomFruitImage();
        fruitImg.style.width = '30px';
        fruitImg.style.height = '30px';
        fruitImg.style.margin = '2px';
        displayArea.appendChild(fruitImg);
    }

    // 마지막 추가된 과일 강조 표시 (선택 사항)
    if (lastFruit) {
        const lastFruitImg = document.createElement('img');
        lastFruitImg.src = fruitsData[lastFruit].img;
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
    for (let i = 0; i < roundedResult; i++) {
        const fruitImg = document.createElement('img');
        fruitImg.src = getRandomFruitImage();
        fruitImg.style.width = '50px';
        fruitImg.style.height = '50px';
        fruitImg.style.margin = '5px';
        resultArea.appendChild(fruitImg);
    }
}

// 랜덤 과일 이미지 선택 함수
function getRandomFruitImage() {
    const fruitKeys = Object.keys(fruitsData);
    const randomKey = fruitKeys[Math.floor(Math.random() * fruitKeys.length)];
    return fruitsData[randomKey].img;
}

// 연산자 기호 변환 함수
function getOperatorSymbol(operator) {
    switch(operator) {
        case '+':
            return '+';
        case '-':
            return '-';
        case '*':
            return '×';
        case '/':
            return '÷';
        default:
            return '';
    }
}
