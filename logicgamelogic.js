// logicgamelogic.js

// Firebase 초기화는 logicgamefirebaseConfig.js에서 이미 완료되었습니다.
// db 변수는 window.db로 초기화됨

// DOM 요소 선택
const sequenceElement = document.getElementById("sequence");
const optionsElement = document.getElementById("options");
const inputContainer = document.getElementById("input-container");
const answerInput = document.getElementById("answerInput");
const submitAnswerButton = document.getElementById("submitAnswerButton");
const resultElement = document.getElementById("result");
const scoreElement = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const saveRecordButton = document.getElementById("saveRecordButton");
const viewRecordsButton = document.getElementById("viewRecordsButton");
const recordSection = document.getElementById("recordSection");
const recordTableBody = document.getElementById("recordTable").querySelector("tbody");
const closeRecordsButton = document.getElementById("closeRecordsButton");
const overlay = document.getElementById("overlay");
const nameForm = document.getElementById("name-form");
const playerNameInput = document.getElementById("playerName");
const saveNameButton = document.getElementById("saveNameButton");
const goBackButton = document.getElementById("goBackButton");
const difficultySelect = document.getElementById("difficultySelect");

// 게임 변수 초기화
let currentQuestion = null;
let score = 0;
let startTime, timerInterval;
let questionsAnswered = 0;
const totalQuestions = 5;
let questionsData = {
    easy: [],
    medium: [],
    hard: []
};
let selectedQuestions = {
    easy: [],
    medium: [],
    hard: []
};

// 난이도 선택 이벤트 리스너
difficultySelect.addEventListener("change", () => {
    const difficulty = difficultySelect.value;
    console.log("선택된 난이도:", difficulty);
    generateGame();
});

// 게임 생성 함수
function generateGame() {
    resetGame();
    loadQuestions()
        .then(() => {
            selectRandomQuestions();
            selectRandomQuestion();
            displaySequence();
            startTimer();
        })
        .catch((error) => {
            console.error("질문 로드 실패:", error);
            alert("게임을 시작할 수 없습니다. 나중에 다시 시도해주세요.");
        });
}

// 게임 초기화 함수
function resetGame() {
    currentQuestion = null;
    answerInput.value = "";
    resultElement.textContent = "";
    score = 0;
    questionsAnswered = 0;
    scoreElement.textContent = `점수: ${score}`;
    clearInterval(timerInterval);
    timerDisplay.textContent = "걸린 시간: 0초";

    // 선택지 및 입력 필드 초기화
    optionsElement.innerHTML = "";
    optionsElement.style.display = "none";
    inputContainer.style.display = "block";
}

// JSON 파일에서 질문 로드 함수
async function loadQuestions() {
    if (questionsData.easy.length > 0 || questionsData.medium.length > 0 || questionsData.hard.length > 0) {
        return;
    }
    try {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error('JSON 파일을 불러오는 데 실패했습니다.');
        }
        const data = await response.json();
        questionsData = data;
        console.log("질문 데이터 로드됨:", questionsData);
    } catch (error) {
        console.error("질문 로드 오류:", error);
        throw error;
    }
}

// 랜덤으로 각 난이도별 5문제 선택 함수
function selectRandomQuestions() {
    const difficulties = ["easy", "medium", "hard"];
    difficulties.forEach((difficulty) => {
        const questions = questionsData[difficulty];
        if (!questions || questions.length === 0) {
            console.warn(`난이도 ${difficulty}에 질문이 없습니다.`);
            selectedQuestions[difficulty] = [];
            return;
        }
        if (questions.length <= totalQuestions) {
            selectedQuestions[difficulty] = [...questions];
        } else {
            selectedQuestions[difficulty] = getRandomSubset(questions, totalQuestions);
        }
    });
    console.log("선택된 질문들:", selectedQuestions);
}

