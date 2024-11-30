/* wordscript.js */

// ====================
// 전역 변수 선언
// ====================

// 낱말 카드 관련 변수
let flashcardsWords = [];
let currentFlashcardIndex = 0;

// 단어 게임 관련 변수
let gameWords = [];
let currentQuestion = {};
let usedIndices = [];
let currentMode = "word-to-meaning"; // 현재 게임 모드
let currentDifficulty = "easy"; // 현재 선택된 난이도
let currentQuestionCount = 0;   // 현재 질문 수
const TOTAL_QUESTIONS = 20;      // 총 질문 수
let score = 0;
let scoreDisplay = null;
let timer;
let timeLimit = 5; // 기본 시간 (난이도에 따라 변경)

// 단어 데이터
let wordData = [];

// ====================
// DOM 요소 참조
// ====================

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
const flashcardDifficultySelect = document.getElementById("flashcard-difficulty");
const speakBtn = document.getElementById("speakBtn");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const wordText = document.getElementById("word-text");
const meaningText = document.getElementById("meaning-text");

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

// 기록 보기 필터링 및 정렬 요소
const filterDifficulty = document.getElementById("filter-difficulty");
const sortBy = document.getElementById("sort-by");
const applyFiltersBtn = document.getElementById("apply-filters");

// ====================
// Firebase 초기화
// ====================

// 본인의 Firebase 구성 정보로 교체하세요
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

// ====================
// 데이터 로드 함수
// ====================

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

// ====================
// 낱말 카드 관련 함수
// ====================

function loadFlashcard(index) {
    if (flashcardsWords.length === 0) {
        console.error("flashcardsWords가 비어 있습니다.");
        return;
    }

    const data = flashcardsWords[index];
    console.log("Loading flashcard:", index, data); // 디버깅용 로그 추가

    wordText.textContent = data.word;
    meaningText.textContent = data.meaning;
    flipCard(false);

    // 진행 바 업데이트
    const progressPercentage = ((index + 1) / flashcardsWords.length) * 100;
    progressBar.style.width = `${progressPercentage}%`;

    // 진행 텍스트 업데이트
    progressText.textContent = `${index + 1} / ${flashcardsWords.length}`;

    // 영어 단어를 음성으로 읽어줌
    speakWord(data.word);
}

function flipCard(flip) {
    if (flip) {
        card.classList.add("flipped");
    } else {
        card.classList.remove("flipped");
    }
}

function speakWord(word) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US'; // 영어 발음 설정
        utterance.rate = 1; // 속도 (0.1 ~ 10)
        utterance.pitch = 1; // 음의 높낮이 (0 ~ 2)
        window.speechSynthesis.speak(utterance);
    } else {
        console.warn("이 브라우저는 음성 합성을 지원하지 않습니다.");
    }
}

function loadFlashcards(difficulty) {
    // 난이도별 단어 필터링
    const filteredWords = wordData.filter(word => word.difficulty === difficulty);
    if (filteredWords.length === 0) {
        alert("선택한 난이도에 해당하는 단어가 없습니다.");
        return;
    }

    // 모든 단어를 랜덤하게 섞은 후 전체 단어를 사용
    flashcardsWords = shuffleArray(filteredWords);

    // 현재 인덱스 초기화
    currentFlashcardIndex = 0;

    // 진행 바 초기화
    progressBar.style.width = '0%';
    progressText.textContent = `0 / ${flashcardsWords.length}`;

    // 첫 번째 카드 로드
    loadFlashcard(currentFlashcardIndex);
}

function shuffleArray(array) {
    let shuffled = array.slice(); // 배열 복사
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ====================
// 단어 게임 관련 함수
// ====================

function loadQuestion(mode) {
    if (currentQuestionCount >= TOTAL_QUESTIONS) {
        endGame();
        return;
    }

    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * gameWords.length);
    } while (usedIndices.includes(randomIndex));

    usedIndices.push(randomIndex);
    currentQuestion = gameWords[randomIndex];
    currentQuestionCount++;

    console.log("새로운 질문 로드:", currentQuestion);

    // 질문 표시
    questionEl.textContent = mode === "word-to-meaning" ? currentQuestion.word : currentQuestion.meaning;

    // 옵션 생성
    generateOptions(mode === "word-to-meaning" ? currentQuestion.meaning : currentQuestion.word, mode);

    // 시간 제한 타이머 시작
    startTimer(timeLimit, handleTimeout);

    // 남은 문제 수 업데이트
    if (scoreDisplay) {
        const remainingSpan = document.getElementById("remainingSpan");
        remainingSpan.textContent = `남은 문제수: ${TOTAL_QUESTIONS - currentQuestionCount}`;
    }
}

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
        btn.classList.add("option-button"); // 옵션 버튼 클래스 추가
        btn.addEventListener("click", () => {
            checkAnswer(option, correctAnswer, mode);
        });
        optionsEl.appendChild(btn);
    });
}

