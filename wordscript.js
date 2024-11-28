/* wordscript.js */

// 전역 변수
let wordData = []; // JSON에서 불러올 데이터
let currentCardIndex = 0;
let score = 0;
let scoreDisplay = null;
let timer;
let timeLimit = 5; // 기본 시간 (난이도에 따라 변경)
let isPlaying = false;
let playInterval;
let gameWords = [];
let currentQuestion = {};
let usedIndices = [];
let currentMode = "word-to-meaning"; // 현재 게임 모드

// 초기 선택 화면 관련 요소
const selectionScreen = document.getElementById("selection-screen");
const selectFlashcardsBtn = document.getElementById("select-flashcards");
const selectWordgameBtn = document.getElementById("select-wordgame");

// 낱말 카드 섹션 관련 요소
const flashcardsSection = document.getElementById("flashcards");
const card = document.getElementById("card");
const cardFront = document.getElementById("card-front");
const cardBack = document.getElementById("card-back");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const backToSelectionBtn = document.getElementById("back-to-selection");

// 단어 게임 섹션 관련 요소
const wordGameSection = document.getElementById("word-game");
const backToSelectionGameBtn = document.getElementById("back-to-selection-game");
const startGameBtn = document.getElementById("startGameBtn");
const difficultySelect = document.getElementById("difficulty");
const gameModeSelect = document.getElementById("gameMode");
const gameArea = document.getElementById("game-area");
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const feedbackEl = document.getElementById("feedback");
const nextQuestionBtn = document.getElementById("nextQuestionBtn");

// 데이터 로드 함수
async function loadWordData() {
    try {
        const response = await fetch('word.json'); // word.json 파일 경로
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        wordData = await response.json();
        console.log("단어 데이터가 성공적으로 로드되었습니다.", wordData);
    } catch (error) {
        console.error("단어 데이터를 불러오는 데 실패했습니다:", error);
        alert("단어 데이터를 불러오는 데 실패했습니다. 나중에 다시 시도해주세요.");
    }
}

// 낱말 카드 초기화 함수
function loadCard(index) {
    if (wordData.length === 0) {
        console.error("wordData가 비어 있습니다.");
        return;
    }
    const data = wordData[index];
    cardFront.textContent = data.word;
    cardBack.textContent = data.meaning;
    flipCard(false);
}

// 카드 플립 함수
function flipCard(flip) {
    if (flip) {
        card.classList.add("flipped");
    } else {
        card.classList.remove("flipped");
    }
}

// 점수 업데이트 함수
function updateScore(points) {
    score += points;
    if (scoreDisplay) {
        scoreDisplay.textContent = `점수: ${score}`;
    }
}

// 타이머 시작 함수
function startTimer(seconds, onTimeout) {
    clearInterval(timer); // 기존 타이머 초기화
    let timeRemaining = seconds;

    // 타이머 표시 업데이트
    const timerElement = document.getElementById("timer");
    if (timerElement) {
        timerElement.remove(); // 이전 타이머 제거
    }
    const newTimerElement = document.createElement("div");
    newTimerElement.id = "timer";
    newTimerElement.textContent = `남은 시간: ${timeRemaining}초`;
    gameArea.insertBefore(newTimerElement, questionEl.nextSibling);

    timer = setInterval(() => {
        timeRemaining--;
        newTimerElement.textContent = `남은 시간: ${timeRemaining}초`;

        if (timeRemaining <= 0) {
            clearInterval(timer);
            if (onTimeout) onTimeout();
        }
    }, 1000);
}

// 시간 초과 처리 함수
function handleTimeout() {
    const difficulty = difficultySelect.value;

    let penalty = 0;
    if (difficulty === "easy") penalty = -2;
    else if (difficulty === "medium") penalty = -4;
    else if (difficulty === "hard") penalty = -8;

    feedbackEl.textContent = `시간 초과! -${Math.abs(penalty)}점`;
    updateScore(penalty);

    // 다음 질문 버튼 표시
    nextQuestionBtn.style.display = "block";
    nextQuestionBtn.onclick = () => {
        feedbackEl.textContent = "";
        nextQuestionBtn.style.display = "none";
        loadQuestion(currentMode);
    };
}

