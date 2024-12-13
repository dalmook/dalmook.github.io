let cvReady = false;
let originalImage = null;

// 캔버스가 tainted 상태인지 확인하는 함수
function isCanvasTainted(canvas) {
    try {
        const ctx = canvas.getContext('2d');
        ctx.getImageData(0, 0, 1, 1);
        return false;
    } catch (e) {
        return true;
    }
}

// 이미지 리사이징 함수
function resizeImage(img, maxWidth, maxHeight) {
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');

    let ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
    if (ratio >= 1) {
        return img;
    }

    canvas.width = img.width * ratio;
    canvas.height = img.height * ratio;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
}

// 도안 생성 버튼 클릭 이벤트 핸들러
document.getElementById('generateBtn').addEventListener('click', function() {
    console.log('Generate button clicked.');
    if (!cvReady) {
        alert('OpenCV.js가 아직 로드되지 않았습니다. 잠시만 기다려주세요.');
        console.error('OpenCV.js가 아직 로드되지 않았습니다.');
        return;
    }

    if (!originalImage) {
        alert('이미지를 업로드하거나 URL을 통해 이미지를 로드해주세요.');
        console.error('originalImage가 설정되지 않았습니다.');
        return;
    }

    const includeOriginal = document.getElementById('includeOriginal').checked;
    const outlineCanvas = document.getElementById('outlineCanvas');

    // 원본 이미지의 너비와 높이를 콘솔에 출력 (디버깅 용도)
    console.log('Original Image Width:', originalImage.width);
    console.log('Original Image Height:', originalImage.height);

    // outlineCanvas의 크기를 원본 이미지의 크기로 설정
    outlineCanvas.width = originalImage.width;
    outlineCanvas.height = originalImage.height;
    console.log('outlineCanvas 크기 설정:', outlineCanvas.width, outlineCanvas.height);

    const originalCanvas = document.createElement('canvas'); // 숨겨진 캔버스를 동적으로 생성
    originalCanvas.width = originalImage.width;
    originalCanvas.height = originalImage.height;
    const ctxOriginal = originalCanvas.getContext('2d');
    ctxOriginal.drawImage(originalImage, 0, 0);
    console.log('originalCanvas에 이미지 그리기 완료.');

    // 이미지 처리 및 선화 생성
    let src, dst, gray, edges, contours, hierarchy;
    try {
        src = cv.imread(originalCanvas);
        console.log('cv.imread() 호출 완료.');

        dst = new cv.Mat();
        gray = new cv.Mat();
        edges = new cv.Mat();
        contours = new cv.MatVector();
        hierarchy = new cv.Mat();
        console.log('OpenCV Mat 객체 생성 완료.');

        // 그레이스케일 변환
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
        console.log('그레이스케일 변환 완료.');

        // 가우시안 블러 적용
        cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
        console.log('가우시안 블러 적용 완료.');

        // 캐니 에지 검출
        cv.Canny(gray, edges, 50, 150, 3, false);
        console.log('캐니 에지 검출 완료.');

        // 배경을 흰색, 선을 검정색으로 반전
        cv.bitwise_not(edges, edges);
        console.log('에지 이미지 반전 완료.');

        // 외곽선 찾기
        cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        console.log('외곽선 찾기 완료. 외곽선 개수:', contours.size());

        // 흰색 배경을 가진 이미지 생성
        dst.setTo(new cv.Scalar(255, 255, 255, 255)); // 흰색 배경
        console.log('dst Mat을 흰색으로 초기화.');

        // 외곽선을 검정색으로 채우기
        for (let i = 0; i < contours.size(); ++i) {
            cv.drawContours(dst, contours, i, new cv.Scalar(0, 0, 0, 255), -1); // 검정색으로 채우기
        }
        console.log('외곽선 내부를 검정색으로 채우기 완료.');

        // 선화 이미지를 캔버스에 그리기
        cv.imshow(outlineCanvas, dst);
        console.log('cv.imshow() 호출 완료.');

        // 캔버스 tainted 상태 확인
        if (isCanvasTainted(outlineCanvas)) {
            alert('이미지 처리가 실패했습니다. CORS 정책을 확인해주세요.\n이미지를 다운로드한 후, 로컬 파일 업로드를 이용해주세요.');
            console.error('캔버스가 tainted 상태입니다. CORS 문제 발생.');
            return;
        }

    } catch (err) {
        console.error('도안 생성 중 오류 발생:', err);
        alert('도안 생성 중 오류가 발생했습니다. 콘솔을 확인해주세요.');
    } finally {
        // 메모리 해제
        if (src) src.delete();
        if (dst) dst.delete();
        if (gray) gray.delete();
        if (edges) edges.delete();
        if (contours) contours.delete();
        if (hierarchy) hierarchy.delete();
        console.log('OpenCV 메모리 해제 완료.');
    }

    // 원본 이미지 오버레이
    if (includeOriginal) {
        console.log('원본 이미지 오버레이 옵션이 선택됨.');
        const ctxOutline = outlineCanvas.getContext('2d');

        // 오버레이 이미지 크기 (도안 이미지의 20%)
        const overlayWidth = originalImage.width * 0.2;
        const overlayHeight = originalImage.height * 0.2;

        // 캔버스 크기 조정: 우측에 오버레이 공간 추가
        const newCanvasWidth = originalImage.width + overlayWidth + 20; // 10px 여백 양쪽
        const newCanvasHeight = originalImage.height;

        console.log('New Canvas Width:', newCanvasWidth);
        console.log('New Canvas Height:', newCanvasHeight);

        // tempCanvas 생성 및 크기 설정
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = newCanvasWidth;
        tempCanvas.height = newCanvasHeight;
        const ctxTemp = tempCanvas.getContext('2d');
        console.log('tempCanvas 생성 및 크기 설정 완료.');

        // tempCanvas의 크기가 0인지 확인
        if (tempCanvas.width === 0 || tempCanvas.height === 0) {
            alert('캔버스 크기 설정에 실패했습니다.');
            console.error('tempCanvas의 크기가 0입니다.');
            return;
        }

        // 배경을 흰색으로 채우기
        ctxTemp.fillStyle = '#FFFFFF';
        ctxTemp.fillRect(0, 0, newCanvasWidth, newCanvasHeight);
        console.log('tempCanvas에 흰색 배경 채우기 완료.');

        // 기존 도안 이미지를 왼쪽에 복사
        ctxTemp.drawImage(outlineCanvas, 0, 0);
        console.log('outlineCanvas의 내용을 tempCanvas에 복사 완료.');

        // 원본 이미지를 우측 상단에 추가 (투명도 제거)
        ctxTemp.globalAlpha = 1.0; // 투명도 설정 없음
        ctxTemp.drawImage(originalImage, originalImage.width + 10, 10, overlayWidth, overlayHeight);
        console.log('원본 이미지를 tempCanvas에 오버레이 완료.');
        ctxTemp.globalAlpha = 1.0; // 투명도 원상복구

        // 최종 이미지를 outlineCanvas에 다시 그리기 전에 크기를 설정
        outlineCanvas.width = newCanvasWidth;
        outlineCanvas.height = newCanvasHeight;
        console.log('outlineCanvas의 크기를 newCanvasWidth와 newCanvasHeight로 재설정.');

        // outlineCanvas의 크기가 0인지 확인
        if (outlineCanvas.width === 0 || outlineCanvas.height === 0) {
            alert('도안 캔버스 크기 설정에 실패했습니다.');
            console.error('outlineCanvas의 크기가 0입니다.');
            return;
        }

        const ctxFinal = outlineCanvas.getContext('2d');

        // 배경을 흰색으로 채우기 (필요 시)
        ctxFinal.fillStyle = '#FFFFFF';
        ctxFinal.fillRect(0, 0, newCanvasWidth, newCanvasHeight);
        console.log('outlineCanvas에 흰색 배경 채우기 완료.');

        // tempCanvas의 내용을 최종 캔버스에 복사하기 전에 tempCanvas의 크기를 확인
        if (tempCanvas.width === 0 || tempCanvas.height === 0) {
            alert('임시 캔버스 크기가 잘못되었습니다.');
            console.error('tempCanvas의 크기가 0입니다.');
            return;
        }

        // 임시 캔버스의 내용을 최종 캔버스에 복사
        ctxFinal.drawImage(tempCanvas, 0, 0);
        console.log('tempCanvas의 내용을 outlineCanvas에 복사 완료.');
    }
});

