// wordtopscript.js

let data;
let currentLanguage = 'korean';
let words = [];
let currentWordIndex = 0;
let stack = [];
let gaugePosition = 0; // -1 (left), 0 (center), 1 (right)
let isGameOver = false;
let gaugeInterval;

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

// Gauge animation
function animateGauge() {
    let direction = 1; // 1 for right, -1 for left
    let position = 0;
    const maxPosition = 1;
    const minPosition = -1;

    gaugeInterval = setInterval(() => {
        gaugePosition += direction * 0.1;

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
    }, 50);
}

// Handle stacking on click
function handleStacking() {
    if (isGameOver) return;

    const word = words[currentWordIndex];
    const wordElement = document.createElement('div');
    wordElement.classList.add('stack-word');
    wordElement.textContent = word;

    // Position based on gaugePosition
    let offsetX = 0;
    if (gaugePosition < -0.5) {
        offsetX = -50;
    } else if (gaugePosition > 0.5) {
        offsetX = 50;
    }

    wordElement.style.transform = `translateX(${offsetX}%) translateY(-${stack.length * 30}px)`;

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
    for (let i = 0; i < stack.length; i++) {
        const block = stack[i];
        if (Math.abs(block.offset) > 30) { // Threshold for instability
            gameOver();
            break;
        }
    }
}

// Game Over
function gameOver() {
    isGameOver = true;
    clearInterval(gaugeInterval);
    alert('게임 오버! 다시 시작하려면 새로고침하세요.');
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
