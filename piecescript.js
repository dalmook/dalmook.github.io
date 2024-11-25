
const firebaseConfig = {
    apiKey: "AIzaSyBeCVOghDQw8hPdp0JrHovXcU7d7aKmmFE",
    authDomain: "piecechoice.firebaseapp.com",
    projectId: "piecechoice",
    storageBucket: "piecechoice.firebasestorage.app",
    messagingSenderId: "1048561191876",
    appId: "1:1048561191876:web:43e94b515fd260aceb7291"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM 요소 선택
const grid = document.getElementById("grid");
const wordList = document.getElementById("words-to-find");
const result = document.getElementById("result");
const difficultySelect = document.getElementById("difficulty");
const startButton = document.getElementById("start-game");
const viewLeaderboardButton = document.getElementById("view-leaderboard"); // "기록 보기" 버튼
const timerDisplay = document.getElementById("timer");

let wordsToFind = [];
let gridWords = [];
let gridSize = 5; // 기본 크기
let wordCount = 5; // 기본 단어 개수
let isDragging = false;
let selectedIndexes = [];
let selectedWord = "";
let startTime, timerInterval;
let selectedDirection = { row: 0, col: 0 }; // 드래그 방향 저장

// 난이도 설정
const difficulties = {
    easy: { gridSize: 5, wordCount: 5 },
    medium: { gridSize: 7, wordCount: 7 },
    hard: { gridSize: 9, wordCount: 9 },
};

// 난이도에 따라 그리드와 단어 생성
function generateGame() {
    const difficulty = difficultySelect.value;
    gridSize = difficulties[difficulty].gridSize;
    wordCount = difficulties[difficulty].wordCount;

    // 기존 난이도 클래스 제거
    grid.classList.remove('easy', 'medium', 'hard');

    // 현재 난이도 클래스 추가
    grid.classList.add(difficulty);    

    // 단어 목록과 그리드 초기화
    wordsToFind = generateWords(wordCount);
    gridWords = generateGridWithWords(gridSize, wordsToFind);

    // UI 초기화
    grid.innerHTML = "";
    wordList.innerHTML = "";
    result.textContent = "";
    timerDisplay.textContent = "걸린 시간: 0초";

    createGrid();
    createWordList();

    // 타이머 시작
    startTimer();
}

// 랜덤한 단어 생성
function generateWords(count) {
    const sampleWords = ["감독자", "평범", "환희", "독자", "탐험", "구조", "소망", "화학", "정직","나노시티"];
    return sampleWords.slice(0, count);
}

// 찾을 단어를 포함한 그리드 생성
function generateGridWithWords(size, words) {
    const grid = Array.from({ length: size }, () =>
        Array.from({ length: size }, () => "")
    );

    words.forEach((word) => {
        let placed = false;

        while (!placed) {
            const direction = getRandomDirection();
            const startRow = Math.floor(Math.random() * size);
            const startCol = Math.floor(Math.random() * size);

            if (canPlaceWord(grid, word, startRow, startCol, direction)) {
                placeWord(grid, word, startRow, startCol, direction);
                placed = true;
            }
        }
    });

    // 나머지 빈 공간을 랜덤 문자로 채움
    const letters = "가나다라마바사아자차카타파하";
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            if (grid[row][col] === "") {
                grid[row][col] = letters.charAt(Math.floor(Math.random() * letters.length));
            }
        }
    }

    // 1차원 배열로 변환
    return grid.flat();
}

// 랜덤 방향 선택
function getRandomDirection() {
    const directions = ["horizontal", "vertical", "diagonal"];
    return directions[Math.floor(Math.random() * directions.length)];
}

// 단어를 배치할 수 있는지 확인
function canPlaceWord(grid, word, row, col, direction) {
    const size = grid.length;
    const wordLength = word.length;

    if (direction === "horizontal" && col + wordLength > size) return false;
    if (direction === "vertical" && row + wordLength > size) return false;
    if (direction === "diagonal" && (col + wordLength > size || row + wordLength > size)) return false;

    for (let i = 0; i < wordLength; i++) {
        const newRow = direction === "vertical" || direction === "diagonal" ? row + i : row;
        const newCol = direction === "horizontal" || direction === "diagonal" ? col + i : col;

        if (grid[newRow][newCol] !== "" && grid[newRow][newCol] !== word[i]) return false;
    }

    return true;
}

// 단어를 그리드에 배치
function placeWord(grid, word, row, col, direction) {
    for (let i = 0; i < word.length; i++) {
        const newRow = direction === "vertical" || direction === "diagonal" ? row + i : row;
        const newCol = direction === "horizontal" || direction === "diagonal" ? col + i : col;
        grid[newRow][newCol] = word[i];
    }
}

