// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyCwVxx0Pxd7poc_zGSp1aY9qfd89bpVUW0",
    authDomain: "finddalbong.firebaseapp.com",
    projectId: "finddalbong",
    storageBucket: "finddalbong.appspot.com", // 일반적으로 storageBucket은 .appspot.com 형식입니다.
    messagingSenderId: "982765399272",
    appId: "1:982765399272:web:02344ab408272c60e2ad5d"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Firestore 초기화
const db = firebase.firestore();

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

    // 현재 표시 크기와 원래 크기의 비율
    const scaleX = gameImage.naturalWidth / rect.width;
    const scaleY = gameImage.naturalHeight / rect.height;

    // 클릭 위치를 원래 크기 기준으로 변환
    const clickX = Math.round((event.clientX - rect.left) * scaleX);
    const clickY = Math.round((event.clientY - rect.top) * scaleY);

    console.log(`Clicked coordinates (original size): (${clickX}, ${clickY})`);

    for (let obj of remainingObjects) {
        const { x, y, width, height, name } = obj;

        // 여유 범위 설정 (픽셀 단위로 확장)
        const margin = 20; // 클릭 가능 영역에 추가할 여유 픽셀

        // 객체 영역 계산 (여유 포함)
        const adjustedX = x - margin;
        const adjustedY = y - margin;
        const adjustedWidth = width + margin * 2;
        const adjustedHeight = height + margin * 2;

        console.log(`Object ${name}: (${adjustedX}, ${adjustedY}, ${adjustedWidth}, ${adjustedHeight})`);

        if (
            clickX >= adjustedX &&
            clickX <= adjustedX + adjustedWidth &&
            clickY >= adjustedY &&
            clickY <= adjustedY + adjustedHeight
        ) {
            alert(`${name}을(를) 찾았습니다!`);
            markFound(name, x, y, width, height, scaleX, scaleY);
            remainingObjects = remainingObjects.filter(o => o.name !== name);
            if (remainingObjects.length === 0) {
                endGame();
            }
            break;
        }
    }
}

function markFound(name, x, y, width, height, scaleX, scaleY) {
    // 객체 목록에서 제거 또는 표시
    const items = objectsToFindList.querySelectorAll('li');
    items.forEach(item => {
        if (item.dataset.name === name) {
            item.style.textDecoration = 'line-through';
            item.style.color = 'gray';
        }
    });

    // 마커 표시 (스케일 반영)
    const foundMarker = document.createElement('div');
    foundMarker.classList.add('found-marker');
    foundMarker.style.left = `${x * scaleX}px`;
    foundMarker.style.top = `${y * scaleY}px`;
    foundMarker.style.width = `${width * scaleX}px`;
    foundMarker.style.height = `${height * scaleY}px`;
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
    const playerName = document.getElementById("playerName").value.trim();
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);

    if (playerName) {
        // Firestore에 데이터 저장
        db.collection(`rankings_${currentDifficulty}`)
            .add({
                name: playerName,
                time: elapsedTime,
                date: new Date().toISOString()
            })
            .then(() => {
                alert('기록이 저장되었습니다!');
            })
            .catch((error) => {
                console.error('Firestore 저장 오류:', error.message);
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

function fetchRankings(difficulty) {
    db.collection(`rankings_${difficulty}`)
        .orderBy('time', 'asc') // 시간 기준 오름차순 정렬
        .limit(10) // 상위 10개 기록만 표시
        .get()
        .then((querySnapshot) => {
            const rankingsList = document.getElementById("rankingsList");
            rankingsList.innerHTML = ""; // 기존 데이터 초기화

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const li = document.createElement("li");
                li.textContent = `${data.name} - ${data.time}초 (${data.date})`;
                rankingsList.appendChild(li);
            });
        })
        .catch((error) => {
            console.error('Firestore 조회 오류:', error.message);
        });
}

// 예제 호출
document.getElementById('viewRankings').addEventListener('click', () => {
    fetchRankings(currentDifficulty);
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
