// typingscript.js

document.addEventListener("DOMContentLoaded", () => {
    const wordContainer = document.getElementById("word-container");
    const wordInput = document.getElementById("word-input");
    const scoreElement = document.getElementById("score");
    const levelElement = document.getElementById("level");
    const livesElement = document.getElementById("lives");
    const wpmElement = document.getElementById("wpm");
    const successSound = document.getElementById("success-sound");
    let score = 0;
    let level = 1;
    let lives = 3;
    let wordList = [];
    let gameInterval;
    let levelInterval;
    const initialWordSpeed = 5000; // 초기 단어 생성 간격 (밀리초)
    let currentWordSpeed = initialWordSpeed;

    // 타이핑 속도 추적 변수
    let startTime;
    let correctWords = 0;

    // 단어 데이터 로드
    fetch('typingdata.json')
        .then(response => response.json())
        .then(data => {
            wordList = data;
            startGame();
        })
        .catch(error => console.error('단어 데이터를 로드하는 중 오류 발생:', error));

    function startGame() {
        startTime = new Date(); // 게임 시작 시간 기록
        gameInterval = setInterval(addWord, currentWordSpeed);
        levelInterval = setInterval(increaseLevel, 30000); // 30초마다 레벨 증가
        updateWPM(); // WPM 초기화
    }

    function addWord() {
        if (lives <= 0) return; // 게임 종료 시 단어 추가 중단

        const randomIndex = Math.floor(Math.random() * wordList.length);
        const wordObj = wordList[randomIndex];
        const wordText = wordObj.word;
        const difficulty = wordObj.difficulty;

        const wordElement = document.createElement("div");
        wordElement.classList.add("falling-word");
        wordElement.textContent = wordText;
        wordElement.dataset.difficulty = difficulty;

        // 난이도에 따른 점수 설정
        let wordScore = 10; // 기본 점수
        if (difficulty === "medium") {
            wordScore = 20;
        } else if (difficulty === "hard") {
            wordScore = 30;
        }
        wordElement.dataset.score = wordScore;

        // 랜덤한 위치 설정
        const wordWidth = 100; // 단어의 가정된 폭
        const maxLeft = window.innerWidth - wordWidth - 20; // 여백 고려
        const left = Math.floor(Math.random() * maxLeft) + 10; // 최소 10px 여백
        wordElement.style.left = `${left}px`;
        wordElement.style.animationDuration = `${getRandomSpeed()}s`;

        wordContainer.appendChild(wordElement);

        // 단어가 화면을 벗어났을 때 제거 및 생명 감소
        wordElement.addEventListener("animationend", () => {
            if (wordContainer.contains(wordElement)) {
                wordContainer.removeChild(wordElement);
                lives -= 1;
                updateLives();
                if (lives <= 0) {
                    endGame();
                }
            }
        });
    }

    function getRandomSpeed() {
        return Math.random() * 3 + 4; // 4초에서 7초 사이
    }

    function increaseLevel() {
        level += 1;
        levelElement.textContent = level.toString();

        // 단어 생성 간격을 줄이고, 단어 떨어지는 속도를 증가
        currentWordSpeed = Math.max(initialWordSpeed - level * 500, 1000); // 최소 1초
        clearInterval(gameInterval);
        gameInterval = setInterval(addWord, currentWordSpeed);

        // 모든 현재 단어의 애니메이션 속도 증가
        Array.from(wordContainer.children).forEach(word => {
            const newDuration = parseFloat(word.style.animationDuration) * 0.9; // 10% 빠르게
            word.style.animationDuration = `${newDuration}s`;
        });
    }

    function endGame() {
        clearInterval(gameInterval);
        clearInterval(levelInterval);
        alert(`게임 종료! 최종 점수: ${score}`);
        // 페이지 새로 고침 또는 재시작 로직 추가 가능
        window.location.reload();
    }

    // 'input' 이벤트로 변경하여 입력할 때마다 단어 확인
    wordInput.addEventListener("input", () => {
        const inputValue = wordInput.value.trim().toLowerCase();
        if (inputValue === "") return;

        const matchedWord = Array.from(wordContainer.children).find(word => word.textContent.toLowerCase() === inputValue);
        if (matchedWord) {
            const wordScore = parseInt(matchedWord.dataset.score) || 10;
            score += wordScore;
            updateScore();
            matchedWord.classList.add("matched"); // 시각 효과 추가
            successSound.currentTime = 0;
            successSound.play(); // 효과음 재생

            // 단어 제거 후 애니메이션 효과 제거
            setTimeout(() => {
                if (wordContainer.contains(matchedWord)) {
                    wordContainer.removeChild(matchedWord);
                }
            }, 500); // 애니메이션 효과 시간과 일치시킴

            wordInput.value = "";
            wordInput.focus(); // 입력창에 포커스 유지

            // 타이핑 속도 추적: 맞춘 단어 수 증가
            correctWords += 1;
        }
    });

    function updateScore() {
        scoreElement.textContent = score.toString();
    }

    function updateLives() {
        livesElement.textContent = lives.toString();
    }

    // 타이핑 속도(WPM) 업데이트 함수
    function updateWPM() {
        const now = new Date();
        const timeElapsed = (now - startTime) / 1000 / 60; // 분 단위로 변환
        const wpm = Math.round(correctWords / timeElapsed) || 0;
        wpmElement.textContent = wpm.toString();
        // 매 5초마다 업데이트
        setTimeout(updateWPM, 5000);
    }

    // 모바일에서 가상 키보드가 나타날 때 입력창에 포커스 유지
    window.addEventListener('resize', () => {
        wordInput.focus();
    });
});
