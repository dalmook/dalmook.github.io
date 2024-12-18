// dicescript.js

document.addEventListener('DOMContentLoaded', () => {
    const rollButton = document.getElementById('rollButton');
    const numDiceInput = document.getElementById('numDice');
    const diceTypeSelect = document.getElementById('diceType');
    const diceContainer = document.getElementById('diceContainer');
    const totalDisplay = document.getElementById('total');
    const historyList = document.getElementById('historyList');
    const rollSound = document.getElementById('rollSound');

    // 주사위 종류에 따른 최대 값
    const diceMaxValues = {
        6: 6,
        8: 8,
        10: 10
    };

    rollButton.addEventListener('click', () => {
        let numDice = parseInt(numDiceInput.value);
        let diceType = parseInt(diceTypeSelect.value);
        let maxValue = diceMaxValues[diceType] || 6;

        // 입력값 검증
        if (isNaN(numDice) || numDice < 1) {
            numDice = 1;
            numDiceInput.value = 1;
        } else if (numDice > 10) {
            numDice = 10;
            numDiceInput.value = 10;
        }

        // 롤링 사운드 재생
        rollSound.currentTime = 0;
        rollSound.play();

        // 이전 주사위 제거
        diceContainer.innerHTML = '';
        let total = 0;
        let rollResults = [];

        for (let i = 0; i < numDice; i++) {
            const die = document.createElement('div');
            die.classList.add('die');

            // 주사위 굴리기
            const roll = Math.floor(Math.random() * maxValue) + 1;
            total += roll;
            rollResults.push(roll);

            // 주사위 표시
            if (maxValue === 6) {
                // D6 - 도트 표시
                die.textContent = ''; // 도트는 CSS로 처리
                die.classList.add(`num${roll}`);
            } else {
                // D8, D10 등 - 숫자 표시
                die.textContent = roll;
            }

            // 주사위를 컨테이너에 추가
            diceContainer.appendChild(die);
        }

        // 총 합 업데이트
        totalDisplay.textContent = total;

        // 히스토리에 추가
        const historyItem = document.createElement('li');
        historyItem.textContent = `${new Date().toLocaleString()} - ${numDice}개 ${diceType}면체: [${rollResults.join(', ')}] 합계: ${total}`;
        historyList.prepend(historyItem);

        // 히스토리 최대 개수 제한 (예: 20개)
        if (historyList.children.length > 20) {
            historyList.removeChild(historyList.lastChild);
        }
    });

    // Enter 키로 굴리기 트리거
    numDiceInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            rollButton.click();
        }
    });

    // 페이지 로드 시 초기 굴리기
    rollButton.click();
});
