/* gugustyles.css */

body {
    font-family: 'Arial', sans-serif;
    background-color: #ffefd5; /* 부드러운 배경색 */
    text-align: center;
    padding: 20px;
}

h1 {
    color: #ff6347; /* 따뜻한 색상 */
    margin-bottom: 30px;
}

.input-section {
    margin: 20px 0;
    display: flex;
    justify-content: center;
    align-items: center;
}

label {
    font-size: 1.2em;
    margin-right: 10px;
}

select {
    padding: 10px;
    font-size: 1em;
    margin-right: 10px;
    border: 2px solid #ff6347;
    border-radius: 5px;
}

button {
    padding: 10px 20px;
    font-size: 1em;
    background-color: #ff6347;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 5px;
    transition: background-color 0.3s ease;
}

button:hover {
    background-color: #ff4500;
}

#feedback {
    margin-top: 20px;
    font-size: 1.1em;
    color: #ff4500;
}

#card-container {
    margin-top: 30px;
}

/* 이전/다음 버튼 스타일 */
.navigation-buttons {
    margin-bottom: 15px; /* 카드 위에 배치되므로 아래 여백 조정 */
}

.nav-button {
    padding: 10px 15px;
    font-size: 1em;
    background-color: #87cefa;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 5px;
    margin: 0 10px;
    transition: background-color 0.3s ease;
}

.nav-button:hover {
    background-color: #00bfff;
}

.card {
    width: 350px;
    height: auto; /* 높이를 자동으로 조정 */
    /* max-height: 80vh; */ /* max-height 제거 */
    margin: 0 auto;
    perspective: 1000px;
}

.card-content {
    width: 100%;
    background-color: #fff8dc;
    border: 2px solid #ff6347;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    transition: transform 0.6s;
    transform-style: preserve-3d;
    position: relative;
    /* overflow-y: auto; */ /* overflow 제거 */
}

.hidden {
    display: none;
}

.fruit-group {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    margin: 10px 0;
    /* max-height: 150px; */ /* max-height 제거 */
    /* overflow-y: auto; */   /* overflow 제거 */
}

.bundle {
    display: flex;
    align-items: center;
    margin: 5px;
    padding: 5px;
    border: 2px dashed #ff6347;
    border-radius: 10px;
    background-color: #ffe4e1; /* 연한 분홍색 배경 */
}

.bundle .fruit {
    width: 50px;
    height: 50px;
    margin: 2px;
    animation: float 2s ease-in-out infinite;
}

@keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
}

/* 카드 애니메이션 */
.card-content.show {
    animation: flipIn 0.5s forwards;
}

@keyframes flipIn {
    from { opacity: 0; transform: rotateY(90deg); }
    to { opacity: 1; transform: rotateY(0deg); }
}

.description {
    font-size: 1em;
    color: #333;
    margin-top: 10px;
}

/* 모바일(세로) 환경을 위한 반응형 디자인 */
@media (max-width: 600px) {
    .card {
        width: 90%;
        /* max-height: 70vh; */ /* max-height 제거 */
    }

    .bundle .fruit {
        width: 30px;
        height: 30px;
    }

    button, .nav-button {
        padding: 8px 12px;
        font-size: 0.9em;
    }

    label, select {
        font-size: 1em;
    }

    .description {
        font-size: 0.9em;
    }

    .fruit-group {
        /* max-height: 150px; */ /* max-height 제거 */
        /* overflow-y: auto; */   /* overflow 제거 */
    }
}