// 그리드 생성
function createGrid() {
    grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    gridWords.forEach((letter, index) => {
        const cell = document.createElement("div");
        cell.textContent = letter;
        cell.dataset.index = index;
        cell.classList.add("grid-item"); // 셀에 클래스 추가

        // 포인터 이벤트 (마우스와 터치 모두 처리)
        cell.addEventListener("pointerdown", (e) => {
            console.log("pointerdown", index); // 디버깅용
            e.preventDefault(); // 기본 포인터 동작 방지
            startDragging(index, cell);
        });

        cell.addEventListener("pointermove", (e) => {
            if (!isDragging) return;
            console.log("pointermove", index); // 디버깅용

            const pointerX = e.clientX;
            const pointerY = e.clientY;
            const target = document.elementFromPoint(pointerX, pointerY);

            if (target && target.classList.contains("grid-item")) {
                const targetIndex = parseInt(target.dataset.index, 10);
                if (!selectedIndexes.includes(targetIndex) && isValidMove(selectedIndexes[selectedIndexes.length - 1], targetIndex)) {
                    dragOver(targetIndex, target);
                }
            }
        });

        cell.addEventListener("pointerup", () => {
            console.log("pointerup"); // 디버깅용
            stopDragging();
        });

        grid.appendChild(cell);
    });

    // 포인터가 그리드 밖으로 나갔을 때도 드래그 종료
    grid.addEventListener("pointerleave", () => {
        if (isDragging) {
            stopDragging();
        }
    });
}

// 단어 목록 생성
function createWordList() {
    wordsToFind.forEach((word) => {
        const li = document.createElement("li");
        li.textContent = word;
        li.dataset.word = word;
        wordList.appendChild(li);
    });
}

// 드래그 시작 (포인터용)
function startDragging(index, cell) {
    isDragging = true;
    selectedIndexes = [index];
    selectedWord = gridWords[index];
    cell.classList.add("selected");
}

// 드래그 중 (포인터용)
function dragOver(index, cell) {
    selectedIndexes.push(index);
    selectedWord += gridWords[index];
    cell.classList.add("selected");
}

// 드래그 종료 (포인터용)
function stopDragging() {
    if (!isDragging) return;
    isDragging = false;
    checkWord();
    resetSelection();
}

// 유효한 이동인지 확인 (포인터용)
function isValidMove(lastIndex, currentIndex) {
    const lastRow = Math.floor(lastIndex / gridSize);
    const lastCol = lastIndex % gridSize;
    const currentRow = Math.floor(currentIndex / gridSize);
    const currentCol = currentIndex % gridSize;

    // 현재 선택된 방향이 없다면 첫 번째 이동에서 방향 결정
    if (selectedIndexes.length === 1) {
        const rowDiff = currentRow - lastRow;
        const colDiff = currentCol - lastCol;

        if (Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1) {
            // 가로, 세로, 대각선 방향인지 확인
            if (rowDiff === 0 || colDiff === 0 || Math.abs(rowDiff) === Math.abs(colDiff)) {
                selectedDirection = { row: rowDiff, col: colDiff }; // 방향 저장
                return true;
            }
        }
        return false;
    }

    // 이후 이동에서는 저장된 방향과 일치하는지 확인
    const prevDirection = selectedDirection;
    const rowDiff = currentRow - Math.floor(lastIndex / gridSize);
    const colDiff = currentCol - (lastIndex % gridSize);

    return (
        rowDiff === prevDirection.row &&
        colDiff === prevDirection.col
    );
}

// 단어 확인
function checkWord() {
    const wordIndex = wordsToFind.indexOf(selectedWord);
    if (wordIndex !== -1) {
        result.textContent = `정답! ${selectedWord}`;
        result.style.color = "green";

        const foundWord = document.querySelector(`li[data-word="${selectedWord}"]`);
        foundWord.classList.add("found");
        wordsToFind.splice(wordIndex, 1);

        // 선택된 셀 하이라이트
        selectedIndexes.forEach(i => {
            const selectedCell = document.querySelector(`.grid div[data-index="${i}"]`);
            selectedCell.classList.add("found");
        });

        if (wordsToFind.length === 0) {
            clearInterval(timerInterval);
            result.textContent += " 모든 단어를 찾았습니다!";
            showNameForm(); // 이름 입력 폼 표시
        }
    } else {
        result.textContent = "오답입니다. 다시 시도하세요!";
        result.style.color = "red";
    }
}

