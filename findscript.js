// findscript.js

// Firebase가 findfirebaseconfig.js에서 이미 초기화되었으므로 별도의 초기화 코드를 제거

// DOM 요소 가져오기
const difficultySelect = document.getElementById('difficulty');
const startButton = document.getElementById('startGame');
const gameArea = document.getElementById('gameArea');
let gameImage = document.getElementById('gameImage'); // const에서 let으로 변경
const objectsToFindList = document.getElementById('objectsToFind');
const objectListDiv = document.getElementById('objectList');
const timerDiv = document.getElementById('timer');
const timeSpan = document.getElementById('time');
const nameModal = document.getElementById('nameModal');
const overlay = document.getElementById('overlay');
const submitNameButton = document.getElementById('submitName');
const closeModalButton = document.getElementById('closeModal');
const rankingsList = document.getElementById("rankingsList"); // 랭킹 목록

let findingData = {};
let currentDifficulty = 'easy'; // 기본 난이도를 '쉬움'으로 설정
let availableImages = []; // 사용 가능한 이미지 목록
let currentImage = {};
let startTime;
let timerInterval;
let remainingObjects = [];
let completedImagesCount = 0; // 완료된 이미지 수

// 게임 시작 버튼 클릭 시
startButton.addEventListener('click', () => {
    resetGame(); // 새로운 게임 시작 전에 이전 게임 상태 초기화

    currentDifficulty = difficultySelect.value;
    if (!currentDifficulty) {
        alert('난이도를 선택해주세요!');
        return;
    }

    fetch('findimg.json')  // 파일 이름 확인
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            findingData = data;
            initializeAvailableImages();
            startGame();
            fetchRankings(currentDifficulty); // 게임 시작 시 현재 난이도 랭킹 불러오기
        })
        .catch(error => {
            console.error('Error fetching findimg.json:', error);
            alert('게임 데이터를 불러오는 데 문제가 발생했습니다. 나중에 다시 시도해주세요.');
        });
});

// 난이도 선택 변경 시 랭킹 자동으로 업데이트
difficultySelect.addEventListener('change', () => {
    currentDifficulty = difficultySelect.value;
    if (currentDifficulty) {
        fetchRankings(currentDifficulty);
    } else {
        // 난이도가 선택되지 않았을 때 랭킹 초기화
        rankingsList.innerHTML = '';
    }
});

// 초기 사용 가능한 이미지 목록 설정
function initializeAvailableImages() {
    if (findingData[currentDifficulty] && findingData[currentDifficulty].length > 0) {
        // 사용 가능한 이미지 목록을 초기화
        availableImages = [...findingData[currentDifficulty]];
        completedImagesCount = 0;
        console.log(`사용 가능한 이미지 수: ${availableImages.length}`);
    } else {
        alert('해당 난이도에 사용할 이미지가 없습니다.');
    }
}

function startGame() {
    if (availableImages.length === 0) {
        alert('모든 그림을 완료하셨습니다! 축하합니다!');
        return;
    }

    // 난이도별 이미지 중 랜덤 선택
    const randomIndex = Math.floor(Math.random() * availableImages.length);
    currentImage = availableImages[randomIndex];
    // 선택된 이미지를 사용 가능한 이미지 목록에서 제거
    availableImages.splice(randomIndex, 1);

    // 이미지 설정
    gameImage.src = currentImage.image;
    gameArea.style.display = 'block';
    objectListDiv.style.display = 'block';
    timerDiv.style.display = 'block';

    // 이미지가 완전히 로드된 후 실행
    gameImage.onload = () => {
        console.log(`이미지 로드 성공: ${currentImage.image}`);
        console.log(`이미지 크기: ${gameImage.naturalWidth}x${gameImage.naturalHeight}`);

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

        // 기존 이벤트 리스너 제거 후 새로운 이벤트 리스너 추가
        gameImage.removeEventListener('click', handleImageClick);
        gameImage.removeEventListener('touchstart', handleImageTouch); // 기존 터치 이벤트 제거
        gameImage.addEventListener('click', handleImageClick);
        gameImage.addEventListener('touchstart', handleImageTouch); // 새로운 터치 이벤트 추가
    };

    gameImage.onerror = () => {
        console.error(`이미지 로딩 오류: ${currentImage.image}`);
        alert('이미지 로딩에 문제가 발생했습니다. 다른 이미지를 시도해주세요.');
        // 다음 이미지를 시도하도록 startGame() 재호출
        startGame();
    };
}

function handleImageClick(event) {
    const rect = gameImage.getBoundingClientRect();

    // 현재 표시 크기와 원래 크기의 비율 (올바르게 수정)
    const scaleX = gameImage.naturalWidth / rect.width;
    const scaleY = gameImage.naturalHeight / rect.height;

    console.log(`Image display size: ${rect.width}x${rect.height}`);
    console.log(`Image natural size: ${gameImage.naturalWidth}x${gameImage.naturalHeight}`);
    console.log(`ScaleX: ${scaleX}, ScaleY: ${scaleY}`);

    // 클릭 위치를 원래 크기 기준으로 변환
    const clickX = Math.round((event.clientX - rect.left) * scaleX);
    const clickY = Math.round((event.clientY - rect.top) * scaleY);

    console.log(`Clicked coordinates (original size): (${clickX}, ${clickY})`);

    for (let obj of remainingObjects) {
        const { x, y, width, height, name } = obj;

        // 여유 범위 설정 (픽셀 단위로 확장)
        const margin = 0; // 여유 없이 정확한 위치에 마커 배치

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
            // 객체를 찾았을 때
            markFound(name, x, y, width, height, scaleX, scaleY);
            remainingObjects = remainingObjects.filter(o => o.name !== name);
            if (remainingObjects.length === 0) {
                endGame();
            }
            break;
        }
    }
}

