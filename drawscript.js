window.addEventListener('load', () => {
    const backgroundCanvas = document.getElementById('backgroundCanvas');
    const bgCtx = backgroundCanvas.getContext('2d');
    const drawingCanvas = document.getElementById('drawingCanvas');
    const ctx = drawingCanvas.getContext('2d');
    const customCursor = document.getElementById('customCursor');

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
            resizeCanvas(); // 초기 캔버스 크기 설정
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
        drawingImage = new Image();
        // 동일한 출처에서 이미지를 로드하므로 crossOrigin 설정 불필요
        drawingImage.src = designPath;
        drawingImage.onload = () => {
            // 배경 캔버스에 도안 이미지 그리기
            bgCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
            bgCtx.drawImage(drawingImage, 0, 0, backgroundCanvas.width, backgroundCanvas.height);
            // 그림 캔버스 초기화 (사용자 그리기)
            ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
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

    // 캔버스 크기 조정 함수
    function resizeCanvas() {
        // 표시 크기 가져오기
        const rectBg = backgroundCanvas.getBoundingClientRect();
        const rectDraw = drawingCanvas.getBoundingClientRect();

        // 내부 해상도 조정
        backgroundCanvas.width = rectBg.width;
        backgroundCanvas.height = rectBg.height;
        drawingCanvas.width = rectDraw.width;
        drawingCanvas.height = rectDraw.height;

        // 도안 이미지 다시 그리기
        if (drawingImage.src) {
            bgCtx.drawImage(drawingImage, 0, 0, backgroundCanvas.width, backgroundCanvas.height);
            ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        }

        // 커스텀 커서 업데이트
        updateCursor();
    }

    // 창 크기 변경 시 캔버스 리사이즈
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);

    // 도구 선택
    const tools = document.querySelectorAll('.tool-button');
    tools.forEach(tool => {
        tool.addEventListener('click', () => {
            tools.forEach(t => t.classList.remove('active'));
            tool.classList.add('active');
            currentTool = tool.id;

            if (currentTool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out'; // 지우개 모드
                ctx.strokeStyle = 'rgba(0,0,0,1)'; // 지우개 색상 (투명하게 지워짐)
            } else {
                ctx.globalCompositeOperation = 'source-over'; // 기본 그리기 모드
                ctx.strokeStyle = currentColor;
            }

            updateCursor();
        });
    });

    // 색상 선택
    const colorPicker = document.getElementById('colorPicker');
    colorPicker.addEventListener('change', (e) => {
        currentColor = e.target.value;
        if (currentTool !== 'eraser') {
            ctx.strokeStyle = currentColor;
        }
        updateCursor();
    });

    // 두께 선택
    const thicknessRange = document.getElementById('thicknessRange');
    const thicknessValue = document.getElementById('thicknessValue');
    thicknessRange.addEventListener('input', (e) => {
        lineWidth = e.target.value;
        thicknessValue.textContent = lineWidth;
        ctx.lineWidth = lineWidth;
        updateCursor();
    });

    // 커스텀 커서 업데이트 함수
    function updateCursor() {
        customCursor.style.width = `${lineWidth * 2}px`;
        customCursor.style.height = `${lineWidth * 2}px`;
        if (currentTool === 'eraser') {
            customCursor.style.borderColor = '#000000'; // 지우개는 검은색 테두리
            customCursor.style.backgroundColor = 'transparent';
        } else {
            customCursor.style.borderColor = currentColor;
            customCursor.style.backgroundColor = currentColor;
        }
    }

    // 마우스 및 터치 이벤트 핸들러
    function getPointerPosition(e) {
        let x, y;
        if (e.touches && e.touches.length > 0) {
            const rect = drawingCanvas.getBoundingClientRect();
            x = (e.touches[0].clientX - rect.left) * (drawingCanvas.width / rect.width);
            y = (e.touches[0].clientY - rect.top) * (drawingCanvas.height / rect.height);
        } else {
            const rect = drawingCanvas.getBoundingClientRect();
            x = (e.clientX - rect.left) * (drawingCanvas.width / rect.width);
            y = (e.clientY - rect.top) * (drawingCanvas.height / rect.height);
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

        ctx.lineCap = 'round';

        if (currentTool !== 'eraser') {
            ctx.strokeStyle = currentColor;
            ctx.globalCompositeOperation = 'source-over';
        }

        ctx.lineWidth = lineWidth;

        if (currentTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)'; // 지우개 색상 (실제로는 투명)
        }

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        [lastX, lastY] = [x, y];
    }

    // 그림 캔버스 이벤트
    drawingCanvas.addEventListener('mousedown', startDrawing);
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('mouseup', stopDrawing);
    drawingCanvas.addEventListener('mouseout', stopDrawing);

    drawingCanvas.addEventListener('touchstart', startDrawing);
    drawingCanvas.addEventListener('touchmove', draw);
    drawingCanvas.addEventListener('touchend', stopDrawing);
    drawingCanvas.addEventListener('touchcancel', stopDrawing);

    // 지우기 기능 (그림 캔버스만 초기화)
    const clearBtn = document.getElementById('clear');
    clearBtn.addEventListener('click', clearDrawing);
    clearBtn.addEventListener('touchend', clearDrawing); // 모바일 터치 이벤트 추가

    function clearDrawing(e) {
        e.preventDefault();
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    }

    // 저장하기 기능
    const saveBtn = document.getElementById('save');
    saveBtn.addEventListener('click', saveDrawing);
    saveBtn.addEventListener('touchend', saveDrawing); // 모바일 터치 이벤트 추가

    function saveDrawing(e) {
        e.preventDefault(); // 기본 터치 동작 방지
        // 두 개의 캔버스를 합쳐서 하나의 이미지로 저장
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = backgroundCanvas.width;
        tempCanvas.height = backgroundCanvas.height;

        // 배경 캔버스 그리기
        tempCtx.drawImage(backgroundCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
        // 그림 캔버스 그리기
        tempCtx.drawImage(drawingCanvas, 0, 0, tempCanvas.width, tempCanvas.height);

        // Blob으로 변환하여 다운로드
        tempCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'my_drawing.png';

            // iOS 디바이스인지 확인
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

            if (isIOS) {
                // iOS에서는 다운로드 링크가 동작하지 않으므로 새 탭에서 이미지를 엽니다
                link.setAttribute('target', '_blank');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // 사용자에게 저장 방법 안내
                alert('이미지가 새 탭에서 열렸습니다. 이미지를 길게 눌러 저장하세요.');
            } else {
                // 다른 디바이스에서는 다운로드를 트리거합니다
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            URL.revokeObjectURL(url);
        }, 'image/png');
    }

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

    // 커스텀 커서 이동 업데이트
    function moveCursor(e) {
        let x, y;
        if (e.touches && e.touches.length > 0) {
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
        } else {
            x = e.clientX;
            y = e.clientY;
        }
        customCursor.style.left = `${x}px`;
        customCursor.style.top = `${y}px`;
    }

    // 마우스 이동 이벤트
    document.addEventListener('mousemove', moveCursor);
    // 터치 이동 이벤트
    document.addEventListener('touchmove', moveCursor, { passive: false });

    // 초기 커서 설정
    updateCursor();
});
