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
    // 과일 카운트 증가는 이미 updateFruitCount에서 처리됨
    const fruitCount = 1; // 각 클릭 시 1개 추가

    const lastInput = inputs[inputs.length - 1];
    if (lastInput && lastInput.type === 'operand') {
        // 이미 operand가 있다면 합산
        lastInput.value += fruitCount;
        lastInput.fruits.push(fruit); // 어떤 과일이 추가되었는지 기록
    } else if (lastInput && lastInput.type === 'fruit') {
        // 같은 과일이 연속으로 클릭되었을 때는 합산
        if (lastInput.value === fruit) {
            lastInput.count += 1;
            inputs[inputs.length - 1].value += 1;
        } else {
            // 다른 과일이 클릭되었을 때는 자동으로 '+' 연산자 삽입
            inputs.push({ type: 'operator', value: '+' });
            inputs.push({ type: 'fruit', value: fruit, count: 1 });
        }
    } else {
        // 처음 과일 클릭 시 operand 추가
        inputs.push({ type: 'operand', value: fruitCount });
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
    if (operator === '(' || operator === ')') {
        // 괄호는 특별히 처리
        if (operator === '(') {
            // '('는 바로 추가
            inputs.push({ type: 'operator', value: operator });
            updateDisplay();
            return;
        }

        if (operator === ')') {
            // ')'를 추가할 때는 '('가 있어야 하고, ')' 앞에 operand가 있어야 함
            const openParens = inputs.filter(input => input.type === 'operator' && input.value === '(').length;
            const closeParens = inputs.filter(input => input.type === 'operator' && input.value === ')').length;
            if (closeParens >= openParens) {
                alert("닫는 괄호 ')'의 수가 부족합니다.");
                return;
            }
            const lastInput = inputs[inputs.length -1];
            if (!lastInput || lastInput.type !== 'operand') {
                alert("닫는 괄호 ')' 앞에는 과일이 와야 합니다.");
                return;
            }
        }
    }

    // 연산자가 연속해서 입력되는 것을 방지
    const lastInput = inputs[inputs.length -1];
    if (lastInput && lastInput.type === 'operator') {
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
        // Operand를 제거하면 해당 operand에 속한 과일 카운트 감소
        const fruitCount = lastInput.value;
        // 여기서는 정확한 과일을 추적하지 못하므로, 모든 과일 카운트를 감소시키기 어려움
        // 따라서, 'fruit' 타입의 마지막 입력을 찾아 카운트를 감소시킴
        for (let i = inputs.length -1; i >=0; i--) {
            if (inputs[i].type === 'fruit') {
                const fruit = inputs[i].value;
                if (fruitCounts[fruit] >0) {
                    fruitCounts[fruit] -=1;
                    const countElement = document.getElementById(`count-${fruit}`);
                    if (countElement) {
                        countElement.textContent = fruitCounts[fruit];
                    }
                }
                break;
            }
        }
    } else if (lastInput.type === 'operator') {
        // 연산자 제거 시 아무 작업 필요 없음
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
            // Display operand as sum of fruits
            const operandDiv = document.createElement('div');
            operandDiv.classList.add('operand');

            // Find all fruits contributing to this operand
            // Since we don't track which fruits are in which operand, we'll display as total
            // To improve, we need to track fruits per operand
            operandDiv.textContent = input.value;

            displayArea.appendChild(operandDiv);
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
            expression += input.value;
        } else if (input.type === 'operator') {
            expression += input.value;
        }
    });

    try {
        // 안전한 계산을 위해 Function을 사용
        const total = Function('"use strict";return (' + expression + ')')();

        // Build formatted expression with fruits and counts
        // Since we don't track which fruits are in which operand, we'll display counts based on fruitCounts
        let formattedExpression = '';
        let currentSum = 0;
        inputs.forEach(input => {
            if (input.type === 'operand') {
                currentSum = input.value;
                formattedExpression += `${currentSum}`;
            } else if (input.type === 'operator') {
                formattedExpression += ` ${getOperatorSymbol(input.value)} `;
            }
        });

        // Display the result with icons
        // For simplicity, display each fruit with its count and include the operators
        // Since we don't track which fruits are in which operand, display all fruits with their counts
        let fruitIcons = '';
        for (const fruit in fruitCounts) {
            if (fruitCounts[fruit] > 0) {
                fruitIcons += `<img src="${fruitsData[fruit].img}" alt="${fruitsData[fruit].name}" title="${fruitsData[fruit].name} ${fruitCounts[fruit]}개" class="result-fruit-img"> ${fruitCounts[fruit]}개 + `;
            }
        }
        // Remove trailing ' + '
        if (fruitIcons.endsWith(' + ')) {
            fruitIcons = fruitIcons.slice(0, -3);
        }

        // 결과 표시 형식: 결과: 6개 [수박 3개 + 감 3개]
        resultArea.innerHTML = `결과: ${total}개 [${fruitIcons}]`;

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
