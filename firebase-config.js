
// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBIjWVGYWnu7VH6sliEtFToJPwP8dxV74w",
  authDomain: "portfolio-web-af46f.firebaseapp.com",
  projectId: "portfolio-web-af46f",
  storageBucket: "portfolio-web-af46f.firebasestorage.app",
  messagingSenderId: "362528992591",
  appId: "1:362528992591:web:12ec29460f59fe1974693a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, signInWithEmailAndPassword, signOut, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy };
