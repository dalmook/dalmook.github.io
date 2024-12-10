// Firebase 초기화 (Firebase 콘솔에서 얻은 설정 정보로 대체)
const firebaseConfig = {
    apiKey: "AIzaSyBbyta3aYZuMcaWDFyUP_LqQFDXr95_m6U",
    authDomain: "imagechoice20241125.firebaseapp.com",
    projectId: "imagechoice20241125",
    storageBucket: "imagechoice20241125.firebasestorage.app",
    messagingSenderId: "4727525381",
    appId: "1:4727525381:web:a90aab12dbdba5de430c6c"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 데이터 변수
let optionPools = {};
let questionsData = {};

// 이미지 캐시 객체
const imageCache = {};

// 이미지 로드 함수 (프라미스 기반)
function loadImage(url) {
    return new Promise((resolve, reject) => {
        if (imageCache[url]) {
            // 이미지가 이미 캐시에 있으면 즉시 반환
            resolve(imageCache[url]);
        } else {
            const img = new Image();
            img.src = url;
            img.onload = () => {
                imageCache[url] = img; // 캐시에 저장
                resolve(img);
            };
            img.onerror = () => reject(new Error(`이미지를 로드하지 못했습니다: ${url}`));
        }
    });
}

// 데이터 로드 함수
async function loadData() {
    try {
        const response = await fetch('imagechoicedata.json');
        if (!response.ok) {
            throw new Error('데이터 로드 실패');
        }
        const data = await response.json();
        optionPools = data.optionPools;
        questionsData = data.questions;
        console.log('데이터 로드 성공');
    } catch (error) {
        console.error('데이터 로드 중 오류 발생:', error);
        alert('데이터를 불러오지 못했습니다. 페이지를 새로고침 해주세요.');
    }
}

// 초기화 함수
async function initialize() {
    await loadData();
    // 데이터가 로드된 후 게임을 초기화
    setupEventListeners();
}

initialize();

// 변수 초기화
let currentQuestionIndex = 0;
let score = 0;
let countdown; // 난이도에 따라 다르게 설정
let countdownInterval;
let selectedCategory = '';
let selectedDifficulty = '';
let filteredQuestions = []; // 선택된 카테고리에 맞는 질문들

const startQuizButton = document.getElementById('startQuizGame');
const quizContainer = document.getElementById('quizContainer');
const questionImage = document.getElementById('questionImage');
const optionsContainer = document.getElementById('options');
const scoreDisplay = document.getElementById('score');
const feedback = document.getElementById('feedback');
const correctAnswerDiv = document.getElementById('correctAnswer'); // 정답 표시 요소

const successMessage = document.getElementById('successMessage');
const saveRecordButton = document.getElementById('saveRecordButton');
const restartButton = document.getElementById('restartButton');

const recordSection = document.getElementById('recordSection');
const playerNameInput = document.getElementById('playerName');
const submitRecordButton = document.getElementById('submitRecordButton');
const recordTableBody = document.getElementById('recordTable').querySelector('tbody');
const closeRecordSectionButton = document.getElementById('closeRecordSection');

const correctSoundEffect = document.getElementById('correctSoundEffect');
const incorrectSound = document.getElementById('incorrectSound');

// 게임 시작 버튼 이벤트 리스너 설정 함수
function setupEventListeners() {
    // 게임 시작 버튼 이벤트
    startQuizButton.addEventListener('click', async () => {
        // 카테고리와 난이도가 선택되었는지 확인
        selectedCategory = document.getElementById('categorySelect').value;
        selectedDifficulty = document.getElementById('difficultySelect').value;

        if (!selectedCategory) {
            alert('카테고리를 선택하세요!');
            return;
        }
        if (!selectedDifficulty) {
            alert('난이도를 선택하세요!');
            return;
        }

        // 선택된 카테고리에 맞는 질문들 필터링
        if (questionsData[selectedCategory]) {
            filteredQuestions = [...questionsData[selectedCategory]];
        } else {
            alert('선택한 카테고리에 맞는 질문이 없습니다.');
            return;
        }

        // 퀴즈 시작
        await startQuizGame();
    });
    
    // 기록 보기 버튼 이벤트 리스너 추가
    document.getElementById('viewRecordsButton').addEventListener('click', () => {
        recordSection.style.display = 'flex'; // 기록 섹션 표시
        loadRecordsFromFirestore(); // 기록 불러오기 함수 호출
    });

    // 기록 저장 버튼 이벤트
    saveRecordButton.addEventListener('click', () => {
        successMessage.style.display = 'none';
        recordSection.style.display = 'flex';
        loadRecordsFromFirestore();
    });

    // 기록 제출 버튼 이벤트
    submitRecordButton.addEventListener('click', () => {
        const name = playerNameInput.value.trim();
        if (!name) {
            alert('이름을 입력하세요!');
            return;
        }
        saveRecord(name);
    });

    // 게임 재시작 버튼 이벤트
    restartButton.addEventListener('click', () => {
        restartGame();
    });

    // 기록 섹션 닫기 버튼 이벤트
    closeRecordSectionButton.addEventListener('click', () => {
        recordSection.style.display = 'none';
    });
}

// 게임 시작 함수
async function startQuizGame() {
    if (filteredQuestions.length === 0) {
        alert('선택한 카테고리에 맞는 질문이 없습니다!');
        return;
    }

    // 문제를 무작위로 섞고, 최대 20문제 선택
    const shuffledQuestions = filteredQuestions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffledQuestions.slice(0, 20);

    if (selectedQuestions.length === 0) {
        alert('선택한 카테고리에 문제가 없습니다!');
        return;
    }

    // 문제 리스트를 업데이트하고 게임 시작
    currentQuestionIndex = 0;
    score = 0;
    filteredQuestions = selectedQuestions; // 선택된 문제를 저장
    scoreDisplay.textContent = `점수: ${score}`;
    quizContainer.style.display = 'flex';
    startQuizButton.disabled = true;
    await loadQuestion();
}

// 질문 로드 함수 (비동기)
async function loadQuestion() {
    // 난이도에 따라 시간 설정
    if (selectedDifficulty === 'easy') {
        countdown = 5; // 쉬움: 5초
    } else if (selectedDifficulty === 'medium') {
        countdown = 3; // 보통: 3초
    } else if (selectedDifficulty === 'hard') {
        countdown = 2; // 어려움: 2초
    }
    
    if (currentQuestionIndex >= filteredQuestions.length) {
        endQuiz();
        return;
    }

    const currentQuestion = filteredQuestions[currentQuestionIndex];
    
    try {
        // 현재 질문의 이미지 로드
        await loadImage(currentQuestion.image);
        // 배경 이미지 설정
        questionImage.style.backgroundImage = `url("${currentQuestion.image}")`;
    } catch (error) {
        console.error(error);
        alert('이미지를 불러오는데 실패했습니다.');
        // 실패 시 다음 질문으로 이동
        await nextQuestion();
        return;
    }

    feedback.innerHTML = ''; // 피드백 초기화
    correctAnswerDiv.innerHTML = ''; // 정답 표시 초기화
    correctAnswerDiv.style.display = 'none'; // 정답 표시 숨김

    // 카테고리별 옵션 풀에서 오답 3개 선택
    const category = selectedCategory;
    const correctAnswer = currentQuestion.correct;
    let wrongOptions = optionPools[category].filter(option => option !== correctAnswer);

    // 오답이 부족할 경우 옵션 풀에서 중복 없이 가능한 모든 오답 사용
    if (wrongOptions.length < 3) {
        wrongOptions = [...wrongOptions]; // 기존 오답 모두 사용
    }

    // 오답을 랜덤으로 섞고 3개 선택
    const shuffledWrongOptions = wrongOptions.sort(() => Math.random() - 0.5);
    const selectedWrongOptions = shuffledWrongOptions.slice(0, 3);

    // 정답과 오답을 섞어서 보기 옵션 생성
    const options = [...selectedWrongOptions, correctAnswer].sort(() => Math.random() - 0.5);

    // 보기 버튼 생성
    optionsContainer.innerHTML = '';
    options.forEach(option => {
        const button = document.createElement('button');
        button.classList.add('option-button');
        button.textContent = option;
        button.addEventListener('click', () => selectOption(option, button));
        optionsContainer.appendChild(button);
    });

    // 카운트다운 초기화
    feedback.innerHTML = `${countdown}초`;
    countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            feedback.innerHTML = `${countdown}초`;
        } else {
            clearInterval(countdownInterval);
            markAsIncorrect(); // 시간이 초과되면 오답 처리
        }
    }, 1000);

    // 다음 질문의 이미지 사전 로드
    const nextQuestion = filteredQuestions[currentQuestionIndex + 1];
    if (nextQuestion) {
        loadImage(nextQuestion.image).catch(error => {
            console.warn('다음 질문의 이미지를 로드하지 못했습니다:', error);
        });
    }
}

