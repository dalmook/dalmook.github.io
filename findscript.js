// findscript.js

// Firebase 설정
// Firebase 콘솔에서 프로젝트를 생성하고 아래 설정을 채워 넣으세요.
const firebaseConfig = {
    apiKey: "AIzaSyCwVxx0Pxd7poc_zGSp1aY9qfd89bpVUW0",
    authDomain: "finddalbong.firebaseapp.com",
    projectId: "finddalbong",
    storageBucket: "finddalbong.firebasestorage.app",
    messagingSenderId: "982765399272",
    appId: "1:982765399272:web:02344ab408272c60e2ad5d"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// DOM 요소 가져오기
const difficultySelect = document.getElementById('difficulty');
const startButton = document.getElementById('startGame');
const gameArea = document.getElementById('gameArea');
const gameImage = document.getElementById('gameImage');
const objectsToFindList = document.getElementById('objectsToFind');
const objectListDiv = document.getElementById('objectList');
const timerDiv = document.getElementById('timer');
const timeSpan = document.getElementById('time');
const nameModal = document.getElementById('nameModal');
const overlay = document.getElementById('overlay');
const submitNameButton = document.getElementById('submitName');
const closeModalButton = document.getElementById('closeModal');

let findingData = {};
let currentDifficulty = '';
let currentImage = {};
let startTime;
let timerInterval;
let remainingObjects = [];

// 게임 시작 버튼 클릭 시
startButton.addEventListener('click', () => {
    currentDifficulty = difficultySelect.value;
    if (!currentDifficulty) {
        alert('난이도를 선택해주세요!');
        return;
    }

    fetch('findimg.json')  // 파일 이름 변경
        .then(response => response.json())
        .then(data => {
            findingData = data;
            startGame();
        })
        .catch(error => {
            console.error('Error fetching findimg.json:', error);
        });
});

function startGame() {
    // 난이도별 이미지 중 랜덤 선택
    const images = findingData[currentDifficulty];
    if (!images || images.length === 0) {
        alert('해당 난이도에 사용할 이미지가 없습니다.');
        return;
    }
    currentImage = images[Math.floor(Math.random() * images.length)];

    // 이미지 설정
    gameImage.src = currentImage.image;
    gameArea.style.display = 'block';
    objectListDiv.style.display = 'block';
    timerDiv.style.display = 'block';

    // 이미지가 완전히 로드된 후 실행
    gameImage.onload = () => {
        // 객체 목록 표시
        objectsToFindList.innerHTML = '';
        remainingObjects = [...currentImage.objects];
        remainingObjects.forEach(obj => {
            const li = document.createElement('li');
            li.textContent = obj.name;
            li.dataset.name = obj.name;
            objectsToFindList.appendChild(li);
        });

        // 타이머 시작
        startTime = Date.now();
        timeSpan.textContent = '0';
        timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            timeSpan.textContent = elapsed;
        }, 1000);

        // 이미지 클릭 이벤트 설정
        gameImage.addEventListener('click', handleImageClick);
    };
}

function handleImageClick(event) {
    const rect = gameImage.getBoundingClientRect();
    const scaleX = gameImage.naturalWidth / rect.width;
    const scaleY = gameImage.naturalHeight / rect.height;

    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;

    console.log(`Clicked coordinates: (${clickX}, ${clickY})`); // 클릭 좌표 로그

    // 클릭 위치가 숨은 객체와 일치하는지 확인
    for (let obj of remainingObjects) {
        // 상대 좌표를 절대 좌표로 변환
        const objX = obj.x * gameImage.naturalWidth;
        const objY = obj.y * gameImage.naturalHeight;
        const objWidth = obj.width * gameImage.naturalWidth;
        const objHeight = obj.height * gameImage.naturalHeight;

        console.log(`Object ${obj.name}: (${objX}, ${objY}, ${objWidth}, ${objHeight})`); // 객체 좌표 로그

        if (
            clickX >= objX &&
            clickX <= objX + objWidth &&
            clickY >= objY &&
            clickY <= objY + objHeight
        ) {
            // 객체 찾기 성공
            alert(`${obj.name}을(를) 찾았습니다!`);
            markFound(name = obj.name, x = obj.x, y = obj.y, width = obj.width, height = obj.height);
            remainingObjects = remainingObjects.filter(o => o.name !== obj.name);
            if (remainingObjects.length === 0) {
                endGame();
            }
            break;
        }
    }
}

function markFound(name, x, y, width, height) {
    // 객체 목록에서 제거 또는 표시
    const items = objectsToFindList.querySelectorAll('li');
    items.forEach(item => {
        if (item.dataset.name === name) {
            item.style.textDecoration = 'line-through';
            item.style.color = 'gray';
        }
    });

    // 빨간색 동그라미 표시
    const foundMarker = document.createElement('div');
    foundMarker.classList.add('found-marker');
    // 이미지의 표시 크기에 맞게 상대 좌표로 위치 조정
    const displayWidth = gameImage.clientWidth;
    const displayHeight = gameImage.clientHeight;

    const left = x * displayWidth;
    const top = y * displayHeight;

    foundMarker.style.left = `${left}px`;
    foundMarker.style.top = `${top}px`;
    gameArea.appendChild(foundMarker);
}

function endGame() {
    // 타이머 중지
    clearInterval(timerInterval);

    // 게임 이미지 클릭 이벤트 제거
    gameImage.removeEventListener('click', handleImageClick);

    // 이름 입력 모달 표시
    overlay.style.display = 'block';
    nameModal.style.display = 'block';
}

submitNameButton.addEventListener('click', () => {
    const playerName = document.getElementById('playerName').value.trim();
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);

    if (playerName) {
        // Firebase에 기록 저장
        const newRecordRef = database.ref(`rankings/${currentDifficulty}`).push();
        newRecordRef.set({
            name: playerName,
            time: elapsedTime,
            date: new Date().toISOString()
        })
        .then(() => {
            alert('랭킹에 등록되었습니다!');
        })
        .catch(error => {
            console.error('Error saving to Firebase:', error);
        });
    }

    // 모달 닫기
    nameModal.style.display = 'none';
    overlay.style.display = 'none';
    resetGame();
});

closeModalButton.addEventListener('click', () => {
    // 모달 닫기
    nameModal.style.display = 'none';
    overlay.style.display = 'none';
    resetGame();
});

function resetGame() {
    // 게임 초기화
    gameArea.style.display = 'none';
    objectListDiv.style.display = 'none';
    timerDiv.style.display = 'none';
    objectsToFindList.innerHTML = '';
    gameArea.innerHTML = `<img src="" id="gameImage" alt="숨은 그림 찾기 이미지">`;

    // 타이머 초기화
    clearInterval(timerInterval);
    timeSpan.textContent = '0';

    // 이름 입력 초기화
    document.getElementById('playerName').value = '';

    // 다시 시작할 수 있도록 난이도 선택 표시
    difficultySelect.value = '';
}