function handleImageTouch(event) {
    event.preventDefault(); // 기본 터치 동작 방지
    const touch = event.touches[0];
    const simulatedEvent = new MouseEvent('click', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        bubbles: true,
        cancelable: true
    });
    gameImage.dispatchEvent(simulatedEvent);
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

    // 마커 생성
    const foundMarker = document.createElement('div');
    foundMarker.classList.add('found-marker');

    // 객체의 중앙 좌표 계산 (픽셀 기반)
    const centerX = (x + width / 2) * scaleX;
    const centerY = (y + height / 2) * scaleY;

    // 마커의 위치 설정
    foundMarker.style.left = `${centerX}px`;
    foundMarker.style.top = `${centerY}px`;

    // 마커를 게임 영역에 추가
    gameArea.appendChild(foundMarker);

    console.log(`마커 추가: ${name} at (${centerX}px, ${centerY}px)`);
}

function endGame() {
    // 타이머 중지
    clearInterval(timerInterval);

    // 게임 이미지 클릭 이벤트 제거
    gameImage.removeEventListener('click', handleImageClick);
    gameImage.removeEventListener('touchstart', handleImageTouch);

    // 완료된 이미지 수 증가
    completedImagesCount++;

    // 이름 입력 모달 표시
    overlay.style.display = 'block';
    nameModal.style.display = 'block';

    // 모든 이미지 완료 여부 확인 후 알림
    if (availableImages.length === 0) {
        alert('모든 그림을 완료하셨습니다! 축하합니다!');
    } else {
        // 다음 이미지 자동으로 시작
        startGame();
    }
}

// 이름 제출 버튼 클릭 시 Firestore에 데이터 저장
submitNameButton.addEventListener('click', () => {
    const playerName = document.getElementById("playerName").value.trim();
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);

    if (playerName) {
        // Firestore에 데이터 저장
        db.collection(`rankings_${currentDifficulty}`)
            .add({
                name: playerName,
                time: elapsedTime, // 기록 시간 포함
                date: new Date().toISOString()
            })
            .then(() => {
                alert('기록이 저장되었습니다!');
                fetchRankings(currentDifficulty); // 기록 저장 후 랭킹 갱신
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

// 모달 닫기 버튼 클릭 시 모달 닫기
closeModalButton.addEventListener('click', () => {
    // 모달 닫기
    nameModal.style.display = 'none';
    overlay.style.display = 'none';
    resetGame();
});

function fetchRankings(difficulty) {
    if (!difficulty) {
        rankingsList.innerHTML = '';
        return;
    }

    db.collection(`rankings_${difficulty}`)
        .orderBy('time', 'asc') // 시간 기준 오름차순 정렬
        .limit(10) // 상위 10개 기록만 표시
        .get()
        .then((querySnapshot) => {
            rankingsList.innerHTML = ""; // 기존 데이터 초기화

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const tr = document.createElement("tr");

                // 난이도 셀
                const difficultyTd = document.createElement("td");
                difficultyTd.textContent = difficulty === 'easy' ? '쉬움' : difficulty === 'medium' ? '보통' : '어려움';
                tr.appendChild(difficultyTd);

                // 이름 셀
                const nameTd = document.createElement("td");
                nameTd.textContent = data.name;
                tr.appendChild(nameTd);

                // 기록 셀 (시간)
                const recordTd = document.createElement("td");
                recordTd.textContent = `${data.time}초`;
                tr.appendChild(recordTd);

                rankingsList.appendChild(tr);
            });
        })
        .catch((error) => {
            console.error('Firestore 조회 오류:', error.message);
        });
}

// 페이지 로드 시 기본 난이도에 따른 랭킹 불러오기
window.addEventListener('load', () => {
    fetchRankings(currentDifficulty); // 기본 난이도 '쉬움'에 따른 랭킹 불러오기
});

// 테스트 마커 추가 (디버깅용)
// function testMarker() {
//     const foundMarker = document.createElement('div');
//     foundMarker.classList.add('found-marker');
//     foundMarker.style.left = `50%`;
//     foundMarker.style.top = `50%`;
//     gameArea.appendChild(foundMarker);
//     console.log('테스트 마커 추가됨');
// }

// window.addEventListener('load', () => {
//     // 페이지 로드 후 2초 뒤에 테스트 마커 추가
//     setTimeout(testMarker, 2000);
// });

function resetGame() {
    // 게임 초기화
    gameArea.style.display = 'none';
    objectListDiv.style.display = 'none';
    timerDiv.style.display = 'none';
    objectsToFindList.innerHTML = '';
    // 기존 방식대로 innerHTML을 재설정하지 않음
    // gameArea.innerHTML = `<img src="" id="gameImage" alt="숨은 그림 찾기 이미지">`;

    // 타이머 초기화
    clearInterval(timerInterval);
    timeSpan.textContent = '0';

    // 이름 입력 초기화
    document.getElementById('playerName').value = '';

    // 마커 제거
    const existingMarkers = document.querySelectorAll('.found-marker');
    existingMarkers.forEach(marker => marker.remove());

    // 다시 시작할 수 있도록 난이도 선택 표시 (기존 선택 유지)
    // difficultySelect.value = 'easy'; // 제거: 사용자 선택 유지
}
