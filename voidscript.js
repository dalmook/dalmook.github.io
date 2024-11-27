// voidscript.js

import { db } from './voidfirebaseConfig.js';
import { collection, addDoc, Timestamp, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Canvas 설정
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

console.log("Canvas 요소 로드 완료.");

// 화면 크기 설정 (모바일 세로 화면에 최적화)
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

console.log(`Canvas 크기 설정: ${canvas.width}x${canvas.height}`);

// 캐릭터 이미지 로드
const characterImg = new Image();
characterImg.src = 'images/character.png'; // 사용자가 만든 캐릭터 이미지 경로

// 빗방울 이미지 로드
const raindropImg = new Image();
raindropImg.src = 'images/raindrop.png'; // 빗방울 이미지 경로

// 추가 빗방울 이미지 로드 (필요 시)
const raindropLargeImg = new Image();
raindropLargeImg.src = 'images/raindrop_large.png'; // 큰 빗방울 이미지 경로

console.log("이미지 로드 시작.");

// 오디오 설정
const bgMusic = new Audio('audio/background.mp3');
bgMusic.loop = true;
const collisionSound = new Audio('audio/collision.mp3');

console.log("오디오 설정 완료.");

// 이미지 로딩 상태 추적
let imagesLoaded = 0;
const totalImages = 3; // characterImg, raindropImg, raindropLargeImg

function imageLoaded() {
    imagesLoaded++;
    console.log(`이미지 로드 완료: ${imagesLoaded}/${totalImages}`);
    if (imagesLoaded === totalImages) {
        console.log("모든 이미지가 로드되었습니다.");
        // 모든 이미지가 로드된 후 게임 초기화
        init();
    }
}

function imageError(imageName) {
    console.error(`${imageName} 이미지를 로드할 수 없습니다.`);
}

characterImg.onload = () => imageLoaded();
characterImg.onerror = () => imageError("character.png");

raindropImg.onload = () => imageLoaded();
raindropImg.onerror = () => imageError("raindrop.png");

raindropLargeImg.onload = () => imageLoaded();
raindropLargeImg.onerror = () => imageError("raindrop_large.png");

// 게임 변수 초기화
let character = {
    x: canvas.width / 2 - 50, // 초기 위치 (가로 중앙)
    y: canvas.height - 150,    // 화면 하단
    width: 100,
    height: 100,
    speed: 10,
    movingLeft: false,
    movingRight: false
};

let raindrops = [];
let raindropInterval = 1000; // 밀리초 단위로 빗방울 생성 간격
let lastRaindropTime = Date.now() + 2000; // 초기 빗방울 생성 2초 후

let score = 0;
let scoreInterval = 1000; // 1초마다 점수 증가
let lastScoreTime = Date.now();

let gameOver = false;

// 게임 루프 플래그
let isGameLoopRunning = false;

// 드래그 상태 변수
let isDragging = false;
let dragStartX = 0;

// 이벤트 리스너 설정
document.getElementById('view-record-button').addEventListener('click', () => {
    console.log("기록 보기 버튼 클릭.");
    displayRecords();
    document.getElementById('record-section').classList.remove('hidden');
});

document.getElementById('close-record').addEventListener('click', () => {
    console.log("기록 닫기 버튼 클릭.");
    document.getElementById('record-section').classList.add('hidden');
});

document.getElementById('restart-button')?.addEventListener('click', () => {
    console.log("재시작 버튼 클릭.");
    resetGameVariables();
    gameOver = false;
    document.getElementById('record-section').classList.add('hidden');
    document.getElementById('restart-button').classList.add('hidden');
    bgMusic.currentTime = 0;
    bgMusic.play().then(() => {
        console.log("배경 음악 재생 시작.");
    }).catch(error => {
        console.error("배경 음악 재생 실패:", error);
    });
    isGameLoopRunning = false; // 게임 루프 플래그 초기화
    gameLoop();
});

// 드래그 기반 이동 구현

// PC용 마우스 이벤트
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    console.log("마우스 드래그 시작.");
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        let deltaX = e.clientX - dragStartX;
        character.x += deltaX;
        // 캐릭터가 화면을 벗어나지 않도록 제한
        if (character.x < 0) character.x = 0;
        if (character.x + character.width > canvas.width) character.x = canvas.width - character.width;
        dragStartX = e.clientX;
        console.log(`마우스 드래그 중: x=${character.x}`);
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    console.log("마우스 드래그 종료.");
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
    console.log("마우스가 캔버스를 벗어남, 드래그 종료.");
});

// 모바일용 터치 이벤트
canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) { // 단일 터치만 처리
        isDragging = true;
        dragStartX = e.touches[0].clientX;
        console.log("터치 드래그 시작.");
    }
});

