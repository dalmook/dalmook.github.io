// Firebase 설정
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const head = document.getElementById('head');
const flakesContainer = document.getElementById('flakes-container');
const accumulatedFlakesContainer = document.getElementById('accumulated-flakes-container'); // 누적 비듬 컨테이너
const timeDisplay = document.getElementById('time');
const scoreDisplay = document.getElementById('score');
const nameInputContainer = document.getElementById('name-input-container');
const submitNameBtn = document.getElementById('submit-name');
const playerNameInput = document.getElementById('player-name');
const leaderboardList = document.getElementById('leaderboard-list');

let timeLeft = 10;
let score = 0;
let gameActive = false;
let timerInterval;

// 비듬 쌓임 위치 추적을 위한 간단한 배열
const accumulatedPositions = [];

function startGame() {
    timeLeft = 10;
    score = 0;
    gameActive = true;
    timeDisplay.textContent = timeLeft;
    scoreDisplay.textContent = score;
    nameInputContainer.classList.add('hidden');
    leaderboardList.innerHTML = '';
    // 누적된 비듬을 초기화
    accumulatedFlakesContainer.innerHTML = '';
    accumulatedPositions.length = 0;
    startTimer();
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        timeDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame() {
    clearInterval(timerInterval);
    gameActive = false;
    nameInputContainer.classList.remove('hidden');
    fetchLeaderboard();
}

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

function accumulateFlake(flake) {
    const accumulatedFlake = document.createElement('div');
    accumulatedFlake.classList.add('accumulated-flake');

    // 랜덤한 x 위치 설정
    const xPos = Math.random() * (accumulatedFlakesContainer.clientWidth - 10); // 비듬 크기 고려
    accumulatedFlake.style.left = `${xPos}px`;

    // 현재 쌓인 높이에 따라 y 위치 설정
    const currentHeight = accumulatedPositions[Math.floor(xPos / 10)] || 0;
    accumulatedFlake.style.bottom = `${currentHeight}px`;

    // 높이 업데이트
    accumulatedPositions[Math.floor(xPos / 10)] = currentHeight + 10; // 비듬 높이만큼 추가

    accumulatedFlakesContainer.appendChild(accumulatedFlake);
}

function shakeHead() {
    head.classList.add('shake');
    head.addEventListener('animationend', () => {
        head.classList.remove('shake');
    }, { once: true });
}

head.addEventListener('click', () => {
    if (!gameActive) {
        startGame();
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
        nameInputContainer.classList.add('hidden');
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
