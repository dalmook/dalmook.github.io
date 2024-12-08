let cvReady = false;
let originalImage = null;

function onOpenCvReady() {
    cvReady = true;
    console.log('OpenCV.js is ready.');
}

document.getElementById('generateBtn').addEventListener('click', function() {
    if (!cvReady) {
        alert('OpenCV.js가 아직 로드되지 않았습니다. 잠시만 기다려주세요.');
        return;
    }

    if (!originalImage) {
        alert('이미지를 업로드해주세요.');
        return;
    }

    const includeOriginal = document.getElementById('includeOriginal').checked;
    const outlineCanvas = document.getElementById('outlineCanvas');
    const originalCanvas = document.createElement('canvas'); // 숨겨진 캔버스를 동적으로 생성
    originalCanvas.width = originalImage.width;
    originalCanvas.height = originalImage.height;
    const ctxOriginal = originalCanvas.getContext('2d');
    ctxOriginal.drawImage(originalImage, 0, 0);

    // 이미지 처리 및 선화 생성
    const src = cv.imread(originalCanvas);
    const dst = new cv.Mat();
    const gray = new cv.Mat();
    const edges = new cv.Mat();
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    try {
        // 그레이스케일 변환
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

        // 가우시안 블러 적용
        cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

        // 캐니 에지 검출
        cv.Canny(gray, edges, 50, 150, 3, false);

        // 배경을 흰색, 선을 검정색으로 반전
        cv.bitwise_not(edges, edges);

        // 외곽선 찾기
        cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        // 외곽선을 채우기
        for (let i = 0; i < contours.size(); ++i) {
            cv.drawContours(dst, contours, i, new cv.Scalar(0, 0, 0, 255), -1); // 채우기
        }

        // 배경을 흰색으로 설정
        cv.cvtColor(edges, dst, cv.COLOR_GRAY2RGBA, 0);
        dst.setTo(new cv.Scalar(255, 255, 255, 255), edges); // 흰색 배경

        // 선화 이미지를 캔버스에 그리기
        cv.imshow(outlineCanvas, dst);
    } catch (err) {
        console.error(err);
        alert('도안 생성 중 오류가 발생했습니다.');
    } finally {
        // 메모리 해제
        src.delete();
        dst.delete();
        gray.delete();
        edges.delete();
        contours.delete();
        hierarchy.delete();
    }

    // 원본 이미지 오버레이
    if (includeOriginal) {
        const ctxOutline = outlineCanvas.getContext('2d');

        // 오버레이 이미지 크기 (도안 이미지의 20%)
        const overlayWidth = originalImage.width * 0.2;
        const overlayHeight = originalImage.height * 0.2;

        // 캔버스 크기 조정: 우측에 오버레이 공간 추가
        const newCanvasWidth = originalImage.width + overlayWidth + 20; // 10px 여백 양쪽
        const newCanvasHeight = originalImage.height;

        // 임시 캔버스 생성하여 기존 도안 이미지 복사
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = newCanvasWidth;
        tempCanvas.height = newCanvasHeight;
        const ctxTemp = tempCanvas.getContext('2d');

        // 배경을 흰색으로 채우기
        ctxTemp.fillStyle = '#FFFFFF';
        ctxTemp.fillRect(0, 0, newCanvasWidth, newCanvasHeight);

        // 기존 도안 이미지를 왼쪽에 복사
        ctxTemp.drawImage(outlineCanvas, 0, 0);

        // 원본 이미지를 우측 상단에 추가 (투명도 제거)
        ctxTemp.globalAlpha = 1.0; // 투명도 설정 없음
        ctxTemp.drawImage(originalImage, originalImage.width + 10, 10, overlayWidth, overlayHeight);
        ctxTemp.globalAlpha = 1.0; // 투명도 원상복구

        // 최종 이미지를 outlineCanvas에 다시 그리기
        outlineCanvas.width = newCanvasWidth;
        outlineCanvas.height = newCanvasHeight;
        const ctxFinal = outlineCanvas.getContext('2d');

        // 배경을 흰색으로 채우기 (필요 시)
        ctxFinal.fillStyle = '#FFFFFF';
        ctxFinal.fillRect(0, 0, newCanvasWidth, newCanvasHeight);

        // 임시 캔버스의 내용을 최종 캔버스에 복사
        ctxFinal.drawImage(tempCanvas, 0, 0);
    }
});

document.getElementById('imageUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) {
        return;
    }

    const img = new Image();
    img.onload = function() {
        originalImage = img;
        // 새로운 이미지 업로드 시 outlineCanvas 초기화
        const outlineCanvas = document.getElementById('outlineCanvas');
        const ctxOutline = outlineCanvas.getContext('2d');
        outlineCanvas.width = 0;
        outlineCanvas.height = 0;
        ctxOutline.clearRect(0, 0, outlineCanvas.width, outlineCanvas.height);
    };

    const reader = new FileReader();
    reader.onload = function(event) {
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

document.getElementById('downloadBtn').addEventListener('click', function() {
    const outlineCanvas = document.getElementById('outlineCanvas');

    // 도안이 생성되었는지 확인
    if (outlineCanvas.width === 0 || outlineCanvas.height === 0) {
        alert('먼저 도안을 생성해주세요.');
        return;
    }

    // 캔버스 데이터를 Base64로 변환
    const dataURL = outlineCanvas.toDataURL('image/png');

    // 환경 감지
    let isAndroidApp = false;

    // Android WebView는 일반적으로 'Android' 객체를 노출함
    if (typeof Android !== 'undefined' && Android !== null) {
        isAndroidApp = true;
    }

    if (isAndroidApp) {
        // 안드로이드 앱 환경: Base64 문자열 전달
        Android.receiveImage(dataURL);
    } else {
        // 웹 환경: 다운로드 링크 생성
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'coloring_page.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});
