// typingscript.js

document.addEventListener("DOMContentLoaded", () => {
    const startScreen = document.getElementById("start-screen");
    const gameScreen = document.getElementById("game-screen");
    const difficultyButtons = document.querySelectorAll(".difficulty-button");
    const wordContainer = document.getElementById("word-container");
    const wordInput = document.getElementById("word-input");
    const scoreElement = document.getElementById("score");
    const levelElement = document.getElementById("level");
    const livesElement = document.getElementById("lives");
    const successSound = document.getElementById("success-sound");

    // 팝업 관련 요소
    const scorePopup = document.getElementById("score-popup");
    const playerNameInput = document.getElementById("player-name");
    const submitScoreButton = document.getElementById("submit-score");
    const closePopupButton = document.getElementById("close-popup");
    const rankingsContainer = document.getElementById("rankings");

    // Firestore 컬렉션 이름
    const COLLECTION_NAME = "scores";

    // Firebase 초기화
    const firebaseConfig = {
        apiKey: "AIzaSyCwVxx0Pxd7poc_zGSp1aY9qfd89bpVUW0", // 실제 API 키로 대체
        authDomain: "finddalbong.firebaseapp.com",
        projectId: "finddalbong",
        storageBucket: "finddalbong.firebasestorage.app",
        messagingSenderId: "982765399272",
        appId: "1:982765399272:web:02344ab408272c60e2ad5d"
    };

    // Firebase 초기화
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    let selectedDifficulty = null;
    let score = 0;
    let level = 1;
    let lives = 3;
    let wordList = [];
    let gameInterval;
    let levelInterval;
    let speedIncreaseInterval;
    const initialWordSpeed = 5000; // 초기 단어 생성 간격 (밀리초)
    let currentWordSpeed = initialWordSpeed;

    // 게임 종료 상태 플래그 추가
    let isGameOver = false;

    // 단어 데이터 로드
    fetch('typingdata.json')
        .then(response => response.json())
        .then(data => {
            wordList = data;
        })
        .catch(error => console.error('단어 데이터를 로드하는 중 오류 발생:', error));

    // 난이도 선택
    difficultyButtons.forEach(button => {
        button.addEventListener("click", () => {
            // 모든 버튼의 선택 상태 제거
            difficultyButtons.forEach(btn => btn.classList.remove("selected"));
            // 클릭한 버튼만 선택 상태 추가
            button.classList.add("selected");
            selectedDifficulty = button.dataset.difficulty;
            // 게임 시작
            startGame();
        });
    });

    function startGame() {
        // 시작 화면 숨기기
        startScreen.classList.remove("active");
        startScreen.classList.add("hidden");
        // 게임 화면 보이기
        gameScreen.style.display = "block";
        // 게임 초기화
        initializeGame();
    }

    function initializeGame() {
        score = 0;
        level = 1;
        lives = 3;
        isGameOver = false; // 게임 시작 시 플래그 초기화
        currentWordSpeed = initialWordSpeed;
        updateScore();
        updateLevel();
        updateLives();
        wordInput.value = "";
        wordInput.focus();

        // 단어 생성 간격 설정
        gameInterval = setInterval(addWord, currentWordSpeed);
        // 레벨 증가 간격 설정 (예: 30초마다 레벨 증가)
        levelInterval = setInterval(increaseLevel, 30000);
        // 속도 증가 간격 설정 (예: 10초마다 속도 10% 증가)
        speedIncreaseInterval = setInterval(increaseSpeed, 10000);
    }

    function addWord() {
        if (isGameOver) return; // 게임 종료 시 단어 추가 중단

        // 난이도와 타입에 따른 필터링
        const filteredList = wordList.filter(wordObj => {
            if (selectedDifficulty === "easy") {
                return wordObj.difficulty === "easy" && wordObj.type === "word";
            } else if (selectedDifficulty === "medium") {
                return wordObj.difficulty === "medium" && wordObj.type === "word";
            } else if (selectedDifficulty === "hard") {
                return wordObj.difficulty === "hard" && wordObj.type === "math";
            }
            return false;
        });

        if (filteredList.length === 0) return; // 필터링된 단어가 없을 경우 추가하지 않음

        const randomIndex = Math.floor(Math.random() * filteredList.length);
        const wordObj = filteredList[randomIndex];
        const type = wordObj.type;

        let displayText, correctAnswer;

        if (type === "word") {
            displayText = wordObj.word;
            correctAnswer = wordObj.word.toLowerCase();
        } else if (type === "math") {
            displayText = wordObj.question;
            correctAnswer = wordObj.answer.toLowerCase();
        } else {
            // 타입이 지정되지 않은 경우 기본 단어 사용
            displayText = wordObj.word;
            correctAnswer = wordObj.word.toLowerCase();
        }

        const wordElement = document.createElement("div");
        wordElement.classList.add("falling-word");
        wordElement.textContent = displayText;
        wordElement.dataset.correctAnswer = correctAnswer;

        // 난이도에 따른 점수 설정
        let wordScore = 10; // 기본 점수
        if (wordObj.difficulty === "medium") {
            wordScore = 20;
        } else if (wordObj.difficulty === "hard") {
            wordScore = 30;
        }
        wordElement.dataset.score = wordScore;

        // 랜덤한 위치 설정
        const wordWidth = 100; // 단어의 가정된 폭
        const maxLeft = window.innerWidth - wordWidth - 20; // 여백 고려
        const left = Math.floor(Math.random() * maxLeft) + 10; // 최소 10px 여백
        wordElement.style.left = `${left}px`;
        wordElement.style.animationDuration = `${getRandomSpeed()}s`;

        wordContainer.appendChild(wordElement);

        // 단어가 화면을 벗어났을 때 제거 및 생명 감소
        wordElement.addEventListener("animationend", () => {
            if (wordContainer.contains(wordElement)) {
                wordContainer.removeChild(wordElement);
                if (isGameOver) return; // 게임 종료 시 생명 감소 방지

                lives -= 1;
                updateLives();
                if (lives <= 0) {
                    endGame();
                }
            }
        });
    }

    function getRandomSpeed() {
        return Math.random() * 3 + 4; // 4초에서 7초 사이
    }

    function increaseLevel() {
        level += 1;
        updateLevel();
        // 레벨이 올라갈 때마다 추가적인 난이도 조정 가능
    }

    function increaseSpeed() {
        currentWordSpeed = Math.max(currentWordSpeed - 500, 1000); // 최소 단어 생성 간격 1초
        clearInterval(gameInterval);
        gameInterval = setInterval(addWord, currentWordSpeed);

        // 현재 단어들의 애니메이션 속도 증가
        Array.from(wordContainer.children).forEach(word => {
            const newDuration = parseFloat(word.style.animationDuration) * 0.9; // 10% 빠르게
            word.style.animationDuration = `${newDuration}s`;
        });
    }

    function endGame() {
        isGameOver = true; // 게임 종료 플래그 설정
        clearInterval(gameInterval);
        clearInterval(levelInterval);
        clearInterval(speedIncreaseInterval);
        alert(`게임 종료! 최종 점수: ${score}`);
        // 모든 단어 제거
        removeAllWords();
        // 팝업 표시
        showScorePopup();
    }

    function removeAllWords() {
        while (wordContainer.firstChild) {
            wordContainer.removeChild(wordContainer.firstChild);
        }
    }

    function showScorePopup() {
        scorePopup.classList.remove("hidden");
        // 난이도별 순위 로드
        loadRankings();
    }

    function hideScorePopup() {
        scorePopup.classList.add("hidden");
    }

    async function loadRankings() {
        rankingsContainer.innerHTML = ""; // 기존 순위 초기화

        const difficulties = ["easy", "medium", "hard"];

        for (const difficulty of difficulties) {
            const rankingList = document.createElement("div");
            rankingList.innerHTML = `<h4>${capitalizeFirstLetter(difficulty)} 난이도 순위</h4>`;

            const querySnapshot = await db.collection(COLLECTION_NAME)
                .where("difficulty", "==", difficulty)
                .orderBy("score", "desc")
                .limit(5)
                .get();

            const list = document.createElement("ul");
            list.classList.add("rank-list");

            if (querySnapshot.empty) {
                const noData = document.createElement("li");
                noData.textContent = "아직 기록이 없습니다.";
                list.appendChild(noData);
            } else {
                querySnapshot.forEach((doc, index) => {
                    const data = doc.data();
                    const listItem = document.createElement("li");
                    listItem.textContent = `${index + 1}. ${data.name} - ${data.score}점`;
                    list.appendChild(listItem);
                });
            }

            rankingList.appendChild(list);
            rankingsContainer.appendChild(rankingList);
        }
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    submitScoreButton.addEventListener("click", async () => {
        const playerName = playerNameInput.value.trim();
        if (playerName === "") {
            alert("이름을 입력해주세요.");
            return;
        }

        // 데이터 저장
        try {
            await db.collection(COLLECTION_NAME).add({
                name: playerName,
                difficulty: selectedDifficulty,
                score: score,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert("기록이 저장되었습니다!");
            // 입력창 초기화 및 팝업 닫기
            playerNameInput.value = "";
            hideScorePopup();
            // 순위 다시 로드
            loadRankings();
        } catch (error) {
            console.error("기록 저장 중 오류 발생:", error);
            alert("기록 저장에 실패했습니다. 다시 시도해주세요.");
        }
    });

    closePopupButton.addEventListener("click", () => {
        hideScorePopup();
    });

    // 'input' 이벤트로 변경하여 입력할 때마다 단어(문제) 확인
    wordInput.addEventListener("input", () => {
        const inputValue = wordInput.value.trim().toLowerCase();
        if (inputValue === "") return;

        // 맞춘 단어(문제) 찾기
        const matchedWord = Array.from(wordContainer.children).find(word => word.dataset.correctAnswer === inputValue);

        if (matchedWord) {
            const wordScore = parseInt(matchedWord.dataset.score) || 10;
            score += wordScore;
            updateScore();
            matchedWord.classList.add("matched"); // 시각 효과 추가
            successSound.currentTime = 0;
            successSound.play(); // 효과음 재생
            // 단어 제거 후 애니메이션 효과 제거
            setTimeout(() => {
                if (wordContainer.contains(matchedWord)) {
                    wordContainer.removeChild(matchedWord);
                }
            }, 500); // 애니메이션 효과 시간과 일치시킴

            // 입력창 초기화 강화
            wordInput.value = "";
            wordInput.blur(); // 포커스 잠시 제거
            setTimeout(() => {
                wordInput.focus(); // 포커스 다시 설정
            }, 0);
        }
    });

    function updateScore() {
        scoreElement.textContent = score.toString();
    }

    function updateLevel() {
        levelElement.textContent = level.toString();
    }

    function updateLives() {
        livesElement.textContent = lives.toString();
    }

    // 모바일에서 가상 키보드가 나타날 때 입력창에 포커스 유지
    window.addEventListener('resize', () => {
        wordInput.focus();
    });
});
