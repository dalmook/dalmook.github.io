// firebaseConfig.js

// Firebase 구성 정보 (Firebase 콘솔에서 복사한 실제 설정으로 교체)
const firebaseConfig = {
    apiKey: "AIzaSyCM5kmJDA9zeBg3zmutWk2urV1g3GDHMjw",
    authDomain: "logicgamedalbong.firebaseapp.com",
    projectId: "logicgamedalbong",
    storageBucket: "logicgamedalbong.firebasestorage.app",
    messagingSenderId: "185772514625",
    appId: "1:185772514625:web:a8b9c944e7cdea588255c0"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
window.db = firebase.firestore(); // 글로벌 변수로 설정
