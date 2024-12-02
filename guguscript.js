// guguscript.js

// 이미지 URL (무료 이미지 사용)
// 각 단을 나타낼 이미지를 설정합니다. 필요에 따라 추가하거나 변경할 수 있습니다.
const DAN_IMAGES = {
    1: 'images/사과.png',   // 1단: 사과 이미지 URL
    2: 'images/오렌지.png',   // 2단: 오렌지 이미지 URL
    3: 'images/바나나.png',   // 3단: 바나나 이미지 URL
    4: 'images/포도.png',   // 4단: 포도 이미지 URL
    5: 'images/키위.png',   // 5단: 키위 이미지 URL
    6: 'images/수박.png',   // 6단: 수박 이미지 URL
    7: 'images/딸기.png',   // 7단: 딸기 이미지 URL
    8: 'images/배.png',   // 8단: 배 이미지 URL
    9: 'images/감.png'    // 9단: 감 이미지 URL
};

const DAN_SELECT = document.getElementById('dan-select');
const DAN_INPUT = document.getElementById('dan-input');
const SUBMIT_BUTTON = document.getElementById('submit-dan');
const VISUAL_CONTAINER = document.getElementById('visual-container');
const FEEDBACK = document.getElementById('feedback');

SUBMIT_BUTTON.addEventListener('click', function() {
    let dan = DAN_SELECT.value;
    if (!dan) {
        dan = DAN_INPUT.value;
    }

    dan = parseInt(dan);

    if (dan >=1 && dan <=9){
        FEEDBACK.textContent = '';
        generateVisual(dan);
    } else {
        VISUAL_CONTAINER.innerHTML = '';
        FEEDBACK.textContent = '1부터 9까지의 단을 선택하거나 입력해주세요.';
    }
});

function generateVisual(dan){
    VISUAL_CONTAINER.innerHTML = ''; // 기존 내용 초기화

    for(let i=1; i<=9; i++){
        const result = dan * i;

        // Row container
        const row = document.createElement('div');
        row.classList.add('multiplication-row');

        // 곱셈 표현
        const expression = document.createElement('span');
        expression.textContent = `${dan} x ${i} = `;
        expression.classList.add('result');
        row.appendChild(expression);

        // 과일 그룹 컨테이너
        const fruitGroup = document.createElement('div');
        fruitGroup.classList.add('fruit-group');

        // 'i'개의 'dan' 이미지 추가
        for(let j=0; j<i; j++){
            const img = document.createElement('img');
            img.src = DAN_IMAGES[dan] || DAN_IMAGES[1]; // 단에 해당하는 이미지, 없으면 1단 이미지 사용
            img.alt = `단 ${dan}`;
            img.classList.add('fruit', 'fruit-enter');
            fruitGroup.appendChild(img);
        }

        row.appendChild(fruitGroup);

        // 총합 텍스트 추가
        const total = document.createElement('span');
        total.textContent = ` = ${result}`;
        total.classList.add('result');
        row.appendChild(total);

        VISUAL_CONTAINER.appendChild(row);
    }
}


        VISUAL_CONTAINER.appendChild(row);
    }
}