// 보기 선택 함수
function selectOption(selectedOption, button) {
    const currentQuestion = filteredQuestions[currentQuestionIndex];
    clearInterval(countdownInterval); // 선택 시 카운트다운 중지

    // 난이도에 따른 점수 설정
    let correctScore, incorrectScore;
    if (selectedDifficulty === 'easy') {
        correctScore = 10;
        incorrectScore = -2;
    } else if (selectedDifficulty === 'medium') {
        correctScore = 20;
        incorrectScore = -4;
    } else if (selectedDifficulty === 'hard') {
        correctScore = 30;
        incorrectScore = -8;
    }

    if (selectedOption === currentQuestion.correct) {
        // 정답
        score += correctScore;
        scoreDisplay.textContent = `점수: ${score}`;
        feedback.innerHTML = '⭕';
        button.style.backgroundColor = '#32cd32'; // 녹색
        correctSoundEffect.play();

        // 애니메이션 클래스 추가
        feedback.classList.add('animate-correct');

        // 애니메이션이 끝난 후 클래스 제거
        feedback.addEventListener('animationend', () => {
            feedback.classList.remove('animate-correct');
        }, { once: true });

    } else {
        // 오답
        score += incorrectScore; // 예: easy는 -2
        scoreDisplay.textContent = `점수: ${score}`;
        feedback.innerHTML = '❌';
        button.style.backgroundColor = '#ff4d4d'; // 빨간색
        incorrectSound.play();

        // 정답 밑줄 표시
        Array.from(optionsContainer.children).forEach(btn => {
            if (btn.textContent === currentQuestion.correct) {
                btn.classList.add('correct-answer');
            }
        });

        // 애니메이션 클래스 추가
        feedback.classList.add('animate-incorrect');

        // 애니메이션이 끝난 후 클래스 제거
        feedback.addEventListener('animationend', () => {
            feedback.classList.remove('animate-incorrect');
        }, { once: true });
    }

    // 모든 보기 버튼 비활성화 및 정답 표시
    Array.from(optionsContainer.children).forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === currentQuestion.correct) {
            btn.style.backgroundColor = '#32cd32'; // 정답 표시
        }
    });

    // 정답 표시
    displayCorrectAnswer(currentQuestion.correct);

    setTimeout(async () => {
        await nextQuestion();
    }, 2000); // 2초 후 다음 질문으로 이동 (정답 표시 시간 포함)
}

