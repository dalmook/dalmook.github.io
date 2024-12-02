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
    grape: { name: '포도', img: 'images/포도.png' },
    poo: { name: '똥', img: 'images/poo.png' } // 새 과일 추가
};

// 과일 카운트 데이터
let fruitCounts = {
    apple: 0,
    pear: 0,
    watermelon: 0,
    kiwi: 0,
    banana: 0,
    orange: 0,
    strawberry: 0,
    persimmon: 0,
    grape: 0,
    poo: 0 // 새 과일 카운트 추가
};

// 입력 기록을 저장하는 배열 (과일과 연산자 순서대로)
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
    const operator = button.getAttribute('data-operator');
    if (operator === 'clear') {
        button.addEventListener('click', () => {
            clearAll();
        });
    } else if (operator !== 'backspace' && operator !== '=') {
        button.addEventListener('click', () => {
            handleOperator(operator);
        });
    } else if (operator === 'backspace') {
        button.addEventListener('click', () => {
            handleBackspace();
        });
    } else if (operator === '=') {
        button.addEventListener('click', () => {
            calculateResult();
        });
    }
});

// 과일 추가 함수
function addFruit(fruit) {
    // 동일한 과일이 마지막에 추가되어 있으면 카운트만 증가
    const lastInput = inputs[inputs.length - 1];
    if (lastInput && lastInput.type === 'fruit' && lastInput.value === fruit) {
        lastInput.count += 1;
    } else {
        inputs.push({ type: 'fruit', value: fruit, count: 1 });
    }
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
    // 연산자가 '('인 경우는 특별히 처리
    if (operator === '(') {
        inputs.push({ type: 'operator', value: operator });
        updateDisplay();
        return;
    }

    // 닫는 괄호 ')'을 추가할 때는 열린 괄호 '('의 수를 확인
    if (operator === ')') {
        const openParens = inputs.filter(input => input.type === 'operator' && input.value === '(').length;
        const closeParens = inputs.filter(input => input.type === 'operator' && input.value === ')').length;
        if (closeParens >= openParens) {
            alert("닫는 괄호 ')'의 수가 부족합니다.");
            return;
        }
        // 닫는 괄호 앞에 반드시 과일이 있어야 함
        const lastInput = inputs[inputs.length - 1];
        if (!lastInput || lastInput.type !== 'fruit') {
            alert("닫는 괄호 ')' 앞에는 과일이 와야 합니다.");
            return;
        }
    }

    // 연산자가 연속해서 입력되는 것을 방지
    const lastInput = inputs[inputs.length - 1];
    if (lastInput && lastInput.type === 'operator' && lastInput.value !== '(') {
        alert("연산자는 과일 다음에만 입력할 수 있습니다.");
        return;
    }

    // '('를 제외한 모든 연산자는 과일 다음에만 입력 가능
    if (operator !== '(' && (!lastInput || lastInput.type !== 'fruit') && operator !== ')') {
        alert("연산자는 과일 다음에만 입력할 수 있습니다.");
        return;
    }

    inputs.push({ type: 'operator', value: operator });
    updateDisplay();
}

// 백스페이스 처리 함수
function handleBackspace() {
    if (inputs.length === 0) return;

    const lastInput = inputs.pop();

    if (lastInput.type === 'fruit') {
        const fruit = lastInput.value;
        if (lastInput.count > 1) {
            lastInput.count -= 1;
            inputs.push(lastInput); // 다시 추가
        }
        if (fruitCounts[fruit] > 0) {
            fruitCounts[fruit] -= 1;
            updateFruitCountDisplay(fruit);
        }
    } else if (lastInput.type === 'operator') {
        if (lastInput.value === '(' || lastInput.value === ')') {
            // 괄호가 제거될 때 특별한 처리가 필요 없다면 그냥 제거
        }
        // 기타 연산자 제거
    }

    // 계산식 업데이트
    updateDisplay();

    // 결과 영역 초기화
    resultArea.innerHTML = '';
}

