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

// 기록 보기 관련 요소
const viewRecordsBtn = document.getElementById("viewRecordsBtn");
const recordsPopup = document.getElementById("recordsPopup");
const recordsTableBody = document.querySelector("#recordsTable tbody");

// 이름 입력 팝업 관련 요소
const namePopup = document.getElementById("namePopup");
const closeButtons = document.querySelectorAll(".close-button");
const submitScoreBtn = document.getElementById("submitScoreBtn");
const playerNameInput = document.getElementById("playerName");

// Firebase 초기화 (여기에 본인의 Firebase 구성 정보를 입력하세요)
const firebaseConfig = {
    apiKey: "AIzaSyCqUAZGSffw--qgbjxWXJPDrexbewz-FiI", // Firebase 콘솔에서 확인
    authDomain: "engwordrecord.firebaseapp.com",
    projectId: "engwordrecord",
    storageBucket: "engwordrecord.firebasestorage.app",
    messagingSenderId: "1871312101",
    appId: "1:1871312101:web:875bb35f925e8c52bd900c"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

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

        // 이름 입력 팝업 열기
        openNamePopup();

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
    const filteredWords = wordData.filter(word => word.difficulty === difficulty);
    if (filteredWords.length < 20) {
        alert("선택한 난이도에 충분한 단어가 없습니다. 최소 20개 이상의 단어가 필요합니다.");
        return;
    }

    // 단어를 랜덤하게 섞은 후 상위 20개 선택
    const shuffled = filteredWords.sort(() => 0.5 - Math.random());
    gameWords = shuffled.slice(0, 20);

    // 게임 초기화
    usedIndices = [];
    gameArea.style.display = "block";
    feedbackEl.textContent = "";
    questionEl.textContent = "";
    optionsEl.innerHTML = "";
    timerEl.textContent = "";

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

// 모달 열기 함수
function openNamePopup() {
    namePopup.classList.remove("hidden");
    namePopup.style.display = "block";
}

// 모달 닫기 함수
function closeModal() {
    namePopup.classList.add("hidden");
    namePopup.style.display = "none";
    recordsPopup.classList.add("hidden");
    recordsPopup.style.display = "none";
}

// 이름 제출 함수
submitScoreBtn.addEventListener("click", () => {
    const playerName = playerNameInput.value.trim();
    if (playerName === "") {
        alert("이름을 입력해주세요.");
        return;
    }

    // 현재 시간 기록
    const recordTime = new Date().toLocaleString();

    // Firestore에 데이터 저장
    db.collection("gameRecords").add({
        name: playerName,
        score: score,
        recordTime: recordTime,
        difficulty: currentDifficulty // 난이도 정보 추가
    })
    .then(() => {
        alert("점수가 기록되었습니다!");
        namePopup.classList.add("hidden");
        namePopup.style.display = "none";
        playerNameInput.value = "";
        resetGame();
    })
    .catch((error) => {
        console.error("점수 기록에 실패했습니다: ", error);
        alert("점수 기록에 실패했습니다. 다시 시도해주세요.");
    });
});

// 기록 보기 버튼 클릭 시
viewRecordsBtn.addEventListener("click", () => {
    // Firestore에서 데이터 가져오기
    db.collection("gameRecords").orderBy("score", "desc").get()
    .then((querySnapshot) => {
        recordsTableBody.innerHTML = ""; // 기존 기록 초기화
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const row = document.createElement("tr");

            // 난이도 셀 추가
            const difficultyCell = document.createElement("td");
            difficultyCell.textContent = data.difficulty.charAt(0).toUpperCase() + data.difficulty.slice(1); // 첫 글자 대문자
            row.appendChild(difficultyCell);

            // 이름 셀
            const nameCell = document.createElement("td");
            nameCell.textContent = data.name;
            row.appendChild(nameCell);

            // 점수 셀
            const scoreCell = document.createElement("td");
            scoreCell.textContent = data.score;
            row.appendChild(scoreCell);

            // 기록 시간 셀
            const timeCell = document.createElement("td");
            timeCell.textContent = data.recordTime;
            row.appendChild(timeCell);

            recordsTableBody.appendChild(row);
        });

        recordsPopup.classList.remove("hidden");
        recordsPopup.style.display = "block";
    })
    .catch((error) => {
        console.error("기록을 가져오는 데 실패했습니다: ", error);
        alert("기록을 가져오는 데 실패했습니다.");
    });
});

// 모달 닫기 버튼 클릭 시
closeButtons.forEach(button => {
    button.addEventListener("click", () => {
        closeModal();
    });
});

// 외부 클릭 시 모달 닫기
window.addEventListener("click", (event) => {
    if (event.target === namePopup) {
        closeModal();
    }
    if (event.target === recordsPopup) {
        closeModal();
    }
});

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
}

// 초기 데이터 로드 및 애플리케이션 초기화
loadWordData().then(() => {
    if (wordData.length > 0) {
        initializeApp();
    } else {
        console.error("wordData가 비어 있습니다.");
    }
});
