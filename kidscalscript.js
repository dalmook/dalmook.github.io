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
    } else {
        button.addEventListener('click', () => {
            handleOperator(operator);
        });
    }
});

// 과일 추가 함수
function addFruit(fruit) {
    inputs.push({ type: 'fruit', value: fruit });
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
        calculateResult();
    } else {
        // 연산자는 '+' '-' '*' '/' 만 허용
        if (!['+', '-', '*', '/'].includes(operator)) {
            return;
        }
        // 연산자가 연속해서 입력되는 것을 방지
        if (inputs.length === 0 || inputs[inputs.length - 1].type === 'operator') {
            alert("연산자는 과일 다음에만 입력할 수 있습니다.");
            return;
        }
        inputs.push({ type: 'operator', value: operator });
        updateDisplay();
    }
}

// 백스페이스 처리 함수
document.querySelector('.button.operator.backspace').addEventListener('click', () => {
    handleBackspace();
});

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

// 백스페이스 처리 함수
function handleBackspace() {
    if (inputs.length === 0) return;

    const lastInput = inputs.pop();

    if (lastInput.type === 'fruit') {
        const fruit = lastInput.value;
        if (fruitCounts[fruit] > 0) {
            fruitCounts[fruit] -= 1;
            updateFruitCountDisplay(fruit);
        }
    } else if (lastInput.type === 'operator') {
        // nothing extra to do
    }

    // 계산식 업데이트
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
            const fruitImg = document.createElement('img');
            fruitImg.src = fruitsData[input.value].img;
            fruitImg.alt = fruitsData[input.value].name;
            fruitImg.title = `${fruitsData[input.value].name} ${fruitCounts[input.value]}개`;
            fruitImg.classList.add('display-fruit-img');
            displayArea.appendChild(fruitImg);
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

    // Parse inputs into operands and operators
    let operands = [];
    let operators = [];

    let currentOperand = {};

    inputs.forEach(input => {
        if (input.type === 'fruit') {
            currentOperand[input.value] = (currentOperand[input.value] || 0) + 1;
        } else if (input.type === 'operator') {
            operands.push(currentOperand);
            operators.push(input.value);
            currentOperand = {};
        }
    });

    // Push the last operand
    if (Object.keys(currentOperand).length > 0) {
        operands.push(currentOperand);
    }

    // Check if operands and operators are valid
    if (operators.length !== operands.length - 1) {
        alert("올바른 계산을 위해 과일을 선택하고 연산자를 입력하세요.");
        return;
    }

    // Convert operands to total counts
    let operandValues = operands.map(operand => sumFruitCounts(operand));

    // Implement operator precedence: '*' and '/' before '+' and '-'

    let i = 0;
    while (i < operators.length) {
        if (operators[i] === '*' || operators[i] === '/') {
            let a = operandValues[i];
            let b = operandValues[i + 1];
            let res = 0;
            if (operators[i] === '*') {
                res = a * b;
            } else if (operators[i] === '/') {
                res = b !== 0 ? Math.floor(a / b) : 0;
            }
            operandValues.splice(i, 2, res);
            operators.splice(i, 1);
        } else {
            i++;
        }
    }

    // Now, handle '+' and '-'
    let total = operandValues[0];
    for (let j = 0; j < operators.length; j++) {
        if (operators[j] === '+') {
            total += operandValues[j + 1];
        } else if (operators[j] === '-') {
            total -= operandValues[j + 1];
        }
    }

    // Now, format the expression for display as per user:
    // Remove parentheses, use '+' only for '+' operators, and ',' otherwise.

    let expressionParts = [];
    for (let k = 0; k < operands.length; k++) {
        let operandStr = constructFruitString(operands[k]);
        if (k > 0) {
            let operator = operators[k - 1];
            if (operator === '+') {
                expressionParts.push(`+ ${operandStr}`);
            } else {
                expressionParts.push(`* ${operandStr}`); // For '*', '/' use the operator itself
            }
        } else {
            expressionParts.push(operandStr);
        }
    }

    let expressionStr = expressionParts.join(' ');

    // Display without parentheses
    resultArea.innerHTML = `결과: ${total}개 [${expressionStr}]`;

    // Reset inputs after calculation
    inputs = [];
    updateDisplay();
}

// 과일 개수 합산 함수
function sumFruitCounts(operandObj) {
    let sum = 0;
    for (const fruit in operandObj) {
        if (operandObj.hasOwnProperty(fruit)) {
            sum += operandObj[fruit];
        }
    }
    return sum;
}

// 과일 문자열 생성 함수
function constructFruitString(fruitObj) {
    return Object.entries(fruitObj).map(([fruit, count]) => {
        return `${fruitsData[fruit].name} ${count}개`;
    }).join(' + ');
}

// 연산자 기호 변환 함수
function getOperatorSymbol(operator) {
    switch(operator) {
        case '+':
            return '+';
        case '-':
            return '-';
        case '*':
            return '*';
        case '/':
            return '/';
        case 'backspace':
            return '←';
        case 'clear':
            return 'C';
        default:
            return '';
    }
}
