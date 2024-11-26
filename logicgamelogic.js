// logicgamelogic.js

// Firebase 초기화는 firebaseConfig.js에서 이미 완료되었습니다.
// db 변수는 firebase.firestore()로 초기화됨

// DOM 요소 선택
const sequenceElement = document.getElementById("sequence");
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
const difficultySelect = document.getElementById("difficultySelect"); // 난이도 선택 요소

// 게임 변수 초기화
let currentQuestion = null;
let score = 0;
let startTime, timerInterval;
let questionsData = {
    easy: [],
    medium: [],
    hard: []
};

// 난이도 선택 이벤트 리스너
difficultySelect.addEventListener("change", () => {
    difficulty = difficultySelect.value;
    console.log("선택된 난이도:", difficulty);
    generateGame(); // 난이도가 변경되면 게임을 재생성
});

// 게임 생성 함수
function generateGame() {
    resetGame();
    loadQuestions()
        .then(() => {
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
    scoreElement.textContent = `점수: ${score}`;
    clearInterval(timerInterval);
    timerDisplay.textContent = "걸린 시간: 0초";
}

// JSON 파일에서 질문 로드 함수
async function loadQuestions() {
    if (questionsData.easy.length > 0 || questionsData.medium.length > 0 || questionsData.hard.length > 0) {
        // 이미 로드된 경우 다시 로드하지 않음
        return;
    }
    const response = await fetch('questions.json');
    if (!response.ok) {
        throw new Error('JSON 파일을 불러오는 데 실패했습니다.');
    }
    const data = await response.json();
    questionsData = data;
    console.log("질문 데이터 로드됨:", questionsData);
}

// 난이도에 따른 랜덤 질문 선택 함수
function selectRandomQuestion() {
    const difficulty = difficultySelect.value;
    const questions = questionsData[difficulty];
    if (!questions || questions.length === 0) {
        alert(`선택된 난이도(${difficulty})에 사용할 수 있는 질문이 없습니다.`);
        return;
    }
    const randomIndex = Math.floor(Math.random() * questions.length);
    currentQuestion = questions[randomIndex];
    console.log("선택된 질문:", currentQuestion);
}

// 시퀀스 표시 함수
function displaySequence() {
    if (!currentQuestion) return;
    sequenceElement.textContent = currentQuestion.sequence;
}

// 정답 제출 함수
submitAnswerButton.addEventListener("click", () => {
    if (!currentQuestion) {
        alert("문제가 로드되지 않았습니다.");
        return;
    }
    const userAnswer = parseFloat(answerInput.value);
    if (isNaN(userAnswer)) {
        alert("숫자를 입력하세요!");
        return;
    }

    // 결과 메시지에 클래스 추가하여 애니메이션 적용
    if (userAnswer === currentQuestion.answer) {
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
    selectNewQuestion();
});

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
            console.error("기록 저장 실패:", error);
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
    db.collection("gameRecords")
        .where("difficulty", "==", difficulty) // 현재 난이도에 맞게 필터링
        .orderBy("score", "desc") // 점수 기준 내림차순 정렬
        .limit(10) // 상위 10개만 표시
        .get()
        .then((snapshot) => {
            recordTableBody.innerHTML = ""; // 기존 데이터 초기화

            if (snapshot.empty) {
                const tr = document.createElement("tr");
                const td = document.createElement("td");
                td.colSpan = 6;
                td.textContent = "기록이 없습니다.";
                tr.appendChild(td);
                recordTableBody.appendChild(tr);
            } else {
                let rank = 1;
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    const tr = document.createElement("tr");

                    const rankTd = document.createElement("td");
                    rankTd.textContent = rank;
                    tr.appendChild(rankTd);

                    const difficultyTd = document.createElement("td");
                    difficultyTd.textContent = data.difficulty;
                    tr.appendChild(difficultyTd);

                    const nameTd = document.createElement("td");
                    nameTd.textContent = data.name;
                    tr.appendChild(nameTd);

                    const scoreTd = document.createElement("td");
                    scoreTd.textContent = data.score;
                    tr.appendChild(scoreTd);

                    const timeTd = document.createElement("td");
                    timeTd.textContent = `${data.time}초`;
                    tr.appendChild(timeTd);

                    const dateTd = document.createElement("td");
                    dateTd.textContent = data.timestamp ? data.timestamp.toDate().toLocaleString() : "N/A";
                    tr.appendChild(dateTd);

                    recordTableBody.appendChild(tr);
                    rank++;
                });
            }

            recordSection.style.display = "block";
        })
        .catch((error) => {
            console.error("Firestore에서 기록 불러오기 실패:", error);
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

// 페이지 로드 시 게임 시작
window.onload = () => {
    generateGame();
};
