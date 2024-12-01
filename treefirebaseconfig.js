// treefirebaseconfig.js

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyC3x1tnp332a45hHZEsfoBF1RwWynxy8nA",
  authDomain: "treedalbong.firebaseapp.com",
  projectId: "treedalbong",
  storageBucket: "treedalbong.firebasestorage.app",
  messagingSenderId: "787155974055",
  appId: "1:787155974055:web:ce7aa3a06bfc06bc516882"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
