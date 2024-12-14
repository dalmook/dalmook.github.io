// wordtopscript.js

let data;
let currentLanguage = 'korean';
let words = [];
let currentWordIndex = 0;
let stack = [];
let gaugePosition = 0; // -1 (left), 0 (center), 1 (right)
let isGameOver = false;
let gaugeInterval;
let gaugeSpeed = 50; // 초기 게이지 업데이트 속도 (밀리초)
const speedIncreaseFactor = 0.9; // 높이에 따라 속도를 증가시키는 비율

// DOM Elements
const languageSelection = document.getElementById('language-selection');
const gameContainer = document.getElementById('game-container');
const gauge = document.getElementById('gauge');
const indicator = document.getElementById('indicator');
const stackContainer = document.getElementById('stack-container');

// Load JSON data
fetch('wordtopdata.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(json => {
        data = json;
    })
    .catch(error => console.error('Error loading JSON:', error));

// Language selection handlers
function selectLanguage(lang) {
    currentLanguage = lang;
    words = data[lang];
    startGame();
}

// Start the game
function startGame() {
    languageSelection.style.display = 'none';
    gameContainer.style.display = 'block';
    document.addEventListener('click', handleStacking);
    animateGauge();
}

// Gauge animation with speed based on stack height
function animateGauge() {
    let direction = 1; // 1 for right, -1 for left
    let position = 0;
    const maxPosition = 1;
    const minPosition = -1;

    gaugeInterval = setInterval(() => {
        // Update gauge position
        gaugePosition += direction * 0.05;

        if (gaugePosition >= maxPosition) {
            gaugePosition = maxPosition;
            direction = -1;
        } else if (gaugePosition <= minPosition) {
            gaugePosition = minPosition;
            direction = 1;
        }

        // Update indicator position
        const gaugeWidth = gauge.clientWidth;
        const indicatorWidth = indicator.clientWidth;
        const maxOffset = gaugeWidth - indicatorWidth;
        const currentOffset = ((gaugePosition - minPosition) / (maxPosition - minPosition)) * maxOffset;
        indicator.style.left = `${currentOffset}px`;

        // Adjust speed based on stack height
        if (stack.length > 0) {
            let newSpeed = gaugeSpeed / Math.pow(speedIncreaseFactor, stack.length);
            newSpeed = Math.max(newSpeed, 10); // 최소 속도 제한
            if (newSpeed !== gaugeSpeed) {
                gaugeSpeed = newSpeed;
                clearInterval(gaugeInterval);
                animateGauge(); // 재귀적으로 호출하여 속도 변경 적용
            }
        }
    }, gaugeSpeed);
}

// Handle stacking on click
function handleStacking() {
    if (isGameOver) return;

    const word = words[currentWordIndex];
    const wordElement = document.createElement('div');
    wordElement.classList.add('stack-word');

    // 층수 표시
    const layerNumber = document.createElement('div');
    layerNumber.classList.add('layer-number');
    layerNumber.textContent = `층 ${stack.length + 1}`;
    wordElement.appendChild(layerNumber);

    wordElement.appendChild(document.createTextNode(word));

    // Position based on gaugePosition
    let offsetX = 0;
    if (gaugePosition < -0.3) { // 왼쪽
        offsetX = -50;
    } else if (gaugePosition > 0.3) { // 오른쪽
        offsetX = 50;
    } else { // 중앙
        offsetX = 0;
    }

    wordElement.style.transform = `translateX(${offsetX}%) translateY(-${stack.length * 40}px)`;

    stackContainer.appendChild(wordElement);
    stack.push({ element: wordElement, offset: offsetX });

    checkStability();

    currentWordIndex++;
    if (currentWordIndex >= words.length) {
        currentWordIndex = 0; // Reset or handle as needed
    }
}

// Check stack stability
function checkStability() {
    // 기준을 중앙으로 설정, 오프셋이 클수록 불안정
    const threshold = 50 - stack.length * 3; // 높이에 따라 임계값 감소
    for (let i = 0; i < stack.length; i++) {
        const block = stack[i];
        if (Math.abs(block.offset) > threshold) { // Threshold for instability
            triggerUnstableEffect();
            break;
        }
    }
}

// Trigger unstable effects
function triggerUnstableEffect() {
    if (isGameOver) return;

    isGameOver = true;
    clearInterval(gaugeInterval);

    // 전체 스택에 흔들림 효과 추가
    stack.forEach(block => {
        block.element.classList.add('shake');
    });

    // 무너지는 효과를 1초 후에 실행
    setTimeout(() => {
        stack.forEach(block => {
            block.element.classList.add('collapse');
        });
        // 게임 오버 메시지를 2초 후에 표시
        setTimeout(() => {
            alert('게임 오버! 다시 시작하려면 새로고침하세요.');
        }, 1000);
    }, 1000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize language selection buttons
    languageSelection.innerHTML = `
        <h1>언어 선택 / Select Language</h1>
        <button data-lang="korean">한국어</button>
        <button data-lang="english">English</button>
    `;

    // Attach event listeners after buttons are added
    languageSelection.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => {
            selectLanguage(button.dataset.lang);
        });
    });
});
