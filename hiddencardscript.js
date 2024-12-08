// 카드 이미지 경로
const IMAGE_FOLDER = "images/";

// 이미지 목록을 저장할 배열
let imageList = [];

// 현재 이미지 인덱스
let currentIndex = 0;

// 마스크 상태 저장 변수
let isDragging = false;
let startX = 0;
let startY = 0;
let initialTop = 0;
let initialLeft = 0;
let initialWidth = 100; // 백분율
let initialHeight = 100; // 백분율

// DOM 요소 가져오기
const hiddenImage = document.getElementById("hidden-image");
const mask = document.getElementById("mask");
const prevButton = document.getElementById("prev-button");
const nextButton = document.getElementById("next-button");
const maskText = mask.querySelector('.mask-text');

// 이미지 목록을 JSON에서 불러오기
async function loadImages() {
    try {
        const response = await fetch('hiddencardimg.json');
        const data = await response.json();
        imageList = data.images.map(img => IMAGE_FOLDER + img);
        shuffleArray(imageList); // 이미지 목록 랜덤화
        updateImage();
    } catch (error) {
        console.error("이미지 로딩 오류:", error);
    }
}

// 배열을 랜덤하게 섞는 함수 (Fisher-Yates Shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// 이미지 업데이트 함수
function updateImage() {
    hiddenImage.src = imageList[currentIndex];
    resetMask();
}

// 마스크 초기화 함수
function resetMask() {
    mask.style.top = "0%";
    mask.style.left = "0%";
    mask.style.width = "100%";
    mask.style.height = "100%";
    maskText.style.display = "block";
    initialWidth = 100;
    initialHeight = 100;
}

// 드래그 시작 함수
function startDragging(event) {
    isDragging = true;
    mask.classList.add('dragging');

    if (event.type === "mousedown") {
        startX = event.clientX;
        startY = event.clientY;
    } else if (event.type === "touchstart") {
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
    }

    // 현재 마스크의 위치와 크기 저장
    initialTop = parseFloat(mask.style.top);
    initialLeft = parseFloat(mask.style.left);
    initialWidth = parseFloat(mask.style.width);
    initialHeight = parseFloat(mask.style.height);
}

// 드래그 종료 함수
function stopDragging() {
    if (isDragging) {
        isDragging = false;
        mask.classList.remove('dragging');
        // 드래그가 완료되면 "?" 표시 숨기기
        maskText.style.display = "none";
    }
}

// 드래그 처리 함수
function handleDrag(event) {
    if (!isDragging) return;

    let currentX = 0;
    let currentY = 0;

    if (event.type === "mousemove") {
        currentX = event.clientX;
        currentY = event.clientY;
    } else if (event.type === "touchmove") {
        currentX = event.touches[0].clientX;
        currentY = event.touches[0].clientY;
    }

    let deltaX = currentX - startX;
    let deltaY = startY - currentY; // 위로 드래그하면 양수

    // 드래그 거리를 백분율로 변환
    let deltaXPercent = (deltaX / mask.parentElement.clientWidth) * 100;
    let deltaYPercent = (deltaY / mask.parentElement.clientHeight) * 100;

    // 마스크의 새로운 위치와 크기 계산
    let newTop = initialTop - deltaYPercent;
    let newLeft = initialLeft + deltaXPercent;
    let newWidth = initialWidth - deltaXPercent;
    let newHeight = initialHeight - deltaYPercent;

    // 마스크의 위치와 크기를 0% 이상, 100% 이하로 제한
    newTop = Math.max(0, Math.min(newTop, 100 - newHeight));
    newLeft = Math.max(0, Math.min(newLeft, 100 - newWidth));
    newWidth = Math.max(0, Math.min(newWidth, 100));
    newHeight = Math.max(0, Math.min(newHeight, 100));

    // 마스크 스타일 업데이트
    mask.style.top = `${newTop}%`;
    mask.style.left = `${newLeft}%`;
    mask.style.width = `${newWidth}%`;
    mask.style.height = `${newHeight}%`;
}

// 이전 버튼 클릭 이벤트
prevButton.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + imageList.length) % imageList.length;
    updateImage();
});

// 다음 버튼 클릭 이벤트
nextButton.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % imageList.length;
    updateImage();
});

// 초기 이미지 로드
loadImages();

// 이벤트 리스너 추가
mask.addEventListener("mousedown", (e) => {
    e.preventDefault(); // 드래그 시 텍스트 선택 방지
    startDragging(e);
});
mask.addEventListener("touchstart", (e) => {
    e.preventDefault(); // 드래그 시 스크롤 방지
    startDragging(e);
}, { passive: false });

document.addEventListener("mousemove", (e) => {
    handleDrag(e);
});
document.addEventListener("touchmove", (e) => {
    handleDrag(e);
}, { passive: false });

document.addEventListener("mouseup", () => {
    stopDragging();
});
document.addEventListener("touchend", () => {
    stopDragging();
});