// 지우기 (Clear All) 함수
function clearAll() {
    // 모든 과일 카운트를 0으로 초기화
    for (const fruit in fruitCounts) {
        if (fruitCounts.hasOwnProperty(fruit)) {
            fruitCounts[fruit] = 0;
            const countElement = document.getElementById(`count-${fruit}`);
            if (countElement) {
                countElement.textContent = '0';
            }
        }
    }

    // 입력 기록 초기화
    inputs = [];
    updateDisplay();

    // 결과 영역 초기화
    resultArea.innerHTML = '';
}

// 과일 카운트 업데이트 디스플레이 함수
function updateFruitCountDisplay(fruit) {
    const countElement = document.getElementById(`count-${fruit}`);
    if (countElement) {
        countElement.textContent = fruitCounts[fruit];
    }
}

// 디스플레이 업데이트 함수
function updateDisplay() {
    // 현재 계산식 표시
    displayArea.innerHTML = '';

    inputs.forEach(input => {
        if (input.type === 'fruit') {
            for (let i = 0; i < input.count; i++) {
                const fruitImg = document.createElement('img');
                fruitImg.src = fruitsData[input.value].img;
                fruitImg.alt = fruitsData[input.value].name;
                fruitImg.title = `${fruitsData[input.value].name} ${input.count}개`;
                fruitImg.classList.add('display-fruit-img');
                displayArea.appendChild(fruitImg);
            }
        } else if (input.type === 'operator') {
            const operatorSpan = document.createElement('span');
            operatorSpan.textContent = ` ${getOperatorSymbol(input.value)} `;
            operatorSpan.classList.add('operator-symbol');
            displayArea.appendChild(operatorSpan);
        }
    });

    // CSS에서 마지막 과일 이미지에만 테두리를 적용하도록 함
}

// 계산 결과 함수
function calculateResult() {
    if (inputs.length === 0) return;

    // Check for balanced parentheses
    const openParens = inputs.filter(input => input.type === 'operator' && input.value === '(').length;
    const closeParens = inputs.filter(input => input.type === 'operator' && input.value === ')').length;
    if (openParens !== closeParens) {
        alert("괄호의 개수가 맞지 않습니다.");
        return;
    }

    // Build expression string
    let expression = '';
    inputs.forEach(input => {
        if (input.type === 'fruit') {
            expression += input.count;
        } else if (input.type === 'operator') {
            expression += input.value;
        }
    });

    try {
        // 안전한 계산을 위해 Function을 사용
        const total = Function('"use strict";return (' + expression + ')')();

        // Build formatted expression with fruits and counts
        let formattedExpression = '';
        inputs.forEach((input, index) => {
            if (input.type === 'fruit') {
                formattedExpression += `${fruitsData[input.value].name} ${input.count}개`;
            } else if (input.type === 'operator') {
                if (input.value === '(' || input.value === ')') {
                    formattedExpression += input.value;
                } else {
                    formattedExpression += ` ${getOperatorSymbol(input.value)} `;
                }
            }
        });

        // Replace multiple spaces
        formattedExpression = formattedExpression.replace(/\s+/g, ' ').trim();

        // Display the result with icons
        resultArea.innerHTML = `결과: ${total}개 [${formattedExpression}]`;

        // 과일 카운트 초기화
        resetCalculator();

    } catch (error) {
        alert("계산 중 오류가 발생했습니다. 입력을 확인해주세요.");
    }
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
        case '(':
            return '(';
        case ')':
            return ')';
        case 'backspace':
            return '←';
        case 'clear':
            return 'C';
        default:
            return '';
    }
}

// 계산 초기화 함수
function resetCalculator() {
    // 과일 카운트 초기화
    for (const fruit in fruitCounts) {
        if (fruitCounts.hasOwnProperty(fruit)) {
            fruitCounts[fruit] = 0;
            const countElement = document.getElementById(`count-${fruit}`);
            if (countElement) {
                countElement.textContent = '0';
            }
        }
    }

    // 기타 계산 상태 초기화
    inputs = [];
    updateDisplay();
}
