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

// 계산 로직 변수
let operand1 = 0;
let operand2 = 0;
let currentOperator = null;

// 입력 기록을 저장하는 배열 (for display)
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
    if (!currentOperator) {
        // No operator yet, accumulate into operand1
        operand1 += 1;
        inputs.push({ type: 'fruit', name: fruit });
    } else {
        // Operator set, accumulate into operand2
        operand2 += 1;
        inputs.push({ type: 'fruit', name: fruit });
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
    if (operator === '=') {
        if (currentOperator && operand2 !== 0) {
            const result = calculate(operand1, currentOperator, operand2);
            displayResult(result);
            // 계산이 완료된 후 초기화
            resetCalculator();
        } else {
            alert("올바른 계산을 위해 과일을 선택하고 연산자를 입력하세요.");
        }
    } else if (operator === 'backspace') {
        handleBackspace();
    } else {
        if (currentOperator) {
            // 이미 operator is set, prevent setting another operator
            alert("이미 연산자가 설정되었습니다.");
            return;
        }
        if (operand1 === 0) {
            // No operand1 yet, prevent setting operator
            alert("먼저 과일을 선택해주세요.");
            return;
        }
        currentOperator = operator;
        inputs.push({ type: 'operator', value: operator });
        updateDisplay();
    }
}

// 백스페이스 처리 함수
function handleBackspace() {
    if (inputs.length === 0) return;

    const lastInput = inputs.pop();

    if (lastInput.type === 'fruit') {
        const fruitName = lastInput.name;
        if (!currentOperator) {
            // Removing from operand1
            if (operand1 > 0) operand1 -= 1;
        } else {
            // Removing from operand2
            if (operand2 > 0) operand2 -= 1;
        }
        if (fruitCounts[fruitName] > 0) {
            fruitCounts[fruitName] -= 1;
            updateFruitCountDisplay(fruitName);
        }
    } else if (lastInput.type === 'operator') {
        // Removing the operator
        currentOperator = null;
    }

    updateDisplay();
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
            fruitImg.title = fruitsData[input.name].name;
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

// 결과 표시 함수
function displayResult(result) {
    // Clear previous result
    resultArea.innerHTML = '';

    // Create text node for "결과: X개 ("
    const resultText = document.createElement('span');
    resultText.textContent = `결과: ${result}개 (`;
    resultArea.appendChild(resultText);

    // Split inputs into operand1 and operand2
    let operand1Fruits = {};
    let operand2Fruits = {};
    let operatorSymbol = '';

    let currentOperand = 'operand1';

    inputs.forEach(input => {
        if (input.type === 'operator') {
            operatorSymbol = getOperatorSymbol(input.value);
            currentOperand = 'operand2';
        } else if (input.type === 'fruit') {
            if (currentOperand === 'operand1') {
                operand1Fruits[input.name] = (operand1Fruits[input.name] || 0) + 1;
            } else if (currentOperand === 'operand2') {
                operand2Fruits[input.name] = (operand2Fruits[input.name] || 0) + 1;
            }
        }
    });

    // Function to append fruits to resultArea
    function appendFruits(fruitObj) {
        Object.entries(fruitObj).forEach(([fruit, count], index, array) => {
            // Create image element
            const img = document.createElement('img');
            img.src = fruitsData[fruit].img;
            img.alt = fruitsData[fruit].name;
            img.title = fruitsData[fruit].name;
            img.classList.add('result-fruit-img');

            // Create span for count
            const countSpan = document.createElement('span');
            countSpan.textContent = `${count}개`;

            // Create container for image and count
            const fruitContainer = document.createElement('span');
            fruitContainer.classList.add('fruit-result');
            fruitContainer.appendChild(img);
            fruitContainer.appendChild(countSpan);

            resultArea.appendChild(fruitContainer);

            // Add '+' or operator if not the last fruit
            if (index < array.length - 1) {
                const plus = document.createTextNode(' + ');
                resultArea.appendChild(plus);
            }
        });
    }

    // Append operand1 fruits
    appendFruits(operand1Fruits);

    // Append operator symbol
    const operatorSpan = document.createElement('span');
    operatorSpan.textContent = ` ${operatorSymbol} `;
    operatorSpan.classList.add('operator-symbol');
    resultArea.appendChild(operatorSpan);

    // Append operand2 fruits
    appendFruits(operand2Fruits);

    // Closing parenthesis
    const closingParen = document.createElement('span');
    closingParen.textContent = ')';
    resultArea.appendChild(closingParen);
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

// 과일 카운트 업데이트 디스플레이 함수
function updateFruitCountDisplay(fruit) {
    const countElement = document.getElementById(`count-${fruit}`);
    if (countElement) {
        countElement.textContent = fruitCounts[fruit];
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
    operand1 = 0;
    operand2 = 0;
    currentOperator = null;
    inputs = [];
    updateDisplay();
}
