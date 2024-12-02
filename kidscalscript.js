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
let operandStack = []; // 연산자를 포함한 피연산자 스택
let operatorStack = []; // 연산자 스택

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
    // 현재 연산자가 없으면 operand1에 추가
    // 있으면 operand2에 추가
    const fruitName = fruitsData[fruit].name;
    if (operatorStack.length === 0) {
        // operand1에 추가
        if (!operandStack[0]) {
            operandStack[0] = {};
        }
        operandStack[0][fruit] = (operandStack[0][fruit] || 0) + 1;
    } else {
        // operand2에 추가
        if (!operandStack[operandStack.length - 1]) {
            operandStack[operandStack.length - 1] = {};
        }
        operandStack[operandStack.length - 1][fruit] = (operandStack[operandStack.length - 1][fruit] || 0) + 1;
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
        if (operandStack.length < 2 || operatorStack.length < 1) {
            alert("올바른 계산을 위해 과일을 선택하고 연산자를 입력하세요.");
            return;
        }
        calculateResult();
    } else {
        if (operandStack.length === 0 || (operandStack.length === 1 && Object.keys(operandStack[0]).length === 0)) {
            alert("먼저 과일을 선택해주세요.");
            return;
        }
        operatorStack.push(operator);
        operandStack.push({}); // 새로운 피연산자 추가
        updateDisplay();
    }
}

// 계산 함수
function calculateResult() {
    // 계산할 수 있는지 확인
    if (operandStack.length < 2 || operatorStack.length < 1) {
        alert("올바른 계산을 위해 과일을 선택하고 연산자를 입력하세요.");
        return;
    }

    // 두 번째 피연산자 객체를 가져옴
    const operand2Obj = operandStack.pop();
    const operator = operatorStack.pop();
    const operand1Obj = operandStack.pop();

    // operand1과 operand2의 총 개수를 계산
    const operand1Count = sumFruitCounts(operand1Obj);
    const operand2Count = sumFruitCounts(operand2Obj);

    // 연산 수행
    const result = performOperation(operand1Count, operator, operand2Count);

    // 결과를 operandStack에 다시 추가
    operandStack.push({ result: result });

    // 결과를 displayResult로 전달
    displayResult(result, operand1Obj, operator, operand2Obj);

    // 과일 카운트 초기화
    resetCalculator();
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

// 연산 수행 함수
function performOperation(a, operator, b) {
    switch (operator) {
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

// 결과 표시 함수
function displayResult(result, operand1Obj, operator, operand2Obj) {
    // 전체 카운트는 result
    let totalCount = result;

    // 과일별 피연산자 표현 생성
    const operand1Str = constructFruitString(operand1Obj);
    const operand2Str = constructFruitString(operand2Obj);

    // 결과 표시 형식: 결과: 00개 [(과일1 + 과일2) * 과일3]
    const equationStr = `(${operand1Str} ${getOperatorSymbol(operator)} ${operand2Str})`;

    // 결과 영역에 표시
    resultArea.innerHTML = `결과: ${totalCount}개 [${equationStr}]`;
}

// 과일 문자열 생성 함수
function constructFruitString(fruitObj) {
    return Object.entries(fruitObj).map(([fruit, count]) => {
        return `${fruitsData[fruit].name} ${count}개`;
    }).join(' + '); // 모든 과일을 더하기로 연결
}

// 연산자 기호 변환 함수
function getOperatorSymbol(operator) {
    switch (operator) {
        case '+':
            return '+';
        case '-':
            return '-';
        case '*':
            return '*';
        case '/':
            return '/';
        default:
            return '';
    }
}

// 디스플레이 업데이트 함수
function updateDisplay() {
    // 현재 계산식 표시
    displayArea.innerHTML = '';

    operandStack.forEach((operandObj, index) => {
        if (index > 0) {
            // 연산자 표시
            const operator = operatorStack[index - 1];
            const operatorSpan = document.createElement('span');
            operatorSpan.textContent = ` ${getOperatorSymbol(operator)} `;
            operatorSpan.classList.add('operator-symbol');
            displayArea.appendChild(operatorSpan);
        }

        // 피연산자 과일 표시
        Object.keys(operandObj).forEach(fruit => {
            const count = operandObj[fruit];
            const fruitImg = document.createElement('img');
            fruitImg.src = fruitsData[fruit].img;
            fruitImg.alt = fruitsData[fruit].name;
            fruitImg.title = `${fruitsData[fruit].name} ${count}개`;
            fruitImg.classList.add('display-fruit-img');
            displayArea.appendChild(fruitImg);
        });
    });

    // CSS에서 마지막 과일 이미지에만 테두리를 적용하도록 함
}

// 백스페이스 처리 함수
function handleBackspace() {
    if (operandStack.length === 0) return;

    const lastOperand = operandStack[operandStack.length - 1];
    const fruitKeys = Object.keys(lastOperand);
    if (fruitKeys.length === 0) {
        // 마지막이 연산자일 경우
        if (operatorStack.length > 0) {
            operatorStack.pop();
            operandStack.pop();
        }
    } else {
        // 마지막 과일을 하나 제거
        const lastFruit = fruitKeys[fruitKeys.length - 1];
        lastOperand[lastFruit] -= 1;
        if (lastOperand[lastFruit] === 0) {
            delete lastOperand[lastFruit];
        }
        fruitCounts[lastFruit] -= 1;
        updateFruitCountDisplay(lastFruit);
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
    operandStack = [];
    operatorStack = [];
    updateDisplay();
}

// 전체 초기화 함수 (지우기 버튼용)
function clearAll() {
    // 모든 과일 카운트 초기화
    resetCalculator();

    // 결과 영역 초기화
    resultArea.innerHTML = '';

    // 계산식 표시 영역 초기화
    displayArea.innerHTML = '';
}
