/* wordscript.js */

// 전역 변수
let wordData = []; // JSON에서 불러올 데이터
let currentCardIndex = 0;
let score = 0;
let scoreDisplay = null;
let timer;
let timeLimit = 5; // 기본 시간 (난이도에 따라 변경)
let gameWords = [];
let currentQuestion = {};
let usedIndices = [];
let currentMode = "word-to-meaning"; // 현재 게임 모드
let currentDifficulty = "easy"; // 현재 선택된 난이도
let gameStartTime = 0; // 게임 시작 시간

// Firebase 초기화
// TODO: 여기에 Firebase 설정을 추가하세요
const firebaseConfig = {
    apiKey: "YOUR_API_KEY", // Firebase 콘솔에서 확인
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

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
const backToSelectionBtn = document.getElementById("back-to-selection");

// 단어 게임 섹션 관련 요소
const wordGameSection = document.getElementById("word-game");
const backToSelectionGameBtn = document.getElementById("back-to-selection-game");
const difficultyButtons = document.querySelectorAll(".difficulty-button");
const modeButtons = document.querySelectorAll(".mode-button");
const startGameBtn = document.getElementById("startGameBtn");
const gameArea = document.getElementById("game-area");
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const feedbackEl = document.getElementById("feedback");
const timerEl = document.getElementById("timer");
const gameModeSelection = document.querySelector(".game-mode-selection");

// 팝업 관련 요소
const namePopup = document.getElementById("namePopup");
const finalScoreEl = document.getElementById("finalScore");
const finalTimeEl = document.getElementById("finalTime");
const playerNameInput = document.getElementById("playerName");
const submitScoreBtn = document.getElementById("submitScoreBtn");
const viewRecordsBtn = document.getElementById("viewRecordsBtn");
const recordsPopup = document.getElementById("recordsPopup");
const recordsTableBody = document.querySelector("#recordsTable tbody");
const closeRecordsBtn = document.getElementById("closeRecordsBtn");

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
    console.log("Loading card:", index, data); // 디버깅용 로그 추가
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
    timerEl.textContent = `남은 시간: ${timeRemaining}초`;

    timer = setInterval(() => {
        timeRemaining--;
        timerEl.textContent = `남은 시간: ${timeRemaining}초`;

        if (timeRemaining <= 0) {
            clearInterval(timer);
            if (onTimeout) onTimeout();
        }
    }, 1000);
}

// 시간 초과 처리 함수
function handleTimeout() {
    const difficulty = currentDifficulty;

    let penalty = 0;
    if (difficulty === "easy") penalty = -2;
    else if (difficulty === "medium") penalty = -4;
    else if (difficulty === "hard") penalty = -8;

    feedbackEl.textContent = `시간 초과! -${Math.abs(penalty)}점`;
    updateScore(penalty);

    // 1초 후 다음 질문 로드
    setTimeout(() => {
        feedbackEl.textContent = "";
        loadQuestion(currentMode);
    }, 1000);
}

// 질문 로드 함수
function loadQuestion(mode) {
    if (usedIndices.length === gameWords.length) {
        feedbackEl.textContent = `게임이 종료되었습니다! 최종 점수: ${score}점`;
        questionEl.textContent = "";
        optionsEl.innerHTML = "";
        timerEl.textContent = "";
        clearInterval(timer);

        // 게임 종료 시 이름 입력 팝업 표시
        showNamePopup();
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

    const difficulty = currentDifficulty;

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

    // 1초 후 다음 질문 로드
    setTimeout(() => {
        feedbackEl.textContent = "";
        loadQuestion(mode);
    }, 1000);
}

// 게임 시작 함수
function startGame(difficulty) {
    // 난이도별 시간 제한 설정 및 점수 초기화
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

    // 현재 난이도 저장
    currentDifficulty = difficulty;

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
    questionEl.textContent = "";
    optionsEl.innerHTML = "";
    timerEl.textContent = "";

    // 게임 시작 시간 기록
    gameStartTime = Date.now();

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
}

// 게임 초기화 함수
function resetGame() {
    gameArea.style.display = "none";
    questionEl.textContent = "";
    optionsEl.innerHTML = "";
    feedbackEl.textContent = "";
    timerEl.textContent = "";
    clearInterval(timer);

    // 점수 표시 제거
    if (scoreDisplay) {
        scoreDisplay.remove();
        scoreDisplay = null;
    }

    // 게임 모드 선택 숨기기
    gameModeSelection.style.display = "none";

    // 게임 시작 버튼 숨기기
    startGameBtn.classList.add("hidden");
}

// 이름 입력 팝업 표시 함수
function showNamePopup() {
    // 최종 점수 및 시간 계산
    const finalTime = Math.floor((Date.now() - gameStartTime) / 1000);
    finalScoreEl.textContent = score;
    finalTimeEl.textContent = finalTime;

    // 팝업 표시
    namePopup.classList.remove("hidden");
}

// 점수 제출 함수
function submitScore() {
    const playerName = playerNameInput.value.trim();
    if (playerName === "") {
        alert("이름을 입력해주세요.");
        return;
    }

    const finalTime = Math.floor((Date.now() - gameStartTime) / 1000);

    // Firestore에 데이터 추가
    db.collection("scores").add({
        name: playerName,
        score: score,
        time: finalTime,
        date: new Date()
    })
    .then(() => {
        alert("점수가 기록되었습니다!");
        // 팝업 숨기기
        namePopup.classList.add("hidden");
        // 게임 초기화
        resetGame();
        // 초기 선택 화면으로 돌아가기
        selectionScreen.style.display = "block";
    })
    .catch((error) => {
        console.error("점수 기록에 실패했습니다: ", error);
        alert("점수 기록에 실패했습니다. 나중에 다시 시도해주세요.");
    });
}

// 기록 보기 팝업 표시 함수
function showRecords() {
    // Firestore에서 데이터 가져오기
    db.collection("scores").orderBy("score", "desc").limit(10).get()
    .then((querySnapshot) => {
        recordsTableBody.innerHTML = ""; // 기존 기록 초기화
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const tr = document.createElement("tr");

            const nameTd = document.createElement("td");
            nameTd.textContent = data.name;
            tr.appendChild(nameTd);

            const scoreTd = document.createElement("td");
            scoreTd.textContent = data.score;
            tr.appendChild(scoreTd);

            const timeTd = document.createElement("td");
            timeTd.textContent = data.time;
            tr.appendChild(timeTd);

            const dateTd = document.createElement("td");
            const date = data.date.toDate();
            dateTd.textContent = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
            tr.appendChild(dateTd);

            recordsTableBody.appendChild(tr);
        });

        // 기록 보기 팝업 표시
        recordsPopup.classList.remove("hidden");
    })
    .catch((error) => {
        console.error("기록을 불러오는 데 실패했습니다: ", error);
        alert("기록을 불러오는 데 실패했습니다. 나중에 다시 시도해주세요.");
    });
}

