const imageInput = document.getElementById('imageInput');
const difficultySelect = document.getElementById('difficultySelect');
const startGameButton = document.getElementById('startGame');
const gameArea = document.getElementById('gameArea');
const puzzleCanvas = document.getElementById('puzzleCanvas');
const ctx = puzzleCanvas.getContext('2d');

let image = new Image();
let gridSize = 0;

startGameButton.addEventListener('click', () => {
    const difficulty = parseInt(difficultySelect.value);
    gridSize = Math.sqrt(difficulty); // 조각 크기 결정
    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            image.src = e.target.result;
            image.onload = () => {
                setupPuzzle(image, gridSize);
            };
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        alert('사진을 선택하세요!');
    }
});

function setupPuzzle(image, gridSize) {
    gameArea.classList.remove('hidden');
    puzzleCanvas.width = image.width;
    puzzleCanvas.height = image.height;
    const pieceWidth = image.width / gridSize;
    const pieceHeight = image.height / gridSize;
    const pieces = [];

    // 조각 생성
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            pieces.push({
                sx: x * pieceWidth,
                sy: y * pieceHeight,
                width: pieceWidth,
                height: pieceHeight,
            });
        }
    }

    shuffle(pieces);

    // 조각 섞어서 캔버스에 그림
    pieces.forEach((piece, index) => {
        const dx = (index % gridSize) * pieceWidth;
        const dy = Math.floor(index / gridSize) * pieceHeight;
        ctx.drawImage(
            image,
            piece.sx,
            piece.sy,
            piece.width,
            piece.height,
            dx,
            dy,
            piece.width,
            piece.height
        );
    });
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
