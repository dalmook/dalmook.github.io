// voidscript.js

import { db } from './voidfirebaseConfig.js';
import { collection, addDoc, Timestamp, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Canvas 설정
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// 화면 크기 설정 (모바일 세로 화면에 최적화)
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 캐릭터 이미지 로드
const characterImg = new Image();
characterImg.src = 'images/힘내.webp'; // 사용자가 만든 캐릭터 이미지 경로

// 빗방울 이미지 로드
const raindropImg = new Image();
raindropImg.src = 'images/raindrop.png'; // 빗방울 이미지 경로

// 오디오 설정
const bgMusic = new Audio('audio/background.mp3');
bgMusic.loop = true;
const collisionSound = new Audio('audio/collision.mp3');

// 게임 변수
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
let lastRaindropTime = Date.now();

let score = 0;
let scoreInterval = 1000; // 1초마다 점수 증가
let lastScoreTime = Date.now();

let gameOver = false;

// 이벤트 리스너 설정
document.getElementById('left-button').addEventListener('touchstart', () => { character.movingLeft = true; });
document.getElementById('left-button').addEventListener('touchend', () => { character.movingLeft = false; });
document.getElementById('right-button').addEventListener('touchstart', () => { character.movingRight = true; });
document.getElementById('right-button').addEventListener('touchend', () => { character.movingRight = false; });

document.getElementById('view-record-button').addEventListener('click', () => {
    displayRecords();
    document.getElementById('record-section').classList.remove('hidden');
});

document.getElementById('close-record').addEventListener('click', () => {
    document.getElementById('record-section').classList.add('hidden');
});

document.getElementById('restart-button')?.addEventListener('click', () => {
    resetGameVariables();
    gameOver = false;
    document.getElementById('record-section').classList.add('hidden');
    document.getElementById('restart-button').classList.add('hidden');
    bgMusic.currentTime = 0;
    bgMusic.play();
    gameLoop();
});

// 터치 이동 제스처 처리 (스와이프)
let touchStartX = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, false);

document.addEventListener('touchend', (e) => {
    let touchEndX = e.changedTouches[0].screenX;
    let deltaX = touchEndX - touchStartX;

    if (deltaX > 50) { // 오른쪽 스와이프
        character.movingRight = true;
        character.movingLeft = false;
    } else if (deltaX < -50) { // 왼쪽 스와이프
        character.movingLeft = true;
        character.movingRight = false;
    }
}, false);

// 게임 루프
function gameLoop() {
    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    }

    update();
    render();
}

// 업데이트 함수
function update() {
    const currentTime = Date.now();

    // 캐릭터 이동
    if (character.movingLeft && character.x > 0) {
        character.x -= character.speed;
    }
    if (character.movingRight && character.x + character.width < canvas.width) {
        character.x += character.speed;
    }

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
        lastRaindropTime = currentTime;
    }

    // 빗방울 이동
    raindrops.forEach((raindrop, index) => {
        raindrop.y += raindrop.speed;

        // 충돌 감지
        if (isColliding(character, raindrop)) {
            gameOver = true;
            stopGame();
        }

        // 화면을 벗어난 빗방울 제거
        if (raindrop.y > canvas.height) {
            raindrops.splice(index, 1);
        }
    });

    // 점수 업데이트
    if (currentTime - lastScoreTime > scoreInterval) {
        score++;
        document.getElementById('score-display').innerText = `시간: ${score}초`;
        lastScoreTime = currentTime;

        // 난이도 상승 (빗방울 생성 간격 감소)
        if (raindropInterval > 300) { // 최소 간격 설정
            raindropInterval -= 10; // 점점 더 빠르게 빗방울 생성
        }

        // 빗방울 속도 증가
        raindrops.forEach(raindrop => {
            raindrop.speed = 5 + score / 10;
        });
    }
}

// 렌더링 함수
function render() {
    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 캐릭터 그리기
    if (characterImg.complete) {
        ctx.drawImage(characterImg, character.x, character.y, character.width, character.height);
    }

    // 빗방울 그리기
    raindrops.forEach(raindrop => {
        if (raindropImg.complete) {
            let imgSrc = 'images/raindrop.png';
            if (raindrop.type === 'large') {
                imgSrc = 'images/raindrop_large.png'; // 추가 빗방울 이미지
            }
            const raindropImage = new Image();
            raindropImage.src = imgSrc;
            ctx.drawImage(raindropImage, raindrop.x, raindrop.y, raindrop.width, raindrop.height);
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
    collisionSound.play();
    bgMusic.pause();
    alert(`게임 오버! 걸린 시간: ${score}초`);

    // 기록 저장
    try {
        await addDoc(collection(db, "gameRecords"), {
            score: score,
            timestamp: Timestamp.now()
        });
        console.log("기록이 Firestore에 저장되었습니다.");
    } catch (e) {
        console.error("기록 저장 실패:", e);
    }

    // 재시작 버튼 표시
    document.getElementById('restart-button').classList.remove('hidden');
}

// 기록 표시 함수
async function displayRecords() {
    const recordList = document.getElementById('record-list');
    recordList.innerHTML = ''; // 기존 기록 초기화

    // Firestore에서 상위 10개 기록 가져오기 (시간이 긴 순으로)
    const q = query(collection(db, "gameRecords"), orderBy("score", "desc"), limit(10));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        const li = document.createElement('li');
        li.textContent = "기록이 없습니다.";
        recordList.appendChild(li);
    } else {
        querySnapshot.forEach((doc, index) => {
            const data = doc.data();
            const li = document.createElement('li');
            const date = data.timestamp.toDate().toLocaleString();
            li.textContent = `${index + 1}. ${data.score}초 - ${date}`;
            recordList.appendChild(li);
        });
    }
}

// 게임 초기화 함수
function init() {
    // 게임 루프 시작
    gameLoop();

    // 화면 크기 변경 시 캔버스 크기 조정
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        character.y = canvas.height - 150; // 캐릭터 위치 재설정
    });

    // 게임 시작 시 배경 음악 재생 및 시작 화면 숨기기
    document.getElementById('start-game-button').addEventListener('click', () => {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        bgMusic.play();
        resetGameVariables();
        gameLoop();
    });
}

// 게임 재시작 시 변수 초기화 함수
function resetGameVariables() {
    raindrops = [];
    raindropInterval = 1000;
    lastRaindropTime = Date.now();
    score = 0;
    document.getElementById('score-display').innerText = `시간: 0초`;
    lastScoreTime = Date.now();
}

// 게임 시작
init();
