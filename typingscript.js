// typingscript.js

document.addEventListener("DOMContentLoaded", () => {
    const wordContainer = document.getElementById("word-container");
    const wordInput = document.getElementById("word-input");
    const scoreElement = document.getElementById("score");
    let score = 0;
    let words = [];
    let wordList = [];
    let gameInterval;
    const wordSpeed = 2000; // 단어가 떨어지는 속도 (밀리초)

    // 단어 데이터 로드
    fetch('typingdata.json')
        .then(response => response.json())
        .then(data => {
            wordList = data;
            startGame();
        })
        .catch(error => console.error('단어 데이터를 로드하는 중 오류 발생:', error));

    function startGame() {
        gameInterval = setInterval(addWord, wordSpeed);
    }

    function addWord() {
        const wordText = wordList[Math.floor(Math.random() * wordList.length)];
        const wordElement = document.createElement("div");
        wordElement.classList.add("falling-word");
        wordElement.textContent = wordText;

        // 랜덤한 위치 설정
        const wordWidth = 100; // 단어의 가정된 폭
        const maxLeft = window.innerWidth - wordWidth;
        const left = Math.floor(Math.random() * maxLeft);
        wordElement.style.left = `${left}px`;
        wordElement.style.animationDuration = `${getRandomSpeed()}s`;

        wordContainer.appendChild(wordElement);

        // 단어가 화면을 벗어났을 때 제거 및 점수 감소
        wordElement.addEventListener("animationend", () => {
            wordContainer.removeChild(wordElement);
            // 선택적으로, 놓친 단어에 대한 처리를 추가할 수 있습니다.
            // 예: score -= 1;
            // updateScore();
        });
    }

    function getRandomSpeed() {
        return Math.random() * 3 + 2; // 2초에서 5초 사이
    }

    wordInput.addEventListener("input", () => {
        const inputValue = wordInput.value.trim();
        if (inputValue === "") return;

        const matchedWord = Array.from(wordContainer.children).find(word => word.textContent === inputValue);
        if (matchedWord) {
            score += 10;
            updateScore();
            wordContainer.removeChild(matchedWord);
            wordInput.value = "";
        }
    });

    function updateScore() {
        scoreElement.textContent = score.toString();
    }

    // 게임 종료 로직을 추가할 수 있습니다.
});
