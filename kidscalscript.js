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

// 입력 기록을 저장하는 배열
let inputs = [];

// DOM 요소
const displayArea = document.getElementById('display-area');
const resultArea = document.getElementById('result-area');
const fruitButtons = document.querySelectorAll('.fruit-button');
const operatorButtons = document.querySelectorAll('.operator');

// 과일 버튼 클릭 이벤트
fruitButtons.forEach(button => {
    button.addEventListener('click', () => {
        const fruit = button.getAttribute('data-fruit');
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
    inputs.push({ type: 'fruit', name: fruit });
    updateDisplay();
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
            inputs = [];
            updateDisplay();
        }
    } else if (operator === 'backspace') {
        handleBackspace();
    } else {
        if (currentOperator && previousValue !== null) {
            // 연속된 연산자 처리
            previousValue = calculate(previousValue, currentOperator, currentValue);
            previousOperator = operator;
            currentOperator = operator;
            currentValue = 0;
            // Update last fruit if exists
            const lastInput = inputs[inputs.length - 1];
            if (lastInput && lastInput.type === 'fruit') {
                inputs.pop();
                inputs.push({ type: 'result', value: previousValue });
            }
        } else {
            previousValue = currentValue;
            previousOperator = operator;
            currentOperator = operator;
            currentValue = 0;
        }
        inputs.push({ type: 'operator', value: operator });
        updateDisplay();
    }
}

// 백스페이스 처리 함수
function handleBackspace() {
    if (inputs.length > 0) {
        const lastInput = inputs.pop();
        if (lastInput.type === 'fruit') {
            currentValue -= 1;
            const fruitName = lastInput.name;
            if (fruitCounts[fruitName] > 0) {
                fruitCounts[fruitName] -= 1;
            }
        } else if (lastInput.type === 'operator') {
            if (lastInput.value !== 'backspace') {
                if (currentOperator === lastInput.value) {
                    currentOperator = previousOperator;
                    previousOperator = null;
                }
            }
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
function updateDisplay() {
    // 현재 계산식 표시
    displayArea.innerHTML = '';

    inputs.forEach(input => {
        if (input.type === 'fruit') {
            const fruitImg = document.createElement('img');
            fruitImg.src = fruitsData[input.name].img;
            fruitImg.alt = fruitsData[input.name].name;
            displayArea.appendChild(fruitImg);
        } else if (input.type === 'operator') {
            const operatorSpan = document.createElement('span');
            operatorSpan.textContent = ` ${getOperatorSymbol(input.value)} `;
            operatorSpan.style.fontSize = '24px';
            operatorSpan.style.margin = '5px';
            displayArea.appendChild(operatorSpan);
        } else if (input.type === 'result') {
            const resultSpan = document.createElement('span');
            resultSpan.textContent = ` ${input.value} `;
            resultSpan.style.fontSize = '24px';
            resultSpan.style.margin = '5px';
            displayArea.appendChild(resultSpan);
        }
    });
}

// 결과 표시 함수
function displayResult(result) {
    resultArea.innerHTML = `결과: ${result}개 (${getFruitCountsText()})`;
}

// 과일 카운트 텍스트 생성 함수
function getFruitCountsText() {
    const counts = [];
    for (const [fruit, count] of Object.entries(fruitCounts)) {
        if (count > 0) {
            counts.push(`${fruitsData[fruit].name} ${count}개`);
        }
    }
    if (currentOperator) {
        counts.push(getOperatorSymbol(currentOperator));
    }
    return counts.join(' ');
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
        case 'backspace':
            return '<-';
        default:
            return '';
    }
}

// 과일 카운트 업데이트 함수
function updateFruitCount(fruit) {
    fruitCounts[fruit] += 1;
    const countElement = document.getElementById(`count-${fruit}`);
    if (countElement) {
        countElement.textContent = fruitCounts[fruit];
    }
}
