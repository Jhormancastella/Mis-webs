// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBIjWVGYWnu7VH6sliEtFToJPwP8dxV74w",
  authDomain: "portfolio-web-af46f.firebaseapp.com",
  projectId: "portfolio-web-af46f",
  storageBucket: "portfolio-web-af46f.firebasestorage.app",
  messagingSenderId: "362528992591",
  appId: "1:362528992591:web:12ec29460f59fe1974693a",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

export { app, db, auth }