canvas.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches.length === 1) {
        let deltaX = e.touches[0].clientX - dragStartX;
        character.x += deltaX;
        // 캐릭터가 화면을 벗어나지 않도록 제한
        if (character.x < 0) character.x = 0;
        if (character.x + character.width > canvas.width) character.x = canvas.width - character.width;
        dragStartX = e.touches[0].clientX;
        console.log(`터치 드래그 중: x=${character.x}`);
    }
});

canvas.addEventListener('touchend', () => {
    isDragging = false;
    console.log("터치 드래그 종료.");
});

canvas.addEventListener('touchcancel', () => {
    isDragging = false;
    console.log("터치가 취소됨, 드래그 종료.");
});

// 기존 터치 스와이프 이벤트 제거
/*
canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    console.log(`캔버스 터치 시작 X: ${touchStartX}`);
}, false);

canvas.addEventListener('touchend', (e) => {
    let touchEndX = e.changedTouches[0].screenX;
    let deltaX = touchEndX - touchStartX;
    console.log(`캔버스 터치 종료 X: ${touchEndX}, deltaX: ${deltaX}`);

    if (deltaX > 50) { // 오른쪽 스와이프
        character.movingRight = true;
        character.movingLeft = false;
        console.log("오른쪽 스와이프 감지.");
    } else if (deltaX < -50) { // 왼쪽 스와이프
        character.movingLeft = true;
        character.movingRight = false;
        console.log("왼쪽 스와이프 감지.");
    }

    // 스와이프 후 즉시 멈추도록 설정
    setTimeout(() => {
        character.movingLeft = false;
        character.movingRight = false;
        console.log("캐릭터 이동 멈춤.");
    }, 200); // 200ms 후 멈춤
});
*/

// 게임 루프
function gameLoop() {
    if (isGameLoopRunning) {
        console.log("게임 루프 이미 실행 중.");
        return; // 게임 루프가 이미 실행 중이라면 중복 실행 방지
    }

    isGameLoopRunning = true;
    console.log("게임 루프 시작.");
    requestAnimationFrame(loop);
}

function loop() {
    if (!gameOver) {
        requestAnimationFrame(loop);
    }

    update();
    render();
}

// 업데이트 함수
function update() {
    const currentTime = Date.now();

    // 빗방울 생성
    if (currentTime - lastRaindropTime > raindropInterval) {
        raindrops.push({
            x: Math.random() * (canvas.width - 50),
            y: -50,
            width: 50,
            height: 50,
            speed: 5 + score / 10, // 난이도 상승에 따른 속도 증가
            type: Math.random() > 0.5 ? 'small' : 'large' // 빗방울 종류 추가
        });
        console.log("빗방울 생성.");
        lastRaindropTime = currentTime;
    }

    // 빗방울 이동
    raindrops.forEach((raindrop, index) => {
        raindrop.y += raindrop.speed;

        // 충돌 감지
        if (isColliding(character, raindrop)) {
            console.log(`충돌 감지! 캐릭터 위치: (${character.x}, ${character.y}, ${character.width}, ${character.height}), 빗방울 위치: (${raindrop.x}, ${raindrop.y}, ${raindrop.width}, ${raindrop.height})`);
            gameOver = true;
            stopGame();
        }

        // 화면을 벗어난 빗방울 제거
        if (raindrop.y > canvas.height) {
            raindrops.splice(index, 1);
            console.log("빗방울 제거.");
        }
    });

    // 점수 업데이트
    if (currentTime - lastScoreTime > scoreInterval) {
        score++;
        document.getElementById('score-display').innerText = `시간: ${score}초`;
        console.log(`점수 업데이트: ${score}초`);
        lastScoreTime = currentTime;

        // 난이도 상승 (빗방울 생성 간격 감소)
        if (raindropInterval > 300) { // 최소 간격 설정
            raindropInterval -= 10; // 점점 더 빠르게 빗방울 생성
            console.log(`빗방울 생성 간격 감소: ${raindropInterval}ms`);
        }

        // 빗방울 속도 증가
        raindrops.forEach(raindrop => {
            raindrop.speed = 5 + score / 10;
        });
    }

    // 빗방울 배열 상태 로그
    console.log(`현재 빗방울 개수: ${raindrops.length}`);
}

// 렌더링 함수
function render() {
    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 캐릭터 그리기
    if (characterImg.complete) {
        ctx.drawImage(characterImg, character.x, character.y, character.width, character.height);
    } else {
        console.log("캐릭터 이미지 로드 대기 중.");
    }

    // 빗방울 그리기
    raindrops.forEach(raindrop => {
        if (raindrop.type === 'small' && raindropImg.complete) {
            ctx.drawImage(raindropImg, raindrop.x, raindrop.y, raindrop.width, raindrop.height);
        } else if (raindrop.type === 'large' && raindropLargeImg.complete) {
            ctx.drawImage(raindropLargeImg, raindrop.x, raindrop.y, raindrop.width, raindrop.height);
        } else {
            console.log(`빗방울 이미지 로드 대기 중: type=${raindrop.type}`);
        }
    });
}