// 질문 로드 함수
function loadQuestion(mode) {
    if (usedIndices.length === gameWords.length) {
        feedbackEl.textContent = `게임이 종료되었습니다! 최종 점수: ${score}점`;
        questionEl.textContent = "";
        optionsEl.innerHTML = "";
        nextQuestionBtn.style.display = "none";
        clearInterval(timer);
        return;
    }

    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * gameWords.length);
    } while (usedIndices.includes(randomIndex));

    usedIndices.push(randomIndex);
    currentQuestion = gameWords[randomIndex];

    console.log("새로운 질문 로드:", currentQuestion);

    // 질문 표시
    questionEl.textContent = mode === "word-to-meaning" ? currentQuestion.word : currentQuestion.meaning;

    // 옵션 생성
    generateOptions(mode === "word-to-meaning" ? currentQuestion.meaning : currentQuestion.word, mode);

    // 시간 제한 타이머 시작
    startTimer(timeLimit, handleTimeout);
}

// 옵션 생성 함수
function generateOptions(correctAnswer, mode) {
    const options = [correctAnswer];
    while (options.length < 4) {
        const randomWord = gameWords[Math.floor(Math.random() * gameWords.length)];
        const option = mode === "word-to-meaning" ? randomWord.meaning : randomWord.word;
        if (!options.includes(option)) {
            options.push(option);
        }
    }

    // 옵션을 섞습니다
    options.sort(() => Math.random() - 0.5);

    // 옵션 버튼 생성
    optionsEl.innerHTML = "";
    options.forEach(option => {
        const btn = document.createElement("button");
        btn.textContent = option;
        btn.addEventListener("click", () => {
            checkAnswer(option, correctAnswer, mode);
        });
        optionsEl.appendChild(btn);
    });
}

// 정답 확인 함수
function checkAnswer(selected, correct, mode) {
    clearInterval(timer); // 타이머 정지

    const difficulty = difficultySelect.value;

    if (selected === correct) {
        let points = 0;
        if (difficulty === "easy") points = 10;
        else if (difficulty === "medium") points = 20;
        else if (difficulty === "hard") points = 30;

        feedbackEl.textContent = `정답입니다! +${points}점`;
        updateScore(points);
    } else {
        let penalty = 0;
        if (difficulty === "easy") penalty = -2;
        else if (difficulty === "medium") penalty = -4;
        else if (difficulty === "hard") penalty = -8;

        feedbackEl.textContent = `틀렸습니다! -${Math.abs(penalty)}점`;
        updateScore(penalty);
    }

    // 다음 질문 버튼 표시
    nextQuestionBtn.style.display = "block";
    nextQuestionBtn.onclick = () => {
        feedbackEl.textContent = "";
        nextQuestionBtn.style.display = "none";
        loadQuestion(mode);
    };
}

// 자동 재생 함수
function playCard() {
    playInterval = setInterval(() => {
        if (!isPlaying) return;
        const data = wordData[currentCardIndex];
        speak(data.word);
        setTimeout(() => {
            flipCard(true);
        }, 3000); // 3초 후에 뜻 표시
        setTimeout(() => {
            flipCard(false);
            currentCardIndex = (currentCardIndex + 1) % wordData.length;
            loadCard(currentCardIndex);
        }, 6000); // 6초 후에 다음 카드로 이동
    }, 7000); // 7초 간격으로 반복
}

// 텍스트 음성 변환 함수
function speak(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    } else {
        alert("음성 합성이 지원되지 않는 브라우저입니다.");
    }
}