// 기록 보기 팝업 닫기 함수
function closeRecords() {
    recordsPopup.classList.add("hidden");
}

// 애플리케이션 초기화 함수
function initializeApp() {
    // 초기 선택 화면 버튼 이벤트
    selectFlashcardsBtn.addEventListener("click", () => {
        console.log("낱말 카드 버튼 클릭");
        selectionScreen.style.display = "none";
        flashcardsSection.style.display = "block";
        loadCard(currentCardIndex);
    });

    selectWordgameBtn.addEventListener("click", () => {
        console.log("단어 게임 버튼 클릭");
        selectionScreen.style.display = "none";
        wordGameSection.style.display = "block";
        gameModeSelection.style.display = "flex"; // 게임 모드 선택 섹션 표시
    });

    // 뒤로 가기 버튼 이벤트 (낱말 카드 섹션)
    backToSelectionBtn.addEventListener("click", () => {
        console.log("뒤로 가기 버튼 클릭 (낱말 카드 섹션)");
        flashcardsSection.style.display = "none";
        selectionScreen.style.display = "block";
    });

    // 뒤로 가기 버튼 이벤트 (단어 게임 섹션)
    backToSelectionGameBtn.addEventListener("click", () => {
        console.log("뒤로 가기 버튼 클릭 (단어 게임 섹션)");
        wordGameSection.style.display = "none";
        selectionScreen.style.display = "block";
        resetGame();
    });

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

    // 난이도 버튼 클릭 시 .selected 클래스 토글
    difficultyButtons.forEach(button => {
        button.addEventListener("click", () => {
            const difficulty = button.getAttribute('data-difficulty');
            currentDifficulty = difficulty;
            // 모든 난이도 버튼에서 .selected 클래스 제거
            difficultyButtons.forEach(btn => btn.classList.remove("selected"));
            // 클릭된 버튼에 .selected 클래스 추가
            button.classList.add("selected");
            // 게임 모드 선택 섹션 표시
            gameModeSelection.style.display = "flex";
            // "게임 시작" 버튼 숨김
            startGameBtn.classList.add("hidden");
        });
    });

    // 게임 모드 버튼 클릭 시 .selected 클래스 토글
    modeButtons.forEach(button => {
        button.addEventListener("click", () => {
            const mode = button.getAttribute('data-mode');
            currentMode = mode;
            // 모든 모드 버튼에서 .selected 클래스 제거
            modeButtons.forEach(btn => btn.classList.remove("selected"));
            // 클릭된 버튼에 .selected 클래스 추가
            button.classList.add("selected");
            // "게임 시작" 버튼 표시
            startGameBtn.classList.remove("hidden");
        });
    });

    // 게임 시작 버튼 클릭 시
    startGameBtn.addEventListener("click", () => {
        if (!currentDifficulty) {
            alert("난이도를 선택해주세요.");
            return;
        }
        if (!currentMode) {
            alert("게임 방식을 선택해주세요.");
            return;
        }
        console.log("게임 시작 버튼 클릭");
        startGame(currentDifficulty);
    });

    // 이름 입력 제출 버튼 클릭 시
    submitScoreBtn.addEventListener("click", submitScore);

    // 기록 보기 버튼 클릭 시
    viewRecordsBtn.addEventListener("click", showRecords);

    // 기록 보기 팝업 닫기 버튼 클릭 시
    closeRecordsBtn.addEventListener("click", closeRecords);
}

// 초기 데이터 로드 및 애플리케이션 초기화
loadWordData().then(() => {
    if (wordData.length > 0) {
        initializeApp();
    } else {
        console.error("wordData가 비어 있습니다.");
    }
});
