// typingscript.js

document.addEventListener("DOMContentLoaded", () => {
    const startScreen = document.getElementById("start-screen");
    const gameScreen = document.getElementById("game-screen");
    const difficultyButtons = document.querySelectorAll(".difficulty-button");
    const startButton = document.getElementById("start-button");
    const wordContainer = document.getElementById("word-container");
    const wordInput = document.getElementById("word-input");
    const scoreElement = document.getElementById("score");
    const levelElement = document.getElementById("level");
    const livesElement = document.getElementById("lives");
    const successSound = document.getElementById("success-sound");

    let selectedDifficulty = null;
    let score = 0;
    let level = 1;
    let lives = 3;
    let wordList = [];
    let gameInterval;
    let levelInterval;
    let speedIncreaseInterval;
    const initialWordSpeed = 5000; // 초기 단어 생성 간격 (밀리초)
    let currentWordSpeed = initialWordSpeed;

    // 단어 데이터 로드
    fetch('typingdata.json')
        .then(response => response.json())
        .then(data => {
            wordList = data;
        })
        .catch(error => console.error('단어 데이터를 로드하는 중 오류 발생:', error));

    // 난이도 선택
    difficultyButtons.forEach(button => {
        button.addEventListener("click", () => {
            // 모든 버튼의 선택 상태 제거
            difficultyButtons.forEach(btn => btn.classList.remove("selected"));
            // 클릭한 버튼만 선택 상태 추가
            button.classList.add("selected");
            selectedDifficulty = button.dataset.difficulty;
            // 게임 시작 버튼 활성화
            startButton.disabled = false;
        });
    });

    // 게임 시작 버튼 클릭
    startButton.addEventListener("click", () => {
        if (!selectedDifficulty) return;
        // 시작 화면 숨기기
        startScreen.classList.remove("active");
        startScreen.classList.add("hidden");
        // 게임 화면 보이기
        gameScreen.style.display = "block";
        // 게임 초기화
        initializeGame();
    });

    function initializeGame() {
        score = 0;
        level = 1;
        lives = 5;
        currentWordSpeed = initialWordSpeed;
        updateScore();
        updateLevel();
        updateLives();
        wordInput.value = "";
        wordInput.focus();

        // 단어 생성 간격 설정
        gameInterval = setInterval(addWord, currentWordSpeed);
        // 레벨 증가 간격 설정 (예: 30초마다 레벨 증가)
        levelInterval = setInterval(increaseLevel, 30000);
        // 속도 증가 간격 설정 (예: 10초마다 속도 10% 증가)
        speedIncreaseInterval = setInterval(increaseSpeed, 10000);
    }

    function addWord() {
        if (lives <= 0) return; // 게임 종료 시 단어 추가 중단

        // 난이도에 따른 필터링
        const filteredList = wordList.filter(wordObj => {
            if (selectedDifficulty === "easy") {
                return wordObj.difficulty === "easy";
            } else if (selectedDifficulty === "medium") {
                return wordObj.difficulty === "easy" || wordObj.difficulty === "medium";
            } else if (selectedDifficulty === "hard") {
                return wordObj.difficulty === "medium" || wordObj.difficulty === "hard";
            }
            return true;
        });

        if (filteredList.length === 0) return; // 필터링된 단어가 없을 경우 추가하지 않음

        const randomIndex = Math.floor(Math.random() * filteredList.length);
        const wordObj = filteredList[randomIndex];
        const type = wordObj.type;

        let displayText, correctAnswer;

        if (type === "word") {
            displayText = wordObj.word;
            correctAnswer = wordObj.word.toLowerCase();
        } else if (type === "math") {
            displayText = wordObj.question;
            correctAnswer = wordObj.answer.toLowerCase();
        } else {
            // 타입이 지정되지 않은 경우 기본 단어 사용
            displayText = wordObj.word;
            correctAnswer = wordObj.word.toLowerCase();
        }

        const wordElement = document.createElement("div");
        wordElement.classList.add("falling-word");
        wordElement.textContent = displayText;
        wordElement.dataset.correctAnswer = correctAnswer;

        // 난이도에 따른 점수 설정
        let wordScore = 10; // 기본 점수
        if (wordObj.difficulty === "medium") {
            wordScore = 20;
        } else if (wordObj.difficulty === "hard") {
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
        return Math.random() * 7 + 11; // 4초에서 7초 사이
    }

    function increaseLevel() {
        level += 1;
        updateLevel();
        // 레벨이 올라갈 때마다 추가적인 난이도 조정 가능
    }

    function increaseSpeed() {
        currentWordSpeed = Math.max(currentWordSpeed - 500, 1000); // 최소 단어 생성 간격 1초
        clearInterval(gameInterval);
        gameInterval = setInterval(addWord, currentWordSpeed);

        // 현재 단어들의 애니메이션 속도 증가
        Array.from(wordContainer.children).forEach(word => {
            const newDuration = parseFloat(word.style.animationDuration) * 0.9; // 10% 빠르게
            word.style.animationDuration = `${newDuration}s`;
        });
    }

    function endGame() {
        clearInterval(gameInterval);
        clearInterval(levelInterval);
        clearInterval(speedIncreaseInterval);
        alert(`게임 종료! 최종 점수: ${score}`);
        // 페이지 새로 고침 또는 재시작 로직 추가 가능
        window.location.reload();
    }

    // 'input' 이벤트로 변경하여 입력할 때마다 단어(문제) 확인
    wordInput.addEventListener("input", () => {
        const inputValue = wordInput.value.trim().toLowerCase();
        if (inputValue === "") return;

        // 맞춘 단어(문제) 찾기
        const matchedWord = Array.from(wordContainer.children).find(word => word.dataset.correctAnswer === inputValue);

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

            // 입력창 초기화 강화
            wordInput.value = "";
            wordInput.addEventListener('keydown', (event) => {
                if (event.key === 'Backspace') {
                    // backspace 동작을 추가합니다.
                }
            });
        }
    });

    function updateScore() {
        scoreElement.textContent = score.toString();
    }

    function updateLevel() {
        levelElement.textContent = level.toString();
    }

    function updateLives() {
        livesElement.textContent = lives.toString();
    }

    // 모바일에서 가상 키보드가 나타날 때 입력창에 포커스 유지
    window.addEventListener('resize', () => {
        wordInput.focus();
    });
});
