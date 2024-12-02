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
let previousValue = null;

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
            inputs = [];
            updateDisplay();
        }
    } else if (operator === 'backspace') {
        handleBackspace();
    } else {
        if (currentOperator && previousValue !== null) {
            // 연속된 연산자 처리
            previousValue = calculate(previousValue, currentOperator, currentValue);
            currentOperator = operator;
            currentValue = 0;
            inputs.push({ type: 'result', value: previousValue });
        } else {
            previousValue = currentValue;
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
            const fruitName = lastInput.name;
            currentValue -= 1;
            if (fruitCounts[fruitName] > 0) {
                fruitCounts[fruitName] -= 1;
            }
        } else if (lastInput.type === 'operator') {
            if (lastInput.value !== 'backspace') {
                if (currentOperator === lastInput.value) {
                    currentOperator = null;
                    previousValue = null;
                }
            }
        } else if (lastInput.type === 'result') {
            previousValue = lastInput.value;
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
            operatorSpan.classList.add('operator-symbol');
            displayArea.appendChild(operatorSpan);
        } else if (input.type === 'result') {
            // 결과 입력이 있을 경우, 결과값을 표시
            const resultSpan = document.createElement('span');
            resultSpan.textContent = ` ${input.value} `;
            resultSpan.style.fontSize = '24px';
            resultSpan.style.margin = '5px';
            displayArea.appendChild(resultSpan);
        }
    });

    // 마지막 추가된 과일 강조 표시 (선택 사항)
    if (inputs.length > 0) {
        const lastInput = inputs[inputs.length - 1];
        if (lastInput.type === 'fruit') {
            const lastFruitImg = document.createElement('img');
            lastFruitImg.src = fruitsData[lastInput.name].img;
            lastFruitImg.alt = fruitsData[lastInput.name].name;
            lastFruitImg.style.width = '30px';
            lastFruitImg.style.height = '30px';
            lastFruitImg.style.margin = '2px';
            lastFruitImg.style.border = '2px solid #ff0000';
            displayArea.appendChild(lastFruitImg);
        }
    }
}

// 결과 표시 함수
function displayResult(result) {
    // 전체 카운트 계산
    let totalCount = 0;
    for (const count of Object.values(fruitCounts)) {
        totalCount += count;
    }

    // 과일별 카운트 텍스트 생성
    const fruitCountsText = Object.entries(fruitCounts)
        .filter(([fruit, count]) => count > 0)
        .map(([fruit, count]) => {
            return `${fruitsData[fruit].name} ${count}개`;
        })
        .join(', ');

    // 결과 텍스트 설정
    resultArea.innerHTML = `결과: ${totalCount}개 (${fruitCountsText})`;
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
            return '←';
        default:
            return '';
    }
}
