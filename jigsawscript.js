// script.js

let selectedImage = null;
let puzzlePieces = [];
let numPieces = 4; // 기본 난이도: 4조각
let timer = 0;
let timerIntervalId = null;

// 기록 저장을 위해 LocalStorage 사용 (Firebase를 원하시면 추가 설정 필요)
const RECORDS_KEY = 'jigsawPuzzleRecords';

// DOM 요소 선택
const imageUploadInput = document.getElementById('imageUpload');
const predefinedImages = document.querySelectorAll('.selectable-image');
const difficultySelect = document.getElementById('difficultySelect');
const startButton = document.getElementById('startButton');
const puzzleContainer = document.getElementById('puzzle-container');
const timerDisplay = document.getElementById('timer');
const viewRecordButton = document.getElementById('viewRecordButton');
const recordSection = document.getElementById('record-section');
const closeRecordButton = document.getElementById('closeRecordButton');
const recordEasyList = document.getElementById('record-easy');
const recordMediumList = document.getElementById('record-medium');
const recordHardList = document.getElementById('record-hard');

// 이미지 업로드 이벤트 리스너
imageUploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(event) {
            selectedImage = event.target.result;
            // 선택된 이미지를 표시 (필요 시 미리보기)
        };
        reader.readAsDataURL(file);
    } else {
        alert('이미지 파일을 선택해주세요.');
    }
});

// 사전 설정된 이미지 선택 이벤트 리스너
predefinedImages.forEach(img => {
    img.addEventListener('click', () => {
        selectedImage = img.src;
        // 선택된 이미지를 표시 (필요 시 미리보기)
        // 선택 효과 추가
        predefinedImages.forEach(image => image.classList.remove('selected'));
        img.classList.add('selected');
    });
});

// 난이도 선택 변경 이벤트
difficultySelect.addEventListener('change', () => {
    const value = difficultySelect.value;
    if (value === '4') {
        numPieces = 4;
    } else if (value === '12') {
        numPieces = 12;
    } else if (value === '24') {
        numPieces = 24;
    }
});

// 게임 시작 버튼 이벤트 리스너
startButton.addEventListener('click', () => {
    if (!selectedImage) {
        alert('이미지를 업로드하거나 선택해주세요.');
        return;
    }

    resetGame();
    generatePuzzle(selectedImage, numPieces);
    startTimer();
});

// 퍼즐 생성 함수
function generatePuzzle(imageSrc, piecesCount) {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const imgWidth = img.width;
        const imgHeight = img.height;

        // 퍼즐 영역 크기 설정 (600x600 고정)
        const puzzleWidth = puzzleContainer.clientWidth;
        const puzzleHeight = puzzleContainer.clientHeight;

        // 캔버스 크기 조정
        canvas.width = puzzleWidth;
        canvas.height = puzzleHeight;

        // 이미지 비율에 맞게 크기 조정
        let drawWidth = puzzleWidth;
        let drawHeight = (imgHeight / imgWidth) * puzzleWidth;
        if (drawHeight > puzzleHeight) {
            drawHeight = puzzleHeight;
            drawWidth = (imgWidth / imgHeight) * puzzleHeight;
        }

        ctx.drawImage(img, 0, 0, drawWidth, drawHeight);

        // 조각 개수에 따른 행과 열 계산 (예: 4조각 = 2x2, 12조각 = 3x4, 24조각 = 4x6)
        let cols, rows;
        if (piecesCount === 4) {
            cols = 2;
            rows = 2;
        } else if (piecesCount === 12) {
            cols = 3;
            rows = 4;
        } else if (piecesCount === 24) {
            cols = 4;
            rows = 6;
        }

        const pieceWidth = drawWidth / cols;
        const pieceHeight = drawHeight / rows;

        // 퍼즐 조각 생성
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const pieceCanvas = document.createElement('canvas');
                const pieceCtx = pieceCanvas.getContext('2d');
                pieceCanvas.width = pieceWidth;
                pieceCanvas.height = pieceHeight;

                pieceCtx.drawImage(
                    canvas,
                    col * pieceWidth,
                    row * pieceHeight,
                    pieceWidth,
                    pieceHeight,
                    0,
                    0,
                    pieceWidth,
                    pieceHeight
                );

                const pieceDataURL = pieceCanvas.toDataURL();

                // 퍼즐 조각 요소 생성
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('puzzle-piece');
                pieceElement.style.width = `${pieceWidth}px`;
                pieceElement.style.height = `${pieceHeight}px`;
                pieceElement.style.backgroundImage = `url(${pieceDataURL})`;

                // 랜덤 위치에 배치
                const x = Math.random() * (puzzleWidth - pieceWidth);
                const y = Math.random() * (puzzleHeight - pieceHeight);
                pieceElement.style.left = `${x}px`;
                pieceElement.style.top = `${y}px`;

                // 퍼즐 조각 드래그 설정 (interact.js 사용)
                interact(pieceElement).draggable({
                    inertia: true,
                    modifiers: [
                        interact.modifiers.restrictRect({
                            restriction: puzzleContainer,
                            endOnly: true
                        })
                    ],
                    autoScroll: true,
                    listeners: {
                        move: dragMoveListener
                    }
                });

                // 퍼즐 조각 클릭 시 위치 고정
                pieceElement.addEventListener('dragend', checkPuzzleCompletion);

                // 퍼즐 영역에 추가
                puzzleContainer.appendChild(pieceElement);
                puzzlePieces.push(pieceElement);
            }
        }
    };
}

