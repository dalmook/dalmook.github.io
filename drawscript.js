window.addEventListener('load', () => {
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');

    let designs = {}; // JSON에서 로드된 도안 데이터
    let currentDifficulty = 'easy';
    let currentDesignIndex = 0;
    let drawingImage = new Image();

    // JSON 파일에서 도안 데이터 로드
    fetch('drawimg.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('JSON 파일을 불러오는 데 실패했습니다.');
            }
            return response.json();
        })
        .then(data => {
            designs = data;
            loadDesign(); // 도안 로드
        })
        .catch(error => {
            console.error('오류:', error);
            alert('도안 이미지를 로드하는 중 오류가 발생했습니다.');
        });

    function loadDesign() {
        if (!designs[currentDifficulty] || designs[currentDifficulty].length === 0) {
            alert('선택한 난이도에 도안이 없습니다.');
            return;
        }

        const designPath = designs[currentDifficulty][currentDesignIndex];
        drawingImage.src = designPath;
        drawingImage.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(drawingImage, 0, 0, canvas.width, canvas.height);
        };
        drawingImage.onerror = () => {
            console.error(`도안 이미지를 불러올 수 없습니다: ${designPath}`);
            alert(`도안 이미지를 불러올 수 없습니다: ${designPath}`);
        };
    }

    let drawing = false;
    let currentTool = 'brush';
    let currentColor = '#000000';
    let lastX = 0;
    let lastY = 0;
    let lineWidth = 5; // 기본 두께

    // 도구 선택
    const tools = document.querySelectorAll('.tool-button');
    tools.forEach(tool => {
        tool.addEventListener('click', () => {
            tools.forEach(t => t.classList.remove('active'));
            tool.classList.add('active');
            currentTool = tool.id;

            // 도구에 따른 기본 두께 설정 (사용자가 슬라이더로 조절할 수 있음)
            switch(currentTool) {
                case 'brush':
                    // 브러시의 경우 슬라이더로 두께 조절
                    break;
                case 'pen':
                    // 볼펜의 경우 슬라이더로 두께 조절
                    break;
                case 'pencil':
                    // 연필의 경우 슬라이더로 두께 조절
                    break;
                default:
                    // 기본값 유지
            }
        });
    });

    // 색상 선택
    const colorPicker = document.getElementById('colorPicker');
    colorPicker.addEventListener('change', (e) => {
        currentColor = e.target.value;
    });

    // 두께 선택
    const thicknessRange = document.getElementById('thicknessRange');
    const thicknessValue = document.getElementById('thicknessValue');
    thicknessRange.addEventListener('input', (e) => {
        lineWidth = e.target.value;
        thicknessValue.textContent = lineWidth;
    });

    // 마우스 및 터치 이벤트 핸들러
    function getPointerPosition(e) {
        let x, y;
        if (e.touches && e.touches.length > 0) {
            const rect = canvas.getBoundingClientRect();
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.offsetX;
            y = e.offsetY;
        }
        return [x, y];
    }

    function startDrawing(e) {
        e.preventDefault();
        drawing = true;
        [lastX, lastY] = getPointerPosition(e);
    }

    function stopDrawing(e) {
        e.preventDefault();
        drawing = false;
    }

    function draw(e) {
        e.preventDefault();
        if (!drawing) return;

        const [x, y] = getPointerPosition(e);

        ctx.strokeStyle = currentColor;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';

        if (currentTool === 'brush') {
            ctx.globalAlpha = 1.0;
        } else if (currentTool === 'pen') {
            ctx.globalAlpha = 0.6;
        } else if (currentTool === 'pencil') {
            ctx.globalAlpha = 0.3;
        }

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        [lastX, lastY] = [x, y];
    }

    // 마우스 이벤트
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // 터치 이벤트
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);

    // 지우기 기능
    const clearBtn = document.getElementById('clear');
    clearBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // 도안 이미지 다시 그리기
        loadDesign();
    });

    // 저장하기 기능
    const saveBtn = document.getElementById('save');
    saveBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'my_drawing.png';
        link.href = canvas.toDataURL();
        link.click();
    });

    // 난이도 선택
    const difficultySelect = document.getElementById('difficultySelect');
    difficultySelect.addEventListener('change', (e) => {
        currentDifficulty = e.target.value;
        currentDesignIndex = 0; // 난이도 변경 시 첫 번째 도안으로 초기화
        loadDesign();
    });

    // 다음/이전 도안 버튼
    const prevBtn = document.getElementById('prevDesign');
    const nextBtn = document.getElementById('nextDesign');

    prevBtn.addEventListener('click', () => {
        if (!designs[currentDifficulty]) return;
        const designCount = designs[currentDifficulty].length;
        if (designCount === 0) return;
        currentDesignIndex = (currentDesignIndex - 1 + designCount) % designCount;
        loadDesign();
    });

    nextBtn.addEventListener('click', () => {
        if (!designs[currentDifficulty]) return;
        const designCount = designs[currentDifficulty].length;
        if (designCount === 0) return;
        currentDesignIndex = (currentDesignIndex + 1) % designCount;
        loadDesign();
    });
});