// 게임 초기화 함수
function resetGame() {
    gameArea.style.display = "none";
    questionEl.textContent = "";
    optionsEl.innerHTML = "";
    feedbackEl.textContent = "";
    nextQuestionBtn.style.display = "none";
    clearInterval(timer);

    // 점수 표시 제거
    if (scoreDisplay) {
        scoreDisplay.remove();
        scoreDisplay = null;
    }
}

// 애플리케이션 초기화 함수
function initializeApp() {
    // 초기 선택 화면 버튼 이벤트
    selectFlashcardsBtn.addEventListener("click", () => {
        selectionScreen.style.display = "none";
        flashcardsSection.style.display = "block";
        loadCard(currentCardIndex);
    });

    selectWordgameBtn.addEventListener("click", () => {
        selectionScreen.style.display = "none";
        wordGameSection.style.display = "block";
    });

    // 뒤로 가기 버튼 이벤트 (낱말 카드 섹션)
    backToSelectionBtn.addEventListener("click", () => {
        flashcardsSection.style.display = "none";
        selectionScreen.style.display = "block";
        pauseBtn.click(); // 자동 재생 중지
    });

    // 뒤로 가기 버튼 이벤트 (단어 게임 섹션)
    backToSelectionGameBtn.addEventListener("click", () => {
        wordGameSection.style.display = "none";
        selectionScreen.style.display = "block";
        resetGame();
    });

    // 낱말 카드 초기화
    loadCard(currentCardIndex);

    // 카드 플립 기능
    card.addEventListener("click", () => {
        flipCard(!card.classList.contains("flipped"));
    });

    // 이전/다음 버튼 기능
    prevBtn.addEventListener("click", () => {
        currentCardIndex = (currentCardIndex - 1 + wordData.length) % wordData.length;
        loadCard(currentCardIndex);
    });

    nextBtn.addEventListener("click", () => {
        currentCardIndex = (currentCardIndex + 1) % wordData.length;
        loadCard(currentCardIndex);
    });

    // 재생/멈춤 버튼 기능
    playBtn.addEventListener("click", () => {
        if (isPlaying) return;
        isPlaying = true;
        playCard();
    });

    pauseBtn.addEventListener("click", () => {
        isPlaying = false;
        clearInterval(playInterval);
    });

    // 단어 게임 시작
    startGameBtn.addEventListener("click", () => {
        const difficulty = difficultySelect.value;
        const gameMode = gameModeSelect.value;
        currentMode = gameMode;

        // 난이도별 시간 제한 설정 및 점수 설정
        if (difficulty === "easy") {
            timeLimit = 5;
            score = 0;
        } else if (difficulty === "medium") {
            timeLimit = 3;
            score = 0;
        } else if (difficulty === "hard") {
            timeLimit = 2;
            score = 0;
        }

        // 필터링된 단어 선택
        gameWords = wordData.filter(word => word.difficulty === difficulty);
        if (gameWords.length < 4) {
            alert("선택한 난이도에 충분한 단어가 없습니다.");
            return;
        }

        // 게임 초기화
        usedIndices = [];
        gameArea.style.display = "block";
        feedbackEl.textContent = "";
        nextQuestionBtn.style.display = "none";

        // 점수 표시 초기화
        scoreDisplay = document.getElementById("scoreDisplay");
        if (!scoreDisplay) {
            scoreDisplay = document.createElement("div");
            scoreDisplay.id = "scoreDisplay";
            scoreDisplay.textContent = `점수: ${score}`;
            gameArea.prepend(scoreDisplay); // 게임 영역 상단에 점수 표시
        } else {
            scoreDisplay.textContent = `점수: ${score}`;
        }

        loadQuestion(currentMode);
    });
}

// 초기 데이터 로드 및 애플리케이션 초기화
loadWordData().then(() => {
    if (wordData.length > 0) {
        initializeApp();
    } else {
        console.error("wordData가 비어 있습니다.");
    }
});