function checkAnswer(selected, correct, mode) {
    clearInterval(timer); // 타이머 정지

    const difficulty = currentDifficulty;

    // 모든 옵션 버튼을 비활성화
    const optionButtons = optionsEl.querySelectorAll('button');
    optionButtons.forEach(button => {
        button.disabled = true;
    });

    if (selected === correct) {
        let points = 0;
        if (difficulty === "easy") points = 10;
        else if (difficulty === "medium") points = 20;
        else if (difficulty === "hard") points = 30;

        feedbackEl.textContent = `정답입니다! +${points}점`;
        updateScore(points);

        // 선택된 버튼에 정답 클래스 추가
        optionButtons.forEach(button => {
            if (button.textContent === correct) {
                button.classList.add("correct-answer");
            }
        });
    } else {
        let penalty = 0;
        if (difficulty === "easy") penalty = -2;
        else if (difficulty === "medium") penalty = -4;
        else if (difficulty === "hard") penalty = -8;

        feedbackEl.textContent = `틀렸습니다! -${Math.abs(penalty)}점`;
        updateScore(penalty);

        // 선택된 오답 버튼에 오답 클래스 추가
        optionButtons.forEach(button => {
            if (button.textContent === selected) {
                button.classList.add("incorrect-answer");
            }
            // 정답 버튼에 정답 클래스 추가
            if (button.textContent === correct) {
                button.classList.add("correct-answer");
            }
        });
    }

    // 2초 후 다음 질문 로드 (사용자가 결과를 확인할 시간 확보)
    setTimeout(() => {
        feedbackEl.textContent = "";
        // 모든 버튼의 정답/오답 클래스 제거
        optionButtons.forEach(button => {
            button.classList.remove("correct-answer", "incorrect-answer");
            button.disabled = false; // 버튼 활성화
        });
        loadQuestion(mode);
    }, 1000); // 2초로 증가
}

function startGame(difficulty) {
    // 난이도별 시간 제한 설정 및 점수 초기화
    if (difficulty === "easy") {
        timeLimit = 5;
        score = 0;
    } else if (difficulty === "medium") {
        timeLimit = 4;
        score = 0;
    } else if (difficulty === "hard") {
        timeLimit = 3;
        score = 0;
    }

    // 현재 난이도 저장
    currentDifficulty = difficulty;

    // 필터링된 단어 선택
    const filteredWords = wordData.filter(word => word.difficulty === difficulty);
    if (filteredWords.length < TOTAL_QUESTIONS) {
        alert(`선택한 난이도에 충분한 단어가 없습니다. 최소 ${TOTAL_QUESTIONS}개 이상의 단어가 필요합니다.`);
        return;
    }

    // 단어를 랜덤하게 섞은 후 상위 20개 선택
    gameWords = shuffleArray(filteredWords).slice(0, TOTAL_QUESTIONS);

    // 게임 초기화
    usedIndices = [];
    currentQuestionCount = 0; // 질문 수 초기화
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

        // 점수 스팬
        const scoreSpan = document.createElement("span");
        scoreSpan.id = "scoreSpan";
        scoreSpan.textContent = `점수: ${score}`;

        // 남은 문제 수 스팬
        const remainingSpan = document.createElement("span");
        remainingSpan.id = "remainingSpan";
        remainingSpan.textContent = `남은 문제수: ${TOTAL_QUESTIONS - currentQuestionCount}`;

        // 스팬들을 scoreDisplay에 추가
        scoreDisplay.appendChild(scoreSpan);
        scoreDisplay.appendChild(document.createTextNode(' | ')); // 구분자
        scoreDisplay.appendChild(remainingSpan);

        gameArea.prepend(scoreDisplay);
    } else {
        const scoreSpan = document.getElementById("scoreSpan");
        const remainingSpan = document.getElementById("remainingSpan");
        scoreSpan.textContent = `점수: ${score}`;
        remainingSpan.textContent = `남은 문제수: ${TOTAL_QUESTIONS - currentQuestionCount}`;
    }

    loadQuestion(currentMode);
}