// 드래그 이동 리스너
function dragMoveListener(event) {
    const target = event.target;
    // 현재 x, y 위치 가져오기
    const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
    const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

    // 요소 위치 업데이트
    target.style.transform = `translate(${x}px, ${y}px)`;

    // data-x, data-y 업데이트
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
}

// 퍼즐 완료 체크 함수
function checkPuzzleCompletion() {
    // 모든 퍼즐 조각이 원래 위치에 근접하게 배치되었는지 확인
    let completed = true;
    puzzlePieces.forEach(piece => {
        const x = parseFloat(piece.style.left) + (parseFloat(piece.getAttribute('data-x')) || 0);
        const y = parseFloat(piece.style.top) + (parseFloat(piece.getAttribute('data-y')) || 0);

        const deltaX = Math.abs(x - parseFloat(piece.style.left));
        const deltaY = Math.abs(y - parseFloat(piece.style.top));

        if (deltaX > 20 || deltaY > 20) { // 허용 오차 20px
            completed = false;
        }
    });

    if (completed) {
        stopTimer();
        alert(`축하합니다! 걸린 시간: ${timer}초`);
        saveRecord(numPieces, timer);
        resetGame();
    }
}

// 게임 리셋 함수
function resetGame() {
    // 퍼즐 조각 초기화
    puzzlePieces.forEach(piece => {
        puzzleContainer.removeChild(piece);
    });
    puzzlePieces = [];

    // 타이머 리셋
    clearInterval(timerIntervalId);
    timer = 0;
    timerDisplay.textContent = `걸린 시간: ${timer}초`;

    // 선택된 이미지 유지
}

// 타이머 시작 함수
function startTimer() {
    timerIntervalId = setInterval(() => {
        timer++;
        timerDisplay.textContent = `걸린 시간: ${timer}초`;
    }, 1000);
}

// 타이머 정지 함수
function stopTimer() {
    clearInterval(timerIntervalId);
}

// 기록 저장 함수 (LocalStorage 사용)
function saveRecord(difficulty, time) {
    let records = JSON.parse(localStorage.getItem(RECORDS_KEY)) || {
        4: [],
        12: [],
        24: []
    };

    records[difficulty].push(time);

    // 최근 10개의 기록만 저장
    if (records[difficulty].length > 10) {
        records[difficulty].shift();
    }

    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

// 기록 보기 버튼 이벤트 리스너
viewRecordButton.addEventListener('click', () => {
    displayRecords();
    recordSection.style.display = 'block';
});

// 기록 닫기 버튼 이벤트 리스너
closeRecordButton.addEventListener('click', () => {
    recordSection.style.display = 'none';
});

// 기록 표시 함수
function displayRecords() {
    const records = JSON.parse(localStorage.getItem(RECORDS_KEY)) || {
        4: [],
        12: [],
        24: []
    };

    // 쉬움 기록
    recordEasyList.innerHTML = '';
    records['4'].forEach((time, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${time}초`;
        recordEasyList.appendChild(li);
    });

    // 중간 기록
    recordMediumList.innerHTML = '';
    records['12'].forEach((time, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${time}초`;
        recordMediumList.appendChild(li);
    });

    // 어려움 기록
    recordHardList.innerHTML = '';
    records['24'].forEach((time, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${time}초`;
        recordHardList.appendChild(li);
    });
}
