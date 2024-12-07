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

    // 도장 이미지 경로 설정
    const stamps = {
        star: 'stamps/star.png',
        heart: 'stamps/heart.png',
        circle: 'stamps/circle.png',
        smiley: 'stamps/smiley.png',
        // 기본 도장 아이콘 (도구 바에 사용)
        stamp: 'stamps/stamp.png'
    };

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

        const designPaths = designs[currentDifficulty];
        // 현재 Design Index 사용하여 도안 선택
        const designPath = designPaths[currentDesignIndex % designPaths.length];
        drawingImage = new Image();
        // 동일한 출처에서 이미지를 로드하므로 crossOrigin 설정 불필요
        drawingImage.src = designPath;
        drawingImage.onload = () => {
            // 배경 캔버스에 도안 이미지 그리기
            bgCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
            bgCtx.drawImage(drawingImage, 0, 0, backgroundCanvas.width, backgroundCanvas.height);
            // 그림 캔버스 초기화 (사용자 그리기)
            ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            // 히스토리 초기화
            undoStack = [];
            redoStack = [];
            stampsPlaced = []; // stampsPlaced 배열 초기화
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

    // 현재 선택된 도장 (null이면 도장 미선택)
    let currentStamp = null;
    let stampSize = 50; // 기본 도장 크기

    // 히스토리 스택 (Undo/Redo)
    // 각 스냅샷은 { imageData, stampsPlaced: [...] }
    let undoStack = [];
    let redoStack = [];

    // 도장 객체 배열
    let stampsPlaced = [];

    // 캔버스 크기 조정 함수
    function resizeCanvas() {
        // 현재 그려진 선과 도장 저장
        const savedImageData = ctx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
        const savedStamps = JSON.parse(JSON.stringify(stampsPlaced));

        // 캔버스 컨테이너의 크기 가져오기
        const container = document.querySelector('.canvas-container');
        const rect = container.getBoundingClientRect();

        // 캔버스의 내부 해상도 조정
        backgroundCanvas.width = rect.width;
        backgroundCanvas.height = rect.height;
        drawingCanvas.width = rect.width;
        drawingCanvas.height = rect.height;

        // 배경 이미지 다시 그리기
        if (drawingImage.src) {
            bgCtx.drawImage(drawingImage, 0, 0, backgroundCanvas.width, backgroundCanvas.height);
        }

        // 저장된 그리기 상태 복원
        ctx.putImageData(savedImageData, 0, 0);
        stampsPlaced = savedStamps;
        drawAllStamps();
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
            } else if (currentTool === 'stamp') {
                // 도장 도구 선택 시 그리기 모드 비활성화
                drawing = false;
                currentStamp = null; // 초기화
                ctx.globalCompositeOperation = 'source-over';
                showStampPalette(); // 도장 팔레트 바로 열기
            } else {
                ctx.globalCompositeOperation = 'source-over'; // 기본 그리기 모드
                ctx.strokeStyle = currentColor;
                currentStamp = null; // 도장 도구 외 선택 시 도장 초기화
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

    // 도장 크기 선택
    const stampSizeRange = document.getElementById('stampSizeRange');
    const stampSizeValue = document.getElementById('stampSizeValue');
    stampSizeRange.addEventListener('input', (e) => {
        stampSize = e.target.value;
        stampSizeValue.textContent = stampSize;
    });

    // Undo/Redo 버튼
    const undoBtn = document.getElementById('undo');
    const redoBtn = document.getElementById('redo');

    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);

    function undo() {
        if (undoStack.length > 0) {
            const lastState = undoStack.pop();
            redoStack.push({
                imageData: ctx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height),
                stampsPlaced: JSON.parse(JSON.stringify(stampsPlaced))
            });
            ctx.putImageData(lastState.imageData, 0, 0);
            stampsPlaced = JSON.parse(JSON.stringify(lastState.stampsPlaced));
            drawAllStamps();
        }
    }

    function redo() {
        if (redoStack.length > 0) {
            const nextState = redoStack.pop();
            undoStack.push({
                imageData: ctx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height),
                stampsPlaced: JSON.parse(JSON.stringify(stampsPlaced))
            });
            ctx.putImageData(nextState.imageData, 0, 0);
            stampsPlaced = JSON.parse(JSON.stringify(nextState.stampsPlaced));
            drawAllStamps();
        }
    }

    // 커스텀 커서 업데이트 함수
    function updateCursor() {
        customCursor.style.width = `${lineWidth * 2}px`;
        customCursor.style.height = `${lineWidth * 2}px`;
        if (currentTool === 'eraser') {
            customCursor.style.borderColor = '#000000'; // 지우개는 검은색 테두리
            customCursor.style.backgroundColor = 'transparent';
        } else if (currentTool === 'stamp') {
            customCursor.style.borderColor = '#000000'; // 도장 선택 시 검은색 테두리
            customCursor.style.backgroundColor = '#ffffff'; // 흰색 배경
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
        if (currentTool === 'stamp') {
            placeStamp(e);
            return;
        }
        drawing = true;
        [lastX, lastY] = getPointerPosition(e);
        // 히스토리 저장 (이전에 실행한 undo를 대체하기 위해 redoStack을 초기화)
        undoStack.push({
            imageData: ctx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height),
            stampsPlaced: JSON.parse(JSON.stringify(stampsPlaced))
        });
        // 히스토리 제한 (예: 20단계)
        if (undoStack.length > 20) {
            undoStack.shift();
        }
        // Redo 히스토리 초기화
        redoStack = [];
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

    // 터치 이벤트 핸들러 수정
    drawingCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault(); // 기본 터치 동작 방지 (스크롤, 확대/축소 등)
        e.stopPropagation(); // 이벤트 전파 방지
        const touch = e.touches[0];
        const simulatedEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        drawingCanvas.dispatchEvent(simulatedEvent);
    }, { passive: false });

    drawingCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault(); // 기본 터치 동작 방지
        e.stopPropagation(); // 이벤트 전파 방지
        const touch = e.touches[0];
        const simulatedEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        drawingCanvas.dispatchEvent(simulatedEvent);
    }, { passive: false });

    drawingCanvas.addEventListener('touchend', (e) => {
        e.preventDefault(); // 기본 터치 동작 방지
        e.stopPropagation(); // 이벤트 전파 방지
        const simulatedEvent = new MouseEvent('mouseup', {});
        drawingCanvas.dispatchEvent(simulatedEvent);
    }, { passive: false });

    // 도장 팔레트 바로 열기 기능 제거 (이미 도구 선택 시 열리도록 변경)
    // 도장 툴 활성화 시 도장 선택 팔레트 표시 (이미 도구 선택 시 showStampPalette() 호출)

    // 도장 팔레트 표시 함수
    function showStampPalette() {
        // 기존에 팔레트가 열려 있다면 제거
        const existingPalette = document.getElementById('stampPalette');
        if (existingPalette) {
            existingPalette.remove();
            return;
        }

        // 도장 팔레트 요소 생성
        const palette = document.createElement('div');
        palette.id = 'stampPalette';
        palette.style.position = 'absolute';
        palette.style.top = '10px';
        palette.style.right = '10px';
        palette.style.backgroundColor = '#ffffff';
        palette.style.border = '1px solid #ccc';
        palette.style.borderRadius = '8px';
        palette.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        palette.style.padding = '10px';
        palette.style.display = 'flex';
        palette.style.flexDirection = 'column';
        palette.style.zIndex = '1001';
        palette.style.animation = 'fadeIn 0.3s';

        // 도장 이미지 버튼 추가
        Object.keys(stamps).forEach(key => {
            if (key === 'stamp') return; // 기본 도장 아이콘은 제외
            const stampButton = document.createElement('button');
            stampButton.style.margin = '5px 0';
            stampButton.style.border = 'none';
            stampButton.style.background = 'transparent';
            stampButton.style.cursor = 'pointer';

            const img = document.createElement('img');
            img.src = stamps[key];
            img.alt = key;
            img.style.width = '50px';
            img.style.height = '50px';
            stampButton.appendChild(img);

            stampButton.addEventListener('click', () => {
                currentStamp = {
                    src: stamps[key],
                    x: 0,
                    y: 0,
                    width: stampSize,
                    height: 0 // Will be set when drawing
                };
                palette.remove(); // 팔레트 제거
                // 도장 도구 선택 후, 사용자에게 도장을 찍을 위치를 클릭하도록 안내
            });

            palette.appendChild(stampButton);
        });

        // 닫기 버튼 추가
        const closeButton = document.createElement('button');
        closeButton.textContent = '닫기';
        closeButton.classList.add('close-button');
        closeButton.style.marginTop = '10px';
        closeButton.style.padding = '5px 10px';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '4px';
        closeButton.style.backgroundColor = '#ff6666';
        closeButton.style.color = '#ffffff';
        closeButton.style.cursor = 'pointer';
        closeButton.addEventListener('click', () => {
            palette.remove();
        });

        palette.appendChild(closeButton);

        // 캔버스 컨테이너에 추가
        const container = document.querySelector('.canvas-container');
        container.appendChild(palette);
    }

    // 도장 찍기 함수
    function placeStamp(e) {
        const [x, y] = getPointerPosition(e);
        if (currentStamp) {
            const img = new Image();
            img.src = currentStamp.src;
            img.onload = () => {
                const aspectRatio = img.height / img.width;
                const height = stampSize * aspectRatio;

                // Create stamp object without rotation
                const stampObj = {
                    src: currentStamp.src,
                    x: x,
                    y: y,
                    width: stampSize,
                    height: height
                };
                stampsPlaced.push(stampObj);
                drawAllStamps();

                // 히스토리 저장
                undoStack.push({
                    imageData: ctx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height),
                    stampsPlaced: JSON.parse(JSON.stringify(stampsPlaced))
                });
                if (undoStack.length > 20) {
                    undoStack.shift();
                }
                // Redo 히스토리 초기화
                redoStack = [];
            };
        }
    }

    // 도장 모두 그리기 함수
    function drawAllStamps() {
        // 기존 그린 선들을 지우지 않고 도장만 그리기
        stampsPlaced.forEach(stamp => {
            const img = new Image();
            img.src = stamp.src;
            img.onload = () => {
                ctx.drawImage(img, stamp.x - stamp.width / 2, stamp.y - stamp.height / 2, stamp.width, stamp.height);
            };
        });
    }

    // 지우기 기능 (그림 캔버스 및 도장 모두 초기화)
    const clearBtn = document.getElementById('clear');
    clearBtn.addEventListener('click', clearDrawing);
    clearBtn.addEventListener('touchend', clearDrawing); // 모바일 터치 이벤트 추가

    function clearDrawing(e) {
        e.preventDefault();
        // 히스토리 저장
        undoStack.push({
            imageData: ctx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height),
            stampsPlaced: JSON.parse(JSON.stringify(stampsPlaced))
        });
        // 히스토리 제한
        if (undoStack.length > 20) {
            undoStack.shift();
        }
        // Redo 히스토리 초기화
        redoStack = [];
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        stampsPlaced = []; // 모든 도장 제거
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

        // DataURL으로 변환
        const dataURL = tempCanvas.toDataURL('image/png');

        // Base64 데이터 추출
        const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');


        // Android 인터페이스로 전송
        if (window.Android && window.Android.saveImage) {
            window.Android.saveImage(base64Data);
        } else {
            // Web 브라우저에서의 동작 유지
            const link = document.createElement('a');
            link.href = dataURL;
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
        }
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

    // Prevent default touchmove on the canvas to prevent scrolling
    drawingCanvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, { passive: false });

    // Prevent page from scrolling while interacting with the canvas
    drawingCanvas.addEventListener('touchstart', function(e) {
        e.stopPropagation();
    }, { passive: false });

    drawingCanvas.addEventListener('touchmove', function(e) {
        e.stopPropagation();
    }, { passive: false });

    drawingCanvas.addEventListener('touchend', function(e) {
        e.stopPropagation();
    }, { passive: false });

    // 초기 커서 설정
    updateCursor();

    // 애니메이션 추가 (fadeIn)
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
});
