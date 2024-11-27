// logicgamefirebaseConfig.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB-HZlpoNP0xcj9punWXpxHsgmuNHONCyU",
    authDomain: "jigsawdalbong.firebaseapp.com",
    projectId: "jigsawdalbong",
    storageBucket: "jigsawdalbong.firebasestorage.app",
    messagingSenderId: "507344274155",
    appId: "1:507344274155:web:c3dc52320d9e618ac6b4ae"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export db for use in other scripts
export { db };