// 주어진 배열에서 랜덤하게 'count'개의 요소를 선택하는 유틸리티 함수
function getRandomSubset(array, count) {
    const shuffled = array.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// 난이도에 따른 랜덤 질문 선택 함수
function selectRandomQuestion() {
    const difficulty = difficultySelect.value;
    const questions = selectedQuestions[difficulty];
    if (!questions || questions.length === 0) {
        showNameForm();
        return;
    }
    const randomIndex = Math.floor(Math.random() * questions.length);
    currentQuestion = questions[randomIndex];
    console.log("선택된 질문:", currentQuestion);
    
    // 선택된 질문을 목록에서 제거하여 중복 출제를 방지
    selectedQuestions[difficulty].splice(randomIndex, 1);
}

// 아이콘을 HTML로 대체하는 함수
function replaceQuestionWithIcon(sequence) {
    return sequence.replace("[QUESTION]", '<i class="fas fa-question-circle question-icon"></i>');
}

// 시퀀스 표시 함수
function displaySequence() {
    if (!currentQuestion) return;
    let formattedSequence = replaceQuestionWithIcon(currentQuestion.sequence);
    formattedSequence = formattedSequence.replace(/\n/g, '<br>'); // 줄 바꿈 처리
    sequenceElement.innerHTML = formattedSequence;

    if (currentQuestion.options && Array.isArray(currentQuestion.options)) {
        displayOptions(currentQuestion.options);
    } else {
        displayInputField();
    }
}

// 선택지 표시 함수
function displayOptions(options) {
    optionsElement.innerHTML = ""; // 기존 선택지 초기화
    options.forEach(option => {
        const button = document.createElement("button");
        button.textContent = option;
        button.classList.add("option-button");
        button.addEventListener("click", () => {
            submitAnswer(option);
        });
        optionsElement.appendChild(button);
    });
    optionsElement.style.display = "block";
    inputContainer.style.display = "none"; // 입력 필드 숨김
}

// 입력 필드 표시 함수
function displayInputField() {
    optionsElement.style.display = "none";
    inputContainer.style.display = "block";
}

// 정답 제출 함수
submitAnswerButton.addEventListener("click", () => {
    const userAnswer = answerInput.value.trim();
    if (!userAnswer) {
        alert("답을 입력하세요!");
        return;
    }
    submitAnswer(userAnswer);
});

// 정답 제출 처리 함수
function submitAnswer(userAnswer) {
    if (!currentQuestion) {
        alert("문제가 로드되지 않았습니다.");
        return;
    }

    // 정답을 문자열로 비교 (대소문자 무시)
    if (userAnswer.toLowerCase() === String(currentQuestion.answer).toLowerCase()) {
        resultElement.textContent = "정답입니다!";
        resultElement.style.color = "green";
        resultElement.classList.add("correct");
        resultElement.classList.remove("incorrect");
        score += 10; // 정답 시 점수 증가
    } else {
        resultElement.textContent = `오답입니다! 정답은 ${currentQuestion.answer}입니다. 설명: ${currentQuestion.description}`;
        resultElement.style.color = "red";
        resultElement.classList.add("incorrect");
        resultElement.classList.remove("correct");
    }

    scoreElement.textContent = `점수: ${score}`;
    questionsAnswered++; // 질문 수 증가

    if (questionsAnswered >= totalQuestions) {
        // 5문제를 모두 풀었을 때
        showNameForm();
    } else {
        selectNewQuestion();
    }
}

// 새로운 질문 선택 및 게임 진행 함수
function selectNewQuestion() {
    selectRandomQuestion();
    if (currentQuestion) {
        displaySequence();
        answerInput.value = "";
    }
}

// 타이머 시작 함수
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        timerDisplay.textContent = `걸린 시간: ${elapsedTime}초`;
    }, 1000);
}

// 기록 저장 버튼 이벤트 리스너
saveRecordButton.addEventListener("click", () => {
    if (score === 0) {
        alert("점수가 0점이면 기록을 저장할 수 없습니다.");
        return;
    }
    showNameForm();
});

