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

// 입력 기록을 저장하는 배열 (operand와 operator 순서대로)
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
    // 마지막 입력이 연산자거나 없으면 새로운 operand 생성
    const lastInput = inputs[inputs.length - 1];
    if (lastInput && lastInput.type === 'operand') {
        // 이미 operand가 있다면 해당 operand에 과일 추가
        lastInput.fruits[fruit] = (lastInput.fruits[fruit] || 0) + 1;
        lastInput.total += 1;
    } else {
        // 새로운 operand 생성
        inputs.push({
            type: 'operand',
            fruits: { [fruit]: 1 },
            total: 1
        });
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
    if (operator === '(') {
        // '('는 새로운 operator로 추가
        // '('는 operand 이전이나 operator 이전에 올 수 있음
        // 하지만, 연산자 뒤에 '('가 올 수 있음
        inputs.push({ type: 'operator', value: operator });
        updateDisplay();
        return;
    }

    if (operator === ')') {
        // ')'를 추가할 때는 열린 괄호 '('가 있어야 하고, ')' 앞에 operand가 있어야 함
        const openParens = inputs.filter(input => input.type === 'operator' && input.value === '(').length;
        const closeParens = inputs.filter(input => input.type === 'operator' && input.value === ')').length;
        if (closeParens >= openParens) {
            alert("닫는 괄호 ')'의 수가 부족합니다.");
            return;
        }
        const lastInput = inputs[inputs.length - 1];
        if (!lastInput || lastInput.type !== 'operand') {
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
    if (operator !== '(' && operator !== ')' && (!lastInput || lastInput.type !== 'operand')) {
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

    if (lastInput.type === 'operand') {
        // Operand에서 마지막 과일을 제거
        const fruits = lastInput.fruits;
        const fruitKeys = Object.keys(fruits);
        if (fruitKeys.length === 0) return;

        const lastFruit = fruitKeys[fruitKeys.length - 1];
        if (fruits[lastFruit] > 1) {
            fruits[lastFruit] -= 1;
            lastInput.total -= 1;
            inputs.push(lastInput); // 다시 추가
        } else {
            delete fruits[lastFruit];
            lastInput.total -= 1;
            if (lastInput.total > 0) {
                inputs.push(lastInput); // 다시 추가
            }
        }

        // 전체 과일 카운트 감소
        fruitCounts[lastFruit] -= 1;
        const countElement = document.getElementById(`count-${lastFruit}`);
        if (countElement) {
            countElement.textContent = fruitCounts[lastFruit];
        }
    } else if (lastInput.type === 'operator') {
        // 연산자 제거 시 특별한 처리 없음
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
        if (input.type === 'operand') {
            // 각 과일과 개수를 아이콘과 함께 표시
            for (const [fruit, count] of Object.entries(input.fruits)) {
                const fruitDiv = document.createElement('div');
                fruitDiv.classList.add('fruit-result');

                const fruitImg = document.createElement('img');
                fruitImg.src = fruitsData[fruit].img;
                fruitImg.alt = fruitsData[fruit].name;
                fruitImg.title = `${fruitsData[fruit].name} ${count}개`;
                fruitImg.classList.add('display-fruit-img');

                const fruitText = document.createElement('span');
                fruitText.textContent = `${count}개`;

                fruitDiv.appendChild(fruitImg);
                fruitDiv.appendChild(fruitText);

                displayArea.appendChild(fruitDiv);
            }
        } else if (input.type === 'operator') {
            const operatorSpan = document.createElement('span');
            operatorSpan.textContent = ` ${getOperatorSymbol(input.value)} `;
            operatorSpan.classList.add('operator-symbol');
            displayArea.appendChild(operatorSpan);
        }
    });
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
        if (input.type === 'operand') {
            expression += input.total;
        } else if (input.type === 'operator') {
            expression += input.value;
        }
    });

    try {
        // 안전한 계산을 위해 Function을 사용
        const total = Function('"use strict";return (' + expression + ')')();

        // Build formatted expression with fruits and counts
        let formattedExpression = '';
        inputs.forEach(input => {
            if (input.type === 'operand') {
                const fruits = Object.entries(input.fruits).map(([fruit, count]) => {
                    return `<img src="${fruitsData[fruit].img}" alt="${fruitsData[fruit].name}" title="${fruitsData[fruit].name} ${count}개" class="result-fruit-img"> ${count}개`;
                }).join(' + ');
                formattedExpression += `${fruits.length > 1 ? '(' : ''}${fruits}${fruits.length > 1 ? ')' : ''}`;
            } else if (input.type === 'operator') {
                formattedExpression += ` ${getOperatorSymbol(input.value)} `;
            }
        });

        // Replace multiple spaces and fix operator spacing
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