// 시간 초과 시 오답 처리 함수
async function markAsIncorrect() {                       
    const currentQuestion = filteredQuestions[currentQuestionIndex];
    
    // 난이도에 따른 오답 점수 설정
    let incorrectScore;
    if (selectedDifficulty === 'easy') {
        incorrectScore = -2;
    } else if (selectedDifficulty === 'medium') {
        incorrectScore = -4;
    } else if (selectedDifficulty === 'hard') {
        incorrectScore = -8;
    }

    score += incorrectScore;
    scoreDisplay.textContent = `점수: ${score}`;
    feedback.innerHTML = '❌';
    
    // 모든 보기 버튼 비활성화 및 정답 표시
    Array.from(optionsContainer.children).forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === currentQuestion.correct) {
            btn.style.backgroundColor = '#32cd32'; // 정답 표시
            btn.classList.add('correct-answer'); // 정답 밑줄 표시
        }
    });
    
    incorrectSound.play();

    // 애니메이션 클래스 추가
    feedback.classList.add('animate-incorrect');

    // 애니메이션이 끝난 후 클래스 제거
    feedback.addEventListener('animationend', () => {
        feedback.classList.remove('animate-incorrect');
    }, { once: true });

    // 정답 표시
    displayCorrectAnswer(currentQuestion.correct);

    // 2초 후 다음 질문으로 이동
    await new Promise(resolve => setTimeout(resolve, 2000));
    await nextQuestion();
}

