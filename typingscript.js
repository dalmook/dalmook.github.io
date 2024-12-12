// typingscript.js

document.addEventListener("DOMContentLoaded", () => {
    // DOM 요소 선택
    const startScreen = document.getElementById("start-screen");
    const gameScreen = document.getElementById("game-screen");
    const difficultyButtons = document.querySelectorAll(".difficulty-button");
    const viewRecordsButton = document.querySelector(".view-records-button");
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

    const recordsPopup = document.getElementById("records-popup");
    const closeRecordsPopupButton = document.getElementById("close-records-popup");
    const tabButtons = document.querySelectorAll(".tab-button");
    const allRankingsContainer = document.getElementById("all-rankings");

    // Firebase 설정
    const firebaseConfig = {
        apiKey: "AIzaSyCwVxx0Pxd7poc_zGSp1aY9qfd89bpVUW0", // 실제 API 키로 대체
        authDomain: "finddalbong.firebaseapp.com",
        projectId: "finddalbong",
        storageBucket: "finddalbong.firebasestorage.app",
        messagingSenderId: "982765399272",
        appId: "1:982765399272:web:02344ab408272c60e2ad5d"
    };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const COLLECTION_NAME = "scores";

    // 게임 상태 변수
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
    let isGameOver = false;

    // 단어 데이터 로드
    fetch('typingdata.json')
        .then(response => response.json())
        .then(data => {
            wordList = data;
        })
        .catch(error => console.error('단어 데이터를 로드하는 중 오류 발생:', error));

    // 난이도 선택 이벤트 리스너
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

    // "기록보기" 버튼 클릭 이벤트 리스너
    if (viewRecordsButton) {
        viewRecordsButton.addEventListener("click", () => {
            recordsPopup.classList.remove("hidden");
            activateTab("한글"); // 기본 탭 활성화
        });
    }

    // 탭 버튼 클릭 이벤트 리스너
    tabButtons.forEach(tab => {
        tab.addEventListener("click", () => {
            // 모든 탭에서 active 클래스 제거
            tabButtons.forEach(t => t.classList.remove("active"));
            // 클릭한 탭에 active 클래스 추가
            tab.classList.add("active");
            const difficulty = tab.dataset.difficulty;
            activateTab(difficulty);
        });
    });

    // 탭 활성화 함수
    function activateTab(difficulty) {
        loadRankings(difficulty, allRankingsContainer);
    }

    // 게임 시작 함수
    function startGame() {
        startScreen.classList.add("hidden");
        gameScreen.style.display = "flex";
        initializeGame();
    }

    // 게임 초기화 함수
    function initializeGame() {
        score = 0;
        level = 1;
        lives = 3;
        isGameOver = false;
        currentWordSpeed = initialWordSpeed;
        updateScore();
        updateLevel();
        updateLives();
        wordInput.value = "";
        wordInput.focus();

        // 단어 생성 간격 설정
        gameInterval = setInterval(addWord, currentWordSpeed);
        // 레벨 증가 간격 설정 (예: 30초마다)
        levelInterval = setInterval(increaseLevel, 30000);
        // 속도 증가 간격 설정 (예: 10초마다 10% 속도 증가)
        speedIncreaseInterval = setInterval(increaseSpeed, 10000);
    }

    // 단어 추가 함수
    function addWord() {
        if (isGameOver) return;

        const filteredList = wordList.filter(wordObj => {
            if (selectedDifficulty === "한글" || selectedDifficulty === "영어") {
                return wordObj.difficulty === selectedDifficulty && wordObj.type === "word";
            } else if (selectedDifficulty === "산수") {
                return wordObj.difficulty === "산수" && wordObj.type === "math";
            }
            return false;
        });

        if (filteredList.length === 0) return;

        const randomIndex = Math.floor(Math.random() * filteredList.length);
        const wordObj = filteredList[randomIndex];
        const displayText = wordObj.type === "math" ? wordObj.question : wordObj.word;
        const correctAnswer = wordObj.type === "math" ? wordObj.answer.toLowerCase() : wordObj.word.toLowerCase();
        const wordScore = getWordScore(wordObj.difficulty);

        const wordElement = document.createElement("div");
        wordElement.classList.add("falling-word");
        wordElement.textContent = displayText;
        wordElement.dataset.correctAnswer = correctAnswer;
        wordElement.dataset.score = wordScore;

        // 랜덤 위치 설정
        const wordWidth = 100; // 가정된 단어 폭
        const maxLeft = window.innerWidth - wordWidth - 20;
        const left = Math.floor(Math.random() * maxLeft) + 10;
        wordElement.style.left = `${left}px`;
        wordElement.style.animationDuration = `${getRandomSpeed()}s`;

        wordContainer.appendChild(wordElement);

        // 단어가 화면을 벗어나면 제거 및 생명 감소
        wordElement.addEventListener("animationend", () => {
            if (wordContainer.contains(wordElement)) {
                wordContainer.removeChild(wordElement);
                if (!isGameOver) {
                    lives -= 1;
                    updateLives();
                    if (lives <= 0) {
                        endGame();
                    }
                }
            }
        });
    }

    // 단어 점수 결정 함수
    function getWordScore(difficulty) {
        switch (difficulty) {
            case "영어":
                return 20;
            case "산수":
                return 30;
            default:
                return 10;
        }
    }

    // 랜덤 속도 함수
    function getRandomSpeed() {
        return Math.random() * 3 + 4; // 4초에서 7초
    }

    // 레벨 증가 함수
    function increaseLevel() {
        level += 1;
        updateLevel();
    }

    // 속도 증가 함수
    function increaseSpeed() {
        currentWordSpeed = Math.max(currentWordSpeed - 500, 1000); // 최소 1초
        clearInterval(gameInterval);
        gameInterval = setInterval(addWord, currentWordSpeed);

        // 현재 단어들의 속도 증가
        Array.from(wordContainer.children).forEach(word => {
            const newDuration = parseFloat(word.style.animationDuration) * 0.9;
            word.style.animationDuration = `${newDuration}s`;
        });
    }

    // 게임 종료 함수
    function endGame() {
        isGameOver = true;
        clearInterval(gameInterval);
        clearInterval(levelInterval);
        clearInterval(speedIncreaseInterval);
        removeAllWords();
        showScorePopup();
    }

    // 모든 단어 제거 함수
    function removeAllWords() {
        while (wordContainer.firstChild) {
            wordContainer.removeChild(wordContainer.firstChild);
        }
    }

    // 점수 팝업 표시 함수
    function showScorePopup() {
        if (score > 0) {
            scorePopup.classList.remove("hidden");
            loadRankings(selectedDifficulty, rankingsContainer);
        } else {
            alert("0점은 기록되지 않습니다.");
            resetGame();
        }
    }

    // 점수 팝업 숨기기 함수
    function hideScorePopup() {
        scorePopup.classList.add("hidden");
        resetGame();
    }

    // 게임 재설정 함수
    function resetGame() {
        gameScreen.style.display = "none";
        startScreen.classList.remove("hidden");
        selectedDifficulty = null;
        difficultyButtons.forEach(btn => btn.classList.remove("selected"));
    }

    // 점수 업데이트 함수
    function updateScore() {
        scoreElement.textContent = score.toString();
    }

    // 레벨 업데이트 함수
    function updateLevel() {
        levelElement.textContent = level.toString();
    }

    // 생명 업데이트 함수
    function updateLives() {
        livesElement.innerHTML = '';
        for (let i = 0; i < lives; i++) {
            const img = document.createElement('img');
            img.src = 'images/poo.png';
            img.alt = 'Life';
            img.title = '생명';
            livesElement.appendChild(img);
        }
    }

    // 사용자 입력 처리
    wordInput.addEventListener("input", () => {
        const inputValue = wordInput.value.trim().toLowerCase();
        if (inputValue === "") return;

        const matchedWord = Array.from(wordContainer.children).find(word => word.dataset.correctAnswer === inputValue);

        if (matchedWord) {
            const wordScore = parseInt(matchedWord.dataset.score) || 10;
            score += wordScore;
            updateScore();
            matchedWord.classList.add("matched");
            successSound.currentTime = 0;
            successSound.play();

            setTimeout(() => {
                if (wordContainer.contains(matchedWord)) {
                    wordContainer.removeChild(matchedWord);
                }
            }, 500);

            wordInput.value = "";
            wordInput.focus();
        }
    });

    // 기록 저장 버튼 이벤트 리스너
    submitScoreButton.addEventListener("click", async () => {
        const playerName = playerNameInput.value.trim();
        if (playerName === "") {
            alert("이름을 입력해주세요.");
            return;
        }

        if (score <= 0) {
            alert("0점은 기록되지 않습니다.");
            hideScorePopup();
            return;
        }

        try {
            await db.collection(COLLECTION_NAME).add({
                name: playerName,
                difficulty: selectedDifficulty,
                score: score,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert("기록이 저장되었습니다!");
            playerNameInput.value = "";
            loadRankings(selectedDifficulty, rankingsContainer);
        } catch (error) {
            console.error("기록 저장 중 오류 발생:", error);
            alert("기록 저장에 실패했습니다. 다시 시도해주세요.");
        }
    });

    // 점수 팝업 닫기 버튼 이벤트 리스너
    if (closePopupButton) {
        closePopupButton.addEventListener("click", () => {
            hideScorePopup();
        });
    }

    // 전체 기록 보기 팝업 닫기 버튼 이벤트 리스너
    if (closeRecordsPopupButton) {
        closeRecordsPopupButton.addEventListener("click", () => {
            recordsPopup.classList.add("hidden");
        });
    }

    // 순위 로드 함수
    async function loadRankings(difficulty, container) {
        container.innerHTML = ""; // 기존 순위 초기화

        const rankingList = document.createElement("div");
        rankingList.innerHTML = `<h4>${capitalizeFirstLetter(difficulty)} 난이도 순위</h4>`;

        try {
            let query;
            if (difficulty) {
                query = db.collection(COLLECTION_NAME)
                    .where("difficulty", "==", difficulty)
                    .orderBy("score", "desc")
                    .limit(5);
            } else {
                query = db.collection(COLLECTION_NAME)
                    .orderBy("score", "desc")
                    .limit(10);
            }

            const querySnapshot = await query.get();
            const table = document.createElement("table");
            table.classList.add("rank-table");

            // 테이블 헤더
            const thead = document.createElement("thead");
            const headerRow = document.createElement("tr");
            const nameHeader = document.createElement("th");
            nameHeader.textContent = "이름";
            const scoreHeader = document.createElement("th");
            scoreHeader.textContent = "점수";
            headerRow.appendChild(nameHeader);
            headerRow.appendChild(scoreHeader);
            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement("tbody");

            if (querySnapshot.empty) {
                const noDataRow = document.createElement("tr");
                const noDataCell = document.createElement("td");
                noDataCell.colSpan = 2;
                noDataCell.textContent = "아직 기록이 없습니다.";
                noDataRow.appendChild(noDataCell);
                tbody.appendChild(noDataRow);
            } else {
                querySnapshot.forEach(doc => {
                    const data = doc.data();
                    const row = document.createElement("tr");

                    const nameCell = document.createElement("td");
                    nameCell.textContent = data.name;
                    const scoreCell = document.createElement("td");
                    scoreCell.textContent = `${data.score}점`;

                    row.appendChild(nameCell);
                    row.appendChild(scoreCell);
                    tbody.appendChild(row);
                });
            }

            table.appendChild(tbody);
            rankingList.appendChild(table);
            container.appendChild(rankingList);
        } catch (error) {
            console.error("순위 로드 중 오류 발생:", error);
            const errorMessage = document.createElement("p");
            errorMessage.textContent = "순위를 불러오는 중 오류가 발생했습니다.";
            rankingList.appendChild(errorMessage);
            container.appendChild(rankingList);
        }
    }

    // 대문자 변환 함수
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
});
