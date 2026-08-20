// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDda83HC3JhFFV8QZ_h0WR5E6vKNIIT-Uo",
    authDomain: "bebe-2f40d.firebaseapp.com",
    projectId: "bebe-2f40d",
    storageBucket: "bebe-2f40d.firebasestorage.app",
    messagingSenderId: "213215665444",
    appId: "1:213215665444:web:5afc6d3d3da8aa3fb927b1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);