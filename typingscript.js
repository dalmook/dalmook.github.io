// typingscript.js

document.addEventListener("DOMContentLoaded", () => {
    const wordContainer = document.getElementById("word-container");
    const wordInput = document.getElementById("word-input");
    const scoreElement = document.getElementById("score");
    let score = 0;
    let wordList = [];
    const wordSpeed = 3000; // 단어 생성 간격을 3초로 설정

    // 단어 데이터 로드
    fetch('typingdata.json')
        .then(response => response.json())
        .then(data => {
            wordList = data;
            startGame();
        })
        .catch(error => console.error('단어 데이터를 로드하는 중 오류 발생:', error));

    function startGame() {
        setInterval(addWord, wordSpeed);
    }

    function addWord() {
        const wordText = wordList[Math.floor(Math.random() * wordList.length)];
        const wordElement = document.createElement("div");
        wordElement.classList.add("falling-word");
        wordElement.textContent = wordText;

        // 랜덤한 위치 설정
        const wordWidth = 100; // 단어의 가정된 폭
        const maxLeft = window.innerWidth - wordWidth;
        const left = Math.floor(Math.random() * maxLeft);
        wordElement.style.left = `${left}px`;
        wordElement.style.animationDuration = `${getRandomSpeed()}s`;

        wordContainer.appendChild(wordElement);

        // 단어가 화면을 벗어났을 때 제거
        wordElement.addEventListener("animationend", () => {
            wordContainer.removeChild(wordElement);
            // 선택적으로, 놓친 단어에 대한 페널티 추가 가능
            // 예: score -= 1;
            // updateScore();
        });
    }

    function getRandomSpeed() {
        return Math.random() * 3 + 3; // 3초에서 6초 사이로 변경
    }

    // 'keydown' 이벤트로 변경하여 'Enter' 키 입력 시 단어 확인
    wordInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            const inputValue = wordInput.value.trim().toLowerCase();
            if (inputValue === "") return;

            const matchedWord = Array.from(wordContainer.children).find(word => word.textContent.toLowerCase() === inputValue);
            if (matchedWord) {
                score += 10;
                updateScore();
                wordContainer.removeChild(matchedWord);
                wordInput.value = "";
                wordInput.focus();
            }
        }
    });

    function updateScore() {
        scoreElement.textContent = score.toString();
    }

    // 게임 종료 로직을 추가할 수 있습니다.
});