function handleTimeout() {
    const difficulty = currentDifficulty;

    // 난이도에 따른 점수 페널티 설정
    let penalty = 0;
    if (difficulty === "easy") penalty = -2;
    else if (difficulty === "medium") penalty = -4;
    else if (difficulty === "hard") penalty = -8;

    // 모든 옵션 버튼을 비활성화
    const optionButtons = optionsEl.querySelectorAll('button');
    optionButtons.forEach(button => {
        button.disabled = true;
    });

    // 정답 버튼 찾기 및 'correct-answer' 클래스 추가
    optionButtons.forEach(button => {
        const answer = currentMode === "word-to-meaning" ? currentQuestion.meaning : currentQuestion.word;
        if (button.textContent === answer) {
            button.classList.add("correct-answer");
        }
    });

    // 피드백 표시 (정답을 텍스트로 표시하지 않음)
    feedbackEl.textContent = `시간 초과! (-${Math.abs(penalty)}점)`;

    // 점수 업데이트
    updateScore(penalty);

    // 2초 후 다음 질문 로드 (사용자가 결과를 확인할 시간 확보)
    setTimeout(() => {
        feedbackEl.textContent = "";
        // 모든 버튼의 정답/오답 클래스 제거
        optionButtons.forEach(button => {
            button.classList.remove("correct-answer", "incorrect-answer");
            button.disabled = false; // 버튼 활성화
        });
        loadQuestion(currentMode);
    }, 1000); // 2초 후 다음 질문으로 이동
}

function endGame() {
    feedbackEl.textContent = `게임이 종료되었습니다! 최종 점수: ${score}점`;
    questionEl.textContent = "";
    optionsEl.innerHTML = "";
    timerEl.textContent = "";
    clearInterval(timer);

    // 이름 입력 팝업 열기
    openNamePopup();
}

// ====================
// 타이머 관련 함수
// ====================

function startTimer(seconds, callback) {
    timerEl.textContent = `남은 시간: ${seconds}초`;
    let remaining = seconds;
    timer = setInterval(() => {
        remaining--;
        if (remaining > 0) {
            timerEl.textContent = `남은 시간: ${remaining}초`;
        } else {
            clearInterval(timer);
            timerEl.textContent = `남은 시간: 0초`;
            callback();
        }
    }, 1000);
}

// ====================
// 점수 관련 함수
// ====================

function updateScore(points) {
    score += points;
    if (scoreDisplay) {
        const scoreSpan = document.getElementById("scoreSpan");
        const remainingSpan = document.getElementById("remainingSpan");
        scoreSpan.textContent = `점수: ${score}`;
        remainingSpan.textContent = `남은 문제수: ${TOTAL_QUESTIONS - currentQuestionCount}`;
    }
}

// ====================
// 기록 보기 관련 함수
// ====================

function viewRecords() {
    let query = db.collection("gameRecords");

    // 난이도 필터링
    const selectedDifficulty = filterDifficulty.value;
    if (selectedDifficulty !== "all") {
        query = query.where("difficulty", "==", selectedDifficulty);
    }

    // 정렬 기준 설정
    const selectedSort = sortBy.value;
    if (selectedSort === "score_desc") {
        query = query.orderBy("score", "desc");
    } else if (selectedSort === "score_asc") {
        query = query.orderBy("score", "asc");
    } else if (selectedSort === "time_desc") {
        query = query.orderBy("recordTime", "desc");
    } else if (selectedSort === "time_asc") {
        query = query.orderBy("recordTime", "asc");
    }

    // Firestore에서 데이터 가져오기
    query.get()
    .then((querySnapshot) => {
        recordsTableBody.innerHTML = ""; // 기존 기록 초기화
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const row = document.createElement("tr");

            // 난이도 셀 추가
            const difficultyCell = document.createElement("td");
            const difficultyText = data.difficulty.charAt(0).toUpperCase() + data.difficulty.slice(1);
            difficultyCell.textContent = difficultyText;
            difficultyCell.classList.add(`${data.difficulty}-difficulty`); // 난이도별 클래스 추가
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
            // const timeCell = document.createElement("td");
            // timeCell.textContent = data.recordTime;
            // row.appendChild(timeCell);

            recordsTableBody.appendChild(row);
        });

        recordsPopup.classList.remove("hidden");
        recordsPopup.style.display = "block";
    })
    .catch((error) => {
        console.error("기록을 가져오는 데 실패했습니다: ", error);
        alert("기록을 가져오는 데 실패했습니다.");
    });
}

