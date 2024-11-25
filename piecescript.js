const imageSelect = document.getElementById('imageSelect');
const difficultySelect = document.getElementById('difficultySelect');
const startGameButton = document.getElementById('startGame');
const gameArea = document.getElementById('gameArea');
const puzzleCanvas = document.getElementById('puzzleCanvas');
const ctx = puzzleCanvas.getContext('2d');

let image = new Image();
let gridSize = 0;
let pieces = [];
let selectedPiece = null;
let offsetX = 0;
let offsetY = 0;

startGameButton.addEventListener('click', () => {
    const difficulty = parseInt(difficultySelect.value);
    gridSize = Math.sqrt(difficulty); // 조각 크기 결정
    const imagePath = imageSelect.value;
    image.src = imagePath;
    image.onload = () => {
        setupPuzzle(image, gridSize);
    };
});

function setupPuzzle(image, gridSize) {
    gameArea.classList.remove('hidden');
    puzzleCanvas.width = image.width;
    puzzleCanvas.height = image.height;
    const pieceWidth = image.width / gridSize;
    const pieceHeight = image.height / gridSize;

    pieces = [];
    ctx.clearRect(0, 0, puzzleCanvas.width, puzzleCanvas.height);

    // 조각 생성
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            pieces.push({
                sx: x * pieceWidth,
                sy: y * pieceHeight,
                dx: Math.random() * (puzzleCanvas.width - pieceWidth),
                dy: Math.random() * (puzzleCanvas.height - pieceHeight),
                width: pieceWidth,
                height: pieceHeight,
            });
        }
    }

    drawPuzzle();
}

function drawPuzzle() {
    ctx.clearRect(0, 0, puzzleCanvas.width, puzzleCanvas.height);
    pieces.forEach((piece) => {
        ctx.drawImage(
            image,
            piece.sx,
            piece.sy,
            piece.width,
            piece.height,
            piece.dx,
            piece.dy,
            piece.width,
            piece.height
        );
        // 테두리 그리기 (선택 사항)
        ctx.strokeStyle = "black";
        ctx.strokeRect(piece.dx, piece.dy, piece.width, piece.height);
    });
}

// 퍼즐 조각 드래그 기능
puzzleCanvas.addEventListener('mousedown', (e) => {
    const { offsetX: mouseX, offsetY: mouseY } = e;

    selectedPiece = pieces.find(
        (piece) =>
            mouseX > piece.dx &&
            mouseX < piece.dx + piece.width &&
            mouseY > piece.dy &&
            mouseY < piece.dy + piece.height
    );

    if (selectedPiece) {
        offsetX = mouseX - selectedPiece.dx;
        offsetY = mouseY - selectedPiece.dy;
    }
});

puzzleCanvas.addEventListener('mousemove', (e) => {
    if (!selectedPiece) return;

    const { offsetX: mouseX, offsetY: mouseY } = e;

    selectedPiece.dx = mouseX - offsetX;
    selectedPiece.dy = mouseY - offsetY;

    drawPuzzle();
});

puzzleCanvas.addEventListener('mouseup', () => {
    selectedPiece = null;
});