// 정답 표시 함수
function displayCorrectAnswer(correctAnswer) {
    const message = correctAnswer; // 정답 단어만 읽도록 수정
    correctAnswerDiv.innerHTML = `정답: ${message}`;
    correctAnswerDiv.style.display = 'block';

    // 텍스트 음성 변환 (선택 사항)
    if (typeof Android !== 'undefined' && Android.speak) {
        Android.speak(message);
        } 
    else if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(message);

        // 언어 설정: 한글인지 영어인지 판단
        const koreanRegex = /[가-힣]/; // 한글 확인용 정규식
        if (koreanRegex.test(message)) {
            utterance.lang = 'ko-KR'; // 한국어 발음
        } else {
            utterance.lang = 'en-US'; // 영어 발음
        }
        window.speechSynthesis.speak(utterance);
    }
    else {
        console.warn("이 브라우저는 음성 합성을 지원하지 않습니다.");
    }
}


// 다음 질문으로 이동 함수
async function nextQuestion() {
    currentQuestionIndex++;
    await loadQuestion();
}

// 퀴즈 종료 함수
function endQuiz() {
    quizContainer.style.display = 'none';
    successMessage.style.display = 'flex';
    clearInterval(countdownInterval);
}

// Firestore에 기록 저장 함수
function saveRecord(name) {
    const record = {
        name: name,
        score: score,
        category: selectedCategory,
        difficulty: selectedDifficulty,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    db.collection('quizGameRecords').add(record)
        .then(() => {
            console.log('게임 기록이 성공적으로 저장되었습니다.');
            playerNameInput.value = '';
            loadRecordsFromFirestore();
        })
        .catch((error) => {
            console.error('게임 기록 저장 중 오류 발생: ', error);
            alert('기록 저장에 실패했습니다. 다시 시도해주세요.');
        });
}

// Firestore에서 기록 불러오기 함수
function loadRecordsFromFirestore() {
    recordTableBody.innerHTML = ''; // 기존 기록 초기화
    db.collection('quizGameRecords').orderBy('score', 'desc').limit(10).get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const record = doc.data();
                addRecordToTable(record);
            });
        })
        .catch((error) => {
            console.error('기록 불러오기 중 오류 발생: ', error);
        });
}

// 기록 테이블에 기록 추가 함수
function addRecordToTable(record) {
    const row = document.createElement('tr');
    const date = record.timestamp ? record.timestamp.toDate().toLocaleString() : 'N/A';
    row.innerHTML = `
        <td>${record.name}</td>
        <td>${record.score}</td>
        <!--<td>${date}</td>--!>
    `;
    recordTableBody.appendChild(row);
}

// 게임 재시작 함수 수정
function restartGame() {
    currentQuestionIndex = 0; // 질문 인덱스 초기화
    score = 0;                 // 점수 초기화
    scoreDisplay.textContent = `점수: ${score}`;
    recordSection.style.display = 'none';    // 기록 섹션 숨기기
    successMessage.style.display = 'none';    // 성공 메시지 숨기기
    playerNameInput.value = '';               // 이름 입력 필드 초기화
    quizContainer.style.display = 'none';      // 퀴즈 컨테이너 숨기기
    startQuizButton.disabled = false;         // "게임 시작" 버튼 활성화
    // 카테고리와 난이도 선택 초기화
    document.getElementById('categorySelect').value = 'animals'; // 기본값으로 'animals' 선택
    document.getElementById('difficultySelect').value = 'easy'; // 기본값으로 'easy' 선택
}
