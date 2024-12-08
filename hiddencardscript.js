// 카드 이미지 폴더 경로
const IMAGE_FOLDER = "images/";

// 이미지 목록을 저장할 객체
let questions = {};

// 현재 질문 리스트와 인덱스
let currentQuestions = [];
let currentQuestionIndex = 0;

// 마스크 상태 저장 변수
let isDragging = false;
let startX = 0;
let startY = 0;
let initialTop = 0;
let initialLeft = 0;
let initialWidth = 100; // 백분율
let initialHeight = 100; // 백분율

// 드래그 최소 거리 (픽셀)
const MIN_DRAG_DISTANCE = 10;
let cumulativeDeltaX = 0;
let cumulativeDeltaY = 0;

// DOM 요소 가져오기
const hiddenImage = document.getElementById("hidden-image");
const mask = document.getElementById("mask");
const prevButton = document.getElementById("prev-button");
const nextButton = document.getElementById("next-button");
const showAnswerButton = document.getElementById("show-answer-button"); // 정답 보기 버튼
const categorySelection = document.getElementById("category-selection");
const gameContainer = document.getElementById("game-container");
const categoryButtons = document.querySelectorAll(".category-button");
const correctAnswer = document.getElementById("correct-answer");

// 이미지 목록을 JSON에서 불러오기
async function loadImages() {
    try {
        const response = await fetch('hiddencardimg.json');
        const data = await response.json();
        questions = data.questions;
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

// 카테고리 선택 핸들러
function handleCategorySelection(event) {
    const selectedCategory = event.target.getAttribute('data-category');
    if (!selectedCategory || !questions[selectedCategory]) return;

    // 선택된 카테고리의 질문을 가져오고 랜덤 섞기
    currentQuestions = [...questions[selectedCategory]];
    shuffleArray(currentQuestions);
    currentQuestionIndex = 0;

    // 카테고리 선택 UI 숨기고 게임 컨테이너 표시
    categorySelection.style.display = "none";
    gameContainer.style.display = "flex";

    // 첫 번째 질문 로드
    loadQuestion(currentQuestionIndex);
}

// 질문 로드 함수
function loadQuestion(index) {
    if (index < 0 || index >= currentQuestions.length) return;

    const question = currentQuestions[index];
    hiddenImage.src = IMAGE_FOLDER + question.image;
    resetMask();
    clearCorrectAnswer();
}

// 마스크 초기화 함수
function resetMask() {
    mask.style.top = "0%";
    mask.style.left = "0%";
    mask.style.width = "100%";
    mask.style.height = "100%";
    mask.style.background = "rgba(0, 0, 0, 1)"; // 완전 불투명
    correctAnswer.style.display = "none"; // 정답 숨김
    correctAnswer.textContent = ""; // 정답 텍스트 초기화
    initialWidth = 100;
    initialHeight = 100;
    cumulativeDeltaX = 0;
    cumulativeDeltaY = 0;
}

// 정답 표시 함수
function showCorrectAnswer(text) {
    correctAnswer.textContent = `정답: ${text}`;
    correctAnswer.style.display = "block";
}

// 정답 숨김 함수
function clearCorrectAnswer() {
    correctAnswer.style.display = "none";
    correctAnswer.textContent = "";
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

    // Reset cumulative deltas
    cumulativeDeltaX = 0;
    cumulativeDeltaY = 0;
}

// 드래그 종료 함수
function stopDragging() {
    if (isDragging) {
        isDragging = false;
        mask.classList.remove('dragging');

        // 마스크가 거의 제거되었는지 확인 (5% 이하)
        const currentWidth = parseFloat(mask.style.width);
        const currentHeight = parseFloat(mask.style.height);
        if (currentWidth <= 5 && currentHeight <= 5) {
            speakWord(currentQuestions[currentQuestionIndex].correct);
            showCorrectAnswer(currentQuestions[currentQuestionIndex].correct);
        }
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

    // 드래그 거리 계산
    let deltaX = currentX - startX;
    let deltaY = startY - currentY; // 드래그 방향 반전

    cumulativeDeltaX += Math.abs(deltaX);
    cumulativeDeltaY += Math.abs(deltaY);

    // Apply changes only if cumulative movement exceeds the threshold
    if (cumulativeDeltaX < MIN_DRAG_DISTANCE && cumulativeDeltaY < MIN_DRAG_DISTANCE) {
        return; // Do not apply mask changes
    }

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
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion(currentQuestionIndex);
    }
});

// 다음 버튼 클릭 이벤트
nextButton.addEventListener("click", () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        loadQuestion(currentQuestionIndex);
    }
});

// "정답 보기" 버튼 클릭 이벤트
showAnswerButton.addEventListener("click", () => {
    const question = currentQuestions[currentQuestionIndex];
    const correctText = question.correct;
    showCorrectAnswer(correctText);
    speakWord(question.correct);
});

// 음성 합성 함수 (웹 브라우저와 Android 앱 지원)
function speakWord(word) {
    // Android 애플리케이션의 JavaScript Interface를 통한 TTS 호출
    if (typeof Android !== 'undefined' && Android.speak) {
        Android.speak(word);
    }
    // 웹 브라우저에서는 Web Speech API 사용
    else if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US'; // 영어 발음 설정
        utterance.rate = 1;        // 속도 (0.1 ~ 10)
        utterance.pitch = 1;       // 음의 높낮이 (0 ~ 2)
        window.speechSynthesis.speak(utterance);
    }
    else {
        console.warn("이 브라우저는 음성 합성을 지원하지 않습니다.");
    }
}

// 초기 이미지 로드 (카테고리 선택 후 호출)
loadImages();

// 이벤트 리스너 추가
categoryButtons.forEach(button => {
    button.addEventListener("click", handleCategorySelection);
});

// 마스크 이벤트 리스너
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