// 이름 제출 버튼 이벤트 리스너
saveNameButton.addEventListener("click", () => {
    const playerName = playerNameInput.value.trim();
    if (!playerName) {
        alert("이름을 입력하세요!");
        return;
    }

    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);

    const newRecord = {
        difficulty: difficultySelect.value, // 난이도
        name: playerName,                   // 플레이어 이름
        score: score,                       // 점수
        time: elapsedTime,                  // 걸린 시간
        timestamp: firebase.firestore.FieldValue.serverTimestamp() // 기록 시간
    };

    saveRecord(newRecord)
        .then(() => {
            alert("기록이 저장되었습니다!");
            hideNameForm();
        })
        .catch((error) => {
            console.error("기록 저장 실패:", error.message, error.code, error);
            alert("기록 저장 중 오류가 발생했습니다.");
        });
});

// Firestore 기록 저장 함수
function saveRecord(record) {
    return db.collection("gameRecords").add(record)
        .then(() => {
            console.log("게임 기록이 성공적으로 저장되었습니다.");
        })
        .catch((error) => {
            console.error("게임 기록 저장 중 오류 발생:", error);
            throw error; // 에러를 상위로 전달
        });
}

// 기록 보기 버튼 이벤트 리스너
viewRecordsButton.addEventListener("click", () => {
    showLeaderboard();
});

// 기록 닫기 버튼 이벤트 리스너
closeRecordsButton.addEventListener("click", () => {
    recordSection.style.display = "none";
});

// 리더보드 표시 함수
function showLeaderboard() {
    const difficulty = difficultySelect.value;
    console.log("선택된 난이도:", difficulty);

    db.collection("gameRecords")
        .where("difficulty", "==", difficulty) // 현재 난이도 필터
        .orderBy("score", "desc") // 점수 기준 내림차순
        .limit(10) // 상위 10개만 표시
        .get()
        .then((snapshot) => {
            console.log("가져온 기록 개수:", snapshot.size);
            recordTableBody.innerHTML = ""; // 기존 데이터 초기화

            if (snapshot.empty) {
                console.log("기록이 없습니다.");
                const tr = document.createElement("tr");
                const td = document.createElement("td");
                td.colSpan = 5; // Rank 삭제로 컬럼 수 조정
                td.textContent = "기록이 없습니다.";
                tr.appendChild(td);
                recordTableBody.appendChild(tr);
            } else {
                snapshot.forEach((doc, index) => {
                    const data = doc.data();
                    console.log(`기록 ${index + 1}:`, data);

                    const tr = document.createElement("tr");

                    const difficultyTd = document.createElement("td");
                    difficultyTd.textContent = data.difficulty;
                    tr.appendChild(difficultyTd);

                    const nameTd = document.createElement("td");
                    nameTd.textContent = data.name || "익명"; // 이름이 없으면 "익명" 표시
                    tr.appendChild(nameTd);

                    const scoreTd = document.createElement("td");
                    scoreTd.textContent = data.score || 0; // 점수가 없으면 0 표시
                    tr.appendChild(scoreTd);

                    const timeTd = document.createElement("td");
                    timeTd.textContent = `${data.time || 0}초`; // 시간이 없으면 0초 표시
                    tr.appendChild(timeTd);

                    const dateTd = document.createElement("td");
                    dateTd.textContent = data.timestamp
                        ? data.timestamp.toDate().toLocaleString()
                        : "N/A"; // 날짜 표시
                    tr.appendChild(dateTd);

                    recordTableBody.appendChild(tr);
                });
            }

            recordSection.style.display = "block";
        })
        .catch((error) => {
            console.error("Firestore에서 기록 불러오기 실패:", error.message, error.code, error);
            alert("기록을 불러오는 중 오류가 발생했습니다.");
        });
}

// 이름 입력 폼 표시 함수
function showNameForm() {
    overlay.style.display = "block";
    nameForm.style.display = "block";
}

// 이름 입력 폼 숨기기 함수
function hideNameForm() {
    overlay.style.display = "none";
    nameForm.style.display = "none";
    playerNameInput.value = "";
}

// 돌아가기 버튼 이벤트 리스너
goBackButton.addEventListener("click", () => {
    hideNameForm();
    generateGame(); // 게임을 재시작
});

// 페이지 로드 시 게임 시작
window.onload = () => {
    generateGame();
};
