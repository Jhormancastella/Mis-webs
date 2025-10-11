// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "portfolio-jhorman.firebaseapp.com",
    projectId: "portfolio-jhorman",
    storageBucket: "portfolio-jhorman.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef123456789"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar servicios
const db = firebase.firestore();
const auth = firebase.auth();