// 충돌 감지 함수
function isColliding(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// 게임 종료 함수
async function stopGame() {
    try {
        await collisionSound.play();
        console.log("충돌 효과음 재생.");
    } catch (error) {
        console.error("충돌 효과음 재생 실패:", error);
    }
    bgMusic.pause();
    console.log("배경 음악 일시 정지.");

    // 이름 입력 모달 표시
    showNameModal();
}

// 기록 표시 함수
async function displayRecords() {
    console.log("기록 표시 함수 호출.");
    const recordList = document.getElementById('record-list');
    recordList.innerHTML = ''; // 기존 기록 초기화

    // Firestore에서 상위 10개 기록 가져오기 (시간이 긴 순으로)
    const q = query(collection(db, "gameRecords"), orderBy("score", "desc"), limit(10));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        const li = document.createElement('li');
        li.textContent = "기록이 없습니다.";
        recordList.appendChild(li);
        console.log("기록 없음.");
    } else {
        querySnapshot.forEach((doc, index) => {
            const data = doc.data();
            const li = document.createElement('li');
            const date = data.timestamp.toDate().toLocaleString();
            li.textContent = `${index + 1}. ${data.name} - ${data.score}초 - ${date}`;
            recordList.appendChild(li);
            console.log(`기록 추가: ${li.textContent}`);
        });
    }
}

// 이름 입력 모달 제어
const nameModal = document.getElementById('name-modal');
const closeModalButton = document.getElementById('close-modal');
const submitNameButton = document.getElementById('submit-name');
const playerNameInput = document.getElementById('player-name');

// 모달 표시 함수
function showNameModal() {
    nameModal.classList.remove('hidden');
    // 모달이 표시되면 게임 루프 정지
    isGameLoopRunning = false;
    console.log("이름 입력 모달 표시.");
}

// 모달 숨기기 함수
function hideNameModal() {
    nameModal.classList.add('hidden');
    playerNameInput.value = ''; // 입력 필드 초기화
    console.log("이름 입력 모달 숨김.");
}

// 모달 닫기 버튼 이벤트 리스너
closeModalButton.addEventListener('click', () => {
    hideNameModal();
    // 재시작 버튼 표시
    document.getElementById('restart-button').classList.remove('hidden');
    console.log("모달 닫기 버튼 클릭, 재시작 버튼 표시.");
});

// 이름 저장 버튼 이벤트 리스너
submitNameButton.addEventListener('click', async () => {
    const playerName = playerNameInput.value.trim();
    if (playerName === '') {
        alert('이름을 입력해주세요.');
        return;
    }

    // Firestore에 기록 저장
    try {
        await addDoc(collection(db, "gameRecords"), {
            name: playerName, // 플레이어 이름
            score: score,      // 점수 (시간)
            timestamp: Timestamp.now() // 저장 시간
        });
        console.log("기록이 Firestore에 저장되었습니다.");
    } catch (e) {
        console.error("기록 저장 실패:", e);
    }

    // 모달 숨기기
    hideNameModal();

    // 재시작 버튼 표시
    document.getElementById('restart-button').classList.remove('hidden');
    console.log("이름 저장 후 재시작 버튼 표시.");
});

// 게임 초기화 함수
function init() {
    console.log("init() 함수 호출.");
    // 화면 크기 변경 시 캔버스 크기 조정
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        character.y = canvas.height - 150; // 캐릭터 위치 재설정
        console.log(`화면 크기 변경: ${canvas.width}x${canvas.height}`);
    });

    // 게임 시작 시 배경 음악 재생 및 시작 화면 숨기기
    document.getElementById('start-game-button').addEventListener('click', () => {
        console.log("게임 시작 버튼 클릭 이벤트 트리거.");
        const startScreen = document.getElementById('start-screen');
        const gameContainer = document.getElementById('game-container');
        
        // 직접 display 속성 변경
        startScreen.style.display = 'none';
        gameContainer.style.display = 'block';
        console.log("start-screen을 숨기고 game-container를 표시.");

        bgMusic.play().then(() => {
            console.log("배경 음악 재생 성공.");
        }).catch(error => {
            console.error("배경 음악 재생 실패:", error);
        });
        resetGameVariables();
        gameLoop();
    });
}

// 게임 재시작 시 변수 초기화 함수
function resetGameVariables() {
    console.log("게임 변수 초기화.");
    raindrops = [];
    raindropInterval = 1000;
    lastRaindropTime = Date.now() + 2000; // 2초 후 빗방울 생성 시작
    score = 0;
    document.getElementById('score-display').innerText = `시간: ${score}초`;
    lastScoreTime = Date.now();
    // 게임 루프 플래그 초기화
    isGameLoopRunning = false;
}

// 이름 입력 모달 숨기기 초기 설정
hideNameModal();
