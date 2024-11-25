const grid = document.getElementById("grid");
const wordList = document.getElementById("words-to-find");
const result = document.getElementById("result");
const difficultySelect = document.getElementById("difficulty");
const startButton = document.getElementById("start-game");
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

// 터치 선택을 위한 변수
let firstTapIndex = null;

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
  const sampleWords = ["감독자", "평범", "환회", "독자", "탐험", "구조", "소망", "화학", "정직"];
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

    // 마우스 이벤트 (데스크탑)
    cell.addEventListener("mousedown", () => startDragging(index, cell));
    cell.addEventListener("mouseover", () => dragOver(index, cell));
    cell.addEventListener("mouseup", stopDragging);

    // 터치 이벤트 (모바일)
    cell.addEventListener("touchstart", (e) => {
      e.preventDefault(); // 기본 터치 동작 방지
      handleTap(index, cell);
    }, { passive: false });

    grid.appendChild(cell);
  });

  // 마우스 및 터치가 그리드 밖으로 나갔을 때도 드래그 종료
  grid.addEventListener("mouseleave", () => {
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

// 드래그 시작 (마우스용)
function startDragging(index, cell) {
  isDragging = true;
  selectedIndexes = [index];
  selectedWord = gridWords[index];
  cell.classList.add("selected");
}

// 드래그 중 (마우스용)
function dragOver(index, cell) {
  if (!isDragging || selectedIndexes.includes(index)) return;

  const lastIndex = selectedIndexes[selectedIndexes.length - 1];
  if (isValidMove(lastIndex, index)) {
    selectedIndexes.push(index);
    selectedWord += gridWords[index];
    cell.classList.add("selected");
  }
}

// 드래그 종료 (마우스용)
function stopDragging() {
  if (!isDragging) return;
  isDragging = false;
  checkWord();
  resetSelection();
}

// 터치 선택 핸들러 (모바일용)
function handleTap(index, cell) {
  if (firstTapIndex === null) {
    // 첫 번째 탭
    firstTapIndex = index;
    cell.classList.add("selected");
  } else {
    // 두 번째 탭
    const secondTapIndex = index;
    if (isValidTapSelection(firstTapIndex, secondTapIndex)) {
      // 선택된 범위의 단어 생성
      const selectedCells = getSelectedCells(firstTapIndex, secondTapIndex);
      selectedWord = selectedCells.map(i => gridWords[i]).join("");

      // 단어 확인
      const wordIndex = wordsToFind.indexOf(selectedWord);
      if (wordIndex !== -1) {
        result.textContent = `정답! ${selectedWord}`;
        result.style.color = "green";

        const foundWord = document.querySelector(`li[data-word="${selectedWord}"]`);
        foundWord.classList.add("found");
        wordsToFind.splice(wordIndex, 1);

        // 선택된 셀 하이라이트
        selectedCells.forEach(i => {
          const selectedCell = document.querySelector(`.grid div[data-index="${i}"]`);
          selectedCell.classList.add("found");
        });

        if (wordsToFind.length === 0) {
          clearInterval(timerInterval);
          result.textContent += " 모든 단어를 찾았습니다!";
        }
      } else {
        result.textContent = "오답입니다. 다시 시도하세요!";
        result.style.color = "red";
      }
    } else {
      result.textContent = "잘못된 선택입니다. 다시 시도하세요!";
      result.style.color = "red";
    }

    // 선택 초기화
    resetSelection();
  }
}

// 유효한 터치 선택인지 확인
function isValidTapSelection(firstIndex, secondIndex) {
  const firstRow = Math.floor(firstIndex / gridSize);
  const firstCol = firstIndex % gridSize;
  const secondRow = Math.floor(secondIndex / gridSize);
  const secondCol = secondIndex % gridSize;

  const rowDiff = secondRow - firstRow;
  const colDiff = secondCol - firstCol;

  // 가로, 세로, 대각선 방향인지 확인
  if (Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1) {
    if (rowDiff === 0 || colDiff === 0 || Math.abs(rowDiff) === Math.abs(colDiff)) {
      return true;
    }
  }
  return false;
}

// 선택된 두 셀 사이의 모든 셀 인덱스 반환
function getSelectedCells(firstIndex, secondIndex) {
  const firstRow = Math.floor(firstIndex / gridSize);
  const firstCol = firstIndex % gridSize;
  const secondRow = Math.floor(secondIndex / gridSize);
  const secondCol = secondIndex % gridSize;

  const cells = [];

  const rowStep = secondRow > firstRow ? 1 : secondRow < firstRow ? -1 : 0;
  const colStep = secondCol > firstCol ? 1 : secondCol < firstCol ? -1 : 0;

  let currentRow = firstRow;
  let currentCol = firstCol;

  while (currentRow !== secondRow || currentCol !== secondCol) {
    const currentIndex = currentRow * gridSize + currentCol;
    cells.push(currentIndex);
    currentRow += rowStep;
    currentCol += colStep;
  }
  cells.push(secondIndex); // 마지막 셀 추가

  return cells;
}

// 유효한 이동인지 확인 (마우스용)
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

    if (wordsToFind.length === 0) {
      clearInterval(timerInterval);
      result.textContent += " 모든 단어를 찾았습니다!";
    }
  } else {
    result.textContent = "오답입니다. 다시 시도하세요!";
    result.style.color = "red";
  }
}

// 선택 초기화
function resetSelection() {
  isDragging = false;
  selectedIndexes = [];
  selectedWord = "";
  firstTapIndex = null;
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

// 초기 게임 생성
generateGame();
