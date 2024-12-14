// wordtopscript.js

let data;
let currentLanguage = 'korean';
let words = [];
let currentWordIndex = 0;
let stack = [];
let gaugePosition = 0; // -1 (left), 0 (center), 1 (right)
let isGameOver = false;

// DOM Elements
const languageSelection = document.getElementById('language-selection');
const gameContainer = document.getElementById('game-container');
const gauge = document.getElementById('gauge');
const indicator = document.getElementById('indicator');
const stackContainer = document.getElementById('stack-container');

// Load JSON data
fetch('wordtopdata.json')
    .then(response => response.json())
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

languageSelection.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
        selectLanguage(button.dataset.lang);
    });
});

// Start the game
function startGame() {
    languageSelection.style.display = 'none';
    gameContainer.style.display = 'block';
    document.addEventListener('click', handleStacking);
    animateGauge();
}

// Gauge animation
function animateGauge() {
    setInterval(() => {
        gaugePosition = gaugePosition === -1 ? 1 : gaugePosition === 1 ? 0 : -1;
    }, 1000);
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
    if (gaugePosition === -1) {
        offsetX = -50;
    } else if (gaugePosition === 1) {
        offsetX = 50;
    }

    wordElement.style.transform = `translateX(${ -50 + offsetX }%) translateY(-${stack.length * 30}px)`;

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
});