// 이름 입력 폼 표시 함수
function showNameForm() {
    document.getElementById("overlay").style.display = "block"; // 오버레이 표시
    document.getElementById("name-form").style.display = "block"; // 이름 입력 폼 표시
}

// 이름 제출 버튼 이벤트
document.getElementById("submit-name").addEventListener("click", () => {
    const playerName = document.getElementById("player-name").value.trim();
    if (playerName === "") {
        alert("이름을 입력해주세요.");
        return;
    }

    const difficulty = difficultySelect.value;
    const elapsedTimeText = timerDisplay.textContent;
    const elapsedTime = parseInt(elapsedTimeText.replace("걸린 시간: ", "").replace("초", ""), 10);

    // Firebase에 데이터 저장
    db.collection("leaderboard").add({
        name: playerName,
        difficulty: difficulty,
        time: elapsedTime,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert("게임 결과가 저장되었습니다!");
        document.getElementById("overlay").style.display = "none"; // 오버레이 숨기기
        document.getElementById("name-form").style.display = "none"; // 이름 입력 폼 숨기기
        showLeaderboard(); // 리더보드 표시
    })
    .catch((error) => {
        console.error("Error adding document: ", error);
    });
});

// 리더보드 표시 함수 수정
function showLeaderboard() {
    console.log("showLeaderboard 함수 호출됨"); // 디버깅용

    const leaderboard = document.getElementById("leaderboard");
    const leaderboardBody = document.getElementById("leaderboard-body");
    leaderboardBody.innerHTML = ""; // 기존 데이터 초기화

    const difficulty = difficultySelect.value;
    console.log("현재 난이도:", difficulty); // 디버깅용

    db.collection("leaderboard")
        .where("difficulty", "==", difficulty)
        .orderBy("time", "asc")
        .limit(10) // 상위 10개만 표시
        .get()
        .then((querySnapshot) => {
            console.log(`Firestore에서 ${querySnapshot.size}개의 기록을 가져옴`); // 디버깅용
            if (querySnapshot.empty) {
                console.log("해당 난이도에 대한 기록이 없음");
                const tr = document.createElement("tr");
                const td = document.createElement("td");
                td.colSpan = 4;
                td.textContent = "기록이 없습니다.";
                tr.appendChild(td);
                leaderboardBody.appendChild(tr);
            } else {
                querySnapshot.forEach((doc, index) => {
                    const data = doc.data();
                    console.log(`Record ${index + 1}:`, data); // 디버깅용

                    const tr = document.createElement("tr");

                    const rankTd = document.createElement("td");
                    rankTd.textContent = index + 1;
                    tr.appendChild(rankTd);

                    const nameTd = document.createElement("td");
                    nameTd.textContent = data.name;
                    tr.appendChild(nameTd);

                    const difficultyTd = document.createElement("td");
                    difficultyTd.textContent = data.difficulty;
                    tr.appendChild(difficultyTd);

                    const timeTd = document.createElement("td");
                    timeTd.textContent = data.time;
                    tr.appendChild(timeTd);

                    leaderboardBody.appendChild(tr);
                });
            }

            leaderboard.style.display = "block"; // 리더보드 표시
            console.log("리더보드가 화면에 표시됨"); // 디버깅용
        })
        .catch((error) => {
            console.error("Firestore에서 문서를 가져오는 중 오류 발생: ", error);
        });
}

// 리더보드 닫기 버튼 이벤트 리스너 추가
document.getElementById("close-leaderboard").addEventListener("click", () => {
    console.log("리더보드 닫기 버튼 클릭됨"); // 디버깅용
    document.getElementById("leaderboard").style.display = "none"; // 리더보드 숨기기
});

// "기록 보기" 버튼 이벤트 리스너 추가
viewLeaderboardButton.addEventListener("click", () => {
    console.log("기록 보기 버튼 클릭됨"); // 디버깅용
    showLeaderboard(); // 리더보드 표시 함수 호출
});

// 선택 초기화
function resetSelection() {
    selectedIndexes = [];
    selectedWord = "";
    selectedDirection = { row: 0, col: 0 };
    document.querySelectorAll(".grid div").forEach((cell) => {
        cell.classList.remove("selected");
    });
}

// 타이머 시작
function startTimer() {
    startTime = Date.now();
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        timerDisplay.textContent = `걸린 시간: ${elapsedTime}초`;
    }, 1000);
}

// 게임 시작 버튼 이벤트
startButton.addEventListener("click", generateGame);

// 난이도 변경 시 리더보드 업데이트
difficultySelect.addEventListener("change", () => {
    showLeaderboard();
});

// 초기 게임 생성
generateGame();