// 이미지 업로드 시 이벤트 핸들러
document.getElementById('imageUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) {
        console.log('파일이 선택되지 않았습니다.');
        return;
    }

    // 파일 업로드 시 이미지 URL 입력 필드 비우기
    document.getElementById('imageUrl').value = '';
    console.log('파일 업로드 시 imageUrl 입력 필드 비우기.');

    const img = new Image();
    // 파일 업로드를 통한 이미지 로드에는 crossOrigin 설정 불필요
    // img.crossOrigin = 'anonymous'; // 제거

    img.onload = function() {
        // 이미지 리사이징 (선택 사항)
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;

        if (img.width > MAX_WIDTH || img.height > MAX_HEIGHT) {
            const resizedCanvas = resizeImage(img, MAX_WIDTH, MAX_HEIGHT);
            originalImage = resizedCanvas;
            console.log('이미지 리사이즈 완료:', resizedCanvas.width, resizedCanvas.height);
        } else {
            originalImage = img;
            console.log('이미지 로드 완료:', img.width, img.height);
        }

        // outlineCanvas 초기화
        const outlineCanvas = document.getElementById('outlineCanvas');
        const ctxOutline = outlineCanvas.getContext('2d');
        outlineCanvas.width = 0;
        outlineCanvas.height = 0;
        ctxOutline.clearRect(0, 0, outlineCanvas.width, outlineCanvas.height);
        console.log('outlineCanvas 초기화 완료.');
    };

    img.onerror = function() {
        alert('이미지 로드에 실패했습니다.');
        console.error('이미지 로드에 실패했습니다.');
    };

    const reader = new FileReader();
    reader.onload = function(event) {
        img.src = event.target.result;
        console.log('FileReader를 사용하여 이미지 로드 시도.');
    };
    reader.readAsDataURL(file);
});

