// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyCkhLwa7X5PEHa_rjhSfTSlyvsc8DrnuaU",
    authDomain: "saltfather-fd901.firebaseapp.com",
    projectId: "saltfather-fd901",
    storageBucket: "saltfather-fd901.firebasestorage.app",
    messagingSenderId: "508342774249",
    appId: "1:508342774249:web:a860fdeeff162b8027c378"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const head = document.getElementById('head');
const flakesContainer = document.getElementById('flakes-container');
const accumulatedFlakesContainer = document.getElementById('accumulated-flakes-container'); // 누적 비듬 컨테이너
const timeDisplay = document.getElementById('time');
const scoreDisplay = document.getElementById('score');
const nameInputModal = document.getElementById('name-input-modal'); // 모달 요소
const submitNameBtn = document.getElementById('submit-name');
const playerNameInput = document.getElementById('player-name');
const leaderboardList = document.getElementById('leaderboard-list');

let timeLeft = 10;
let score = 0;
let gameActive = false;
let timerInterval;

// 비듬 쌓임 위치 추적을 위한 간단한 배열
const accumulatedPositions = [];

// 게임 시작 시 초기화
function startGame() {
    timeLeft = 10;
    score = 0;
    gameActive = true;
    timeDisplay.textContent = timeLeft;
    scoreDisplay.textContent = score.toFixed(2);
    nameInputModal.classList.add('hidden'); // 모달 숨기기
    leaderboardList.innerHTML = '';
    // 누적된 비듬을 초기화
    accumulatedFlakesContainer.innerHTML = '';
    accumulatedPositions.length = 0;
    startTimer();
}

// 타이머 시작
function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        timeDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

// 게임 종료
function endGame() {
    clearInterval(timerInterval);
    gameActive = false;
    showNameInputModal();
    fetchLeaderboard();
}

// 비듬 생성
function createFlake() {
    const flake = document.createElement('div');
    flake.classList.add('flake');
    flake.style.left = Math.random() * 100 + '%';
    flake.style.animationDuration = 1 + Math.random() * 1 + 's';
    flakesContainer.appendChild(flake);

    flake.addEventListener('animationend', () => {
        flakesContainer.removeChild(flake);
        accumulateFlake(flake);
    });
}

// 비듬 누적
function accumulateFlake(flake) {
    const accumulatedFlake = document.createElement('div');
    accumulatedFlake.classList.add('accumulated-flake');

    // 랜덤한 x 위치 설정
    const xPos = Math.random() * (accumulatedFlakesContainer.clientWidth - 10); // 비듬 크기 고려
    accumulatedFlake.style.left = `${xPos}px`;

    // 현재 쌓인 높이에 따라 y 위치 설정
    const gridSize = 10; // 그리드 크기 (x축을 몇 픽셀 간격으로 나눌지)
    const gridIndex = Math.floor(xPos / gridSize);
    const currentHeight = accumulatedPositions[gridIndex] || 0;
    accumulatedFlake.style.bottom = `${currentHeight}px`;

    // 높이 업데이트
    accumulatedPositions[gridIndex] = currentHeight + 10; // 비듬 높이만큼 추가

    accumulatedFlakesContainer.appendChild(accumulatedFlake);
}

// 머리 흔들기
function shakeHead() {
    head.classList.add('shake');
    head.addEventListener('animationend', () => {
        head.classList.remove('shake');
    }, { once: true });
}

// 모달 표시
function showNameInputModal() {
    nameInputModal.classList.remove('hidden');
    // 입력 필드에 포커스
    playerNameInput.focus();
}

// 터치/클릭 이벤트 처리
head.addEventListener('click', () => {
    // 게임이 활성화 되어 있고, 모달이 숨겨져 있을 때만 터치 허용
    if (!gameActive || !nameInputModal.classList.contains('hidden')) {
        return;
    }
    score += 0.01; // 0.01kg per touch
    scoreDisplay.textContent = score.toFixed(2);
    shakeHead();
    createFlake();
});

// 이름 제출
submitNameBtn.addEventListener('click', () => {
    const name = playerNameInput.value.trim();
    if (name === "") {
        alert("이름을 입력해주세요.");
        return;
    }
    // Firestore에 기록 저장
    db.collection('scores').add({
        name: name,
        score: parseFloat(score.toFixed(2)),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("기록이 저장되었습니다!");
        nameInputModal.classList.add('hidden');
        startGame();
    }).catch((error) => {
        console.error("Error adding document: ", error);
    });
});

// 리더보드 가져오기
function fetchLeaderboard() {
    db.collection('scores')
        .orderBy('score', 'desc')
        .limit(10)
        .get()
        .then((querySnapshot) => {
            leaderboardList.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const li = document.createElement('li');
                li.textContent = `${data.name}: ${data.score} kg`;
                leaderboardList.appendChild(li);
            });
        })
        .catch((error) => {
            console.error("Error fetching leaderboard: ", error);
        });
}

// 게임 초기 시작
startGame();
