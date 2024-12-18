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

    // 주사위 숫자에 따른 회전 각도 매핑 (D6 기준)
    const diceRotationMap = {
        1: { x: 0, y: 0 },
        2: { x: -90, y: 0 },
        3: { x: 0, y: -90 },
        4: { x: 0, y: 90 },
        5: { x: 90, y: 0 },
        6: { x: 180, y: 0 }
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
            const roll = Math.floor(Math.random() * maxValue) + 1;
            total += roll;
            rollResults.push(roll);

            // 주사위 요소 생성
            const die = document.createElement('div');
            die.classList.add('die', 'rolling');

            // 주사위 각 면 생성
            for (let face = 1; face <= 6; face++) {
                const faceDiv = document.createElement('div');
                faceDiv.classList.add('face');
                faceDiv.textContent = face;
                die.appendChild(faceDiv);
            }

            // D6 주사위일 경우 회전 각도 적용
            if (diceType === 6) {
                const rotation = diceRotationMap[roll];
                die.style.transform = `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`;
            } else {
                // D8, D10 등 다른 주사위는 숫자만 표시
                die.innerHTML = `<div class="face">${roll}</div>`;
            }

            // 애니메이션이 끝난 후 클래스 제거
            die.addEventListener('animationend', () => {
                die.classList.remove('rolling');
            });

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