// 이미지 URL에서 불러오기 버튼 이벤트 핸들러
document.getElementById('loadUrlBtn').addEventListener('click', function() {
    const url = document.getElementById('imageUrl').value.trim();
    if (!url) {
        alert('이미지 URL을 입력해주세요.');
        console.error('이미지 URL이 입력되지 않았습니다.');
        return;
    }

    // 파일 업로드 필드 비우기
    document.getElementById('imageUpload').value = '';
    console.log('URL에서 이미지를 불러올 때 imageUpload 필드 비우기.');

    const img = new Image();
    img.crossOrigin = 'anonymous'; // CORS 설정
    img.onload = function() {
        originalImage = img;
        console.log('Image loaded via URL:', img.width, img.height);
        // 이미지 로드 시 outlineCanvas 초기화
        const outlineCanvas = document.getElementById('outlineCanvas');
        const ctxOutline = outlineCanvas.getContext('2d');
        outlineCanvas.width = 0;
        outlineCanvas.height = 0;
        ctxOutline.clearRect(0, 0, outlineCanvas.width, outlineCanvas.height);
        console.log('outlineCanvas 초기화 완료.');
    };
    img.onerror = function() {
        alert('이미지 로드에 실패했습니다. URL을 확인해주세요.');
        console.error('이미지 로드에 실패했습니다. URL을 확인해주세요.');
    };
    img.src = url;
    console.log('이미지 URL 설정 완료:', url);
});

// 도안 다운로드 버튼 이벤트 핸들러
document.getElementById('downloadBtn').addEventListener('click', function() {
    const outlineCanvas = document.getElementById('outlineCanvas');

    // 도안이 생성되었는지 확인
    if (outlineCanvas.width === 0 || outlineCanvas.height === 0) {
        alert('먼저 도안을 생성해주세요.');
        console.error('outlineCanvas 크기가 0입니다.');
        return;
    }

    // 캔버스 데이터를 Base64로 변환
    const dataURL = outlineCanvas.toDataURL('image/png');
    console.log('캔버스 데이터를 Base64로 변환 완료.');

    // 환경 감지
    let isAndroidApp = false;

    // Android WebView는 일반적으로 'Android' 객체를 노출함
    if (typeof Android !== 'undefined' && Android !== null) {
        isAndroidApp = true;
        console.log('안드로이드 앱 환경 감지됨.');
    }

    if (isAndroidApp) {
        // 안드로이드 앱 환경: Base64 문자열 전달
        Android.receiveImage(dataURL);
        console.log('Android.receiveImage(dataURL) 호출 완료.');
    } else {
        // 웹 환경: 다운로드 링크 생성
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'coloring_page.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('웹 환경에서 도안 다운로드 완료.');
    }
});
