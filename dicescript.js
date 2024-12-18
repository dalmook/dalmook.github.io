// dicescript.js

document.addEventListener('DOMContentLoaded', () => {
    const rollButton = document.getElementById('rollButton');
    const numDiceInput = document.getElementById('numDice');
    const diceTypeSelect = document.getElementById('diceType');
    const diceContainer = document.getElementById('diceContainer');
    const totalDisplay = document.getElementById('total');
    const historyList = document.getElementById('historyList');
    const rollSound = document.getElementById('rollSound');
    const diceCanvas = document.getElementById('diceCanvas');

    // Three.js 관련 변수
    let scene, camera, renderer, controls;
    let diceModels = {}; // 주사위 종류별 모델 저장
    let activeDice = []; // 현재 활성화된 주사위

    // 주사위 종류에 따른 최대 값
    const diceMaxValues = {
        6: 6,
        8: 8,
        10: 10
    };

    // 주사위 굴림 결과에 따른 회전 각도 매핑 (D6 기준)
    const diceRotationMap = {
        1: { x: 0, y: 0 },
        2: { x: -90, y: 0 },
        3: { x: 0, y: -90 },
        4: { x: 0, y: 90 },
        5: { x: 90, y: 0 },
        6: { x: 180, y: 0 }
    };

    // Three.js 초기화
    function initThreeJS() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f8ff);

        const aspect = diceCanvas.clientWidth / diceCanvas.clientHeight;
        camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        camera.position.set(0, 5, 10);

        renderer = new THREE.WebGLRenderer({ canvas: diceCanvas, antialias: true });
        renderer.setSize(diceCanvas.clientWidth, diceCanvas.clientHeight);

        // 조명 추가
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(10, 10, 10);
        scene.add(directionalLight);

        // 카메라 컨트롤
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enablePan = false;
        controls.minDistance = 5;
        controls.maxDistance = 20;

        // 주사위 모델 로드
        const loader = new THREE.GLTFLoader();
        const diceTypes = Object.keys(diceMaxValues);

        diceTypes.forEach(type => {
            loader.load(
                `models/dice${type}.glb`, // 예: dice6.glb, dice8.glb, dice10.glb
                (gltf) => {
                    const model = gltf.scene;
                    model.scale.set(2, 2, 2);
                    diceModels[type] = model;
                },
                undefined,
                (error) => {
                    console.error(`주사위 모델 로드 실패: ${type}면체`, error);
                }
            );
        });

        animate();
    }

    // 애니메이션 루프
    function animate(time) {
        requestAnimationFrame(animate);
        controls.update();
        TWEEN.update(time);
        renderer.render(scene, camera);
    }

    // 주사위 굴리기 함수
    function rollDice(numDice, diceType) {
        const maxValue = diceMaxValues[diceType] || 6;
        const rollResults = [];
        let total = 0;

        // 기존 주사위 제거
        activeDice.forEach(die => {
            scene.remove(die);
        });
        activeDice = [];

        for (let i = 0; i < numDice; i++) {
            const roll = Math.floor(Math.random() * maxValue) + 1;
            rollResults.push(roll);
            total += roll;

            // 주사위 인스턴스 생성
            const dice = diceModels[diceType].clone();
            scene.add(dice);
            activeDice.push(dice);

            // 주사위 위치 설정
            dice.position.x = (i % 5) * 3 - 6; // 최대 5개까지 한 줄에 배치
            dice.position.y = 0;
            dice.position.z = Math.floor(i / 5) * 3 - 3;

            // 랜덤 회전 각도 설정
            const randomX = Math.floor(Math.random() * 4) * 90;
            const randomY = Math.floor(Math.random() * 4) * 90;
            const randomZ = Math.floor(Math.random() * 4) * 90;

            // 애니메이션을 통해 회전
            new TWEEN.Tween(dice.rotation)
                .to({
                    x: THREE.MathUtils.degToRad(randomX + (diceRotationMap[roll]?.x || 0)),
                    y: THREE.MathUtils.degToRad(randomY + (diceRotationMap[roll]?.y || 0)),
                    z: THREE.MathUtils.degToRad(randomZ)
                }, 2000)
                .easing(TWEEN.Easing.Quadratic.Out)
                .start();
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

        return rollResults;
    }

    // Three.js와 TWEEN 초기화
    initThreeJS();

    // 굴리기 버튼 클릭 이벤트
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

        // 주사위 종류 검증
        if (!diceModels[diceType]) {
            alert('선택한 주사위 모델이 로드되지 않았습니다.');
            return;
        }

        // 롤링 사운드 재생
        rollSound.currentTime = 0;
        rollSound.play();

        // 주사위 굴리기
        rollDice(numDice, diceType);
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
