// findfirebaseconfig.js

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyCwVxx0Pxd7poc_zGSp1aY9qfd89bpVUW0",
    authDomain: "finddalbong.firebaseapp.com",
    projectId: "finddalbong",
    storageBucket: "finddalbong.appspot.com", // 올바른 형식으로 수정
    messagingSenderId: "982765399272",
    appId: "1:982765399272:web:02344ab408272c60e2ad5d"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Firestore 초기화
const db = firebase.firestore();
