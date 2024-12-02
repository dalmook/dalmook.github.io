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
        // 연산자는 '+', '-', '*', '/', '(', ')' 만 허용
        if (!['+', '-', '*', '/', '(', ')'].includes(operator)) {
            return;
        }
        // 연산자가 연속해서 입력되는 것을 방지
        if (inputs.length === 0 && operator !== '(') {
            alert("연산자는 과일 다음에만 입력할 수 있습니다.");
            return;
        }
        const lastInput = inputs[inputs.length - 1];
        if (lastInput && lastInput.type === 'operator') {
            // 두 개의 연산자가 연속되면 마지막 연산자를 교체
            inputs.pop();
        } else if (operator === ')') {
            // ')'를 추가할 때는 '('가 있어야 함
            const openParens = inputs.filter(input => input.type === 'operator' && input.value === '(').length;
            const closeParens = inputs.filter(input => input.type === 'operator' && input.value === ')').length;
            if (closeParens >= openParens) {
                alert("닫는 괄호 ')'의 수가 부족합니다.");
                return;
            }
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
        if (lastInput.value === ')') {
            // 닫는 괄호를 제거할 때 열린 괄호가 충분한지 확인
            const openParens = inputs.filter(input => input.type === 'operator' && input.value === '(').length;
            const closeParens = inputs.filter(input => input.type === 'operator' && input.value === ')').length;
            if (closeParens < openParens) {
                alert("닫는 괄호 ')'의 수가 부족합니다.");
            }
        }
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

    // 입력을 문자열로 변환
    let expression = '';
    inputs.forEach(input => {
        if (input.type === 'fruit') {
            expression += fruitCounts[input.value];
        } else if (input.type === 'operator') {
            expression += input.value;
        }
    });

    // 괄호가 제대로 닫혔는지 확인
    const openParens = inputs.filter(input => input.type === 'operator' && input.value === '(').length;
    const closeParens = inputs.filter(input => input.type === 'operator' && input.value === ')').length;
    if (openParens !== closeParens) {
        alert("괄호의 개수가 맞지 않습니다.");
        return;
    }

    try {
        // 안전한 계산을 위해 eval 대신 Function을 사용
        // 사용자가 입력한 내용이 숫자와 연산자만 포함되어 있으므로 안전하게 사용할 수 있습니다.
        const total = Function('"use strict";return (' + expression + ')')();

        // 결과 표시 형식: 결과: 6개 [오렌지 2개 + 감 2개 * 포도 2개]
        // 연산자 우선순위에 따라 괄호를 사용하지 않고 그대로 표시
        let formattedExpression = '';
        let tempExpression = '';
        let parenCount = 0;

        inputs.forEach((input, index) => {
            if (input.type === 'fruit') {
                tempExpression += `${fruitsData[input.value].name} ${fruitCounts[input.value]}개`;
            } else if (input.type === 'operator') {
                if (input.value === '(') {
                    parenCount++;
                    tempExpression += `(${input.value} `;
                } else if (input.value === ')') {
                    parenCount--;
                    tempExpression += `) `;
                } else {
                    // '+'는 그대로, 다른 연산자는 ','로 대체
                    if (input.value === '+') {
                        tempExpression += `+ `;
                    } else {
                        tempExpression += `, `;
                    }
                }
            }
        });

        // Remove trailing space or comma
        formattedExpression = tempExpression.trim().replace(/,\s*$/, '');

        // 결과 영역에 표시
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