// ====================
// 모달 관련 함수
// ====================

function openNamePopup() {
    namePopup.classList.remove("hidden");
    namePopup.style.display = "block";
}

function closeModal() {
    namePopup.classList.add("hidden");
    namePopup.style.display = "none";
    recordsPopup.classList.add("hidden");
    recordsPopup.style.display = "none";
}

// ====================
// 이벤트 리스너 설정
// ====================

// 낱말 카드 난이도 선택 시 단어 로드
flashcardDifficultySelect.addEventListener("change", () => {
    const selectedDifficulty = flashcardDifficultySelect.value;
    loadFlashcards(selectedDifficulty);
});

// 낱말 카드 음성 재생 버튼 클릭 시
speakBtn.addEventListener("click", () => {
    const word = wordText.textContent.trim();
    speakWord(word);
});

// 낱말 카드 이전 버튼 클릭 시
prevBtn.addEventListener("click", () => {
    if (currentFlashcardIndex > 0) {
        currentFlashcardIndex--;
    } else {
        // 마지막 카드에서 다시 처음 카드로 순환
        currentFlashcardIndex = flashcardsWords.length - 1;
    }
    loadFlashcard(currentFlashcardIndex);
});

// 낱말 카드 다음 버튼 클릭 시
nextBtn.addEventListener("click", () => {
    if (currentFlashcardIndex < flashcardsWords.length - 1) {
        currentFlashcardIndex++;
    } else {
        // 마지막 카드에서 다시 처음 카드로 순환
        currentFlashcardIndex = 0;
    }
    loadFlashcard(currentFlashcardIndex);
});

// 낱말 카드 섹션 뒤로 가기 버튼 클릭 시
backToSelectionBtn.addEventListener("click", () => {
    console.log("뒤로 가기 버튼 클릭 (낱말 카드 섹션)");
    flashcardsSection.style.display = "none";
    selectionScreen.style.display = "block";
});

// 단어 게임 섹션 뒤로 가기 버튼 클릭 시
backToSelectionGameBtn.addEventListener("click", () => {
    console.log("뒤로 가기 버튼 클릭 (단어 게임 섹션)");
    wordGameSection.style.display = "none";
    selectionScreen.style.display = "block";
    resetGame();
});

// 단어 게임 난이도 버튼 클릭 시
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

// 단어 게임 모드 버튼 클릭 시
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

// 단어 게임 시작 버튼 클릭 시
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

// 카드 플립 기능 추가: 카드 전체 클릭 시 플립
card.addEventListener("click", () => {
    flipCard(!card.classList.contains("flipped"));
});

// 이름 제출 버튼 클릭 시
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
        closeModal();
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
    viewRecords();
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

// 적용 버튼 클릭 시 필터링 및 정렬 적용
applyFiltersBtn.addEventListener("click", () => {
    viewRecords();
});

// ====================
// 애플리케이션 초기화 함수
// ====================

function initializeApp() {
    // 초기 선택 화면 버튼 이벤트 유지

    // 낱말 카드 버튼 클릭 시
    selectFlashcardsBtn.addEventListener("click", () => {
        console.log("낱말 카드 버튼 클릭");
        selectionScreen.style.display = "none";
        flashcardsSection.style.display = "block";
        // 기본 난이도 선택 (예: easy)
        flashcardDifficultySelect.value = "easy";
        loadFlashcards("easy");
    });

    // 단어 게임 버튼 클릭 시
    selectWordgameBtn.addEventListener("click", () => {
        console.log("단어 게임 버튼 클릭");
        selectionScreen.style.display = "none";
        wordGameSection.style.display = "block";
        gameModeSelection.style.display = "flex"; // 게임 모드 선택 섹션 표시
    });
}

// ====================
// 게임 초기화 및 재설정 함수
// ====================

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

// ====================
// 최종 초기화
// ====================

loadWordData().then(() => {
    if (wordData.length > 0) {
        initializeApp();
    } else {
        console.error("wordData가 비어 있습니다.");
    }
});
