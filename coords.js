// coords.js

document.addEventListener("DOMContentLoaded", () => {
    const gameImage = document.getElementById("gameImage");
    const coordinateList = document.getElementById("coordinateList");
    const jsonOutput = document.getElementById("jsonOutput");
    const copyButton = document.getElementById("copyButton");

    const coordinates = []; // 좌표 저장용 배열

    // 이미지 클릭 이벤트
    gameImage.addEventListener("click", (event) => {
        const rect = gameImage.getBoundingClientRect();

        // 클릭 위치를 픽셀 단위로 계산
        const clickX = Math.round(event.clientX - rect.left);
        const clickY = Math.round(event.clientY - rect.top);

        // 좌표 출력
        const coordItem = {
            name: `Object ${coordinates.length + 1}`, // 기본 이름
            x: clickX,
            y: clickY,
            width: 50, // 기본 크기 (픽셀)
            height: 50 // 기본 크기 (픽셀)
        };
        coordinates.push(coordItem);

        // 좌표 목록에 추가
        const listItem = document.createElement("li");
        listItem.textContent = `Name: ${coordItem.name}, x: ${coordItem.x}, y: ${coordItem.y}, width: ${coordItem.width}, height: ${coordItem.height}`;
        coordinateList.appendChild(listItem);

        // JSON 출력
        jsonOutput.value = JSON.stringify(coordinates, null, 4);
    });

    // JSON 복사 버튼
    copyButton.addEventListener("click", () => {
        jsonOutput.select();
        document.execCommand("copy");
        alert("JSON이 복사되었습니다!");
    });
});
