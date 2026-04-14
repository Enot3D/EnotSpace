import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ⚠️ ВАЖНО: Замени эти значения на свои из Firebase Console
// https://console.firebase.google.com/ → Project Settings → General → Your apps
const firebaseConfig = {
  apiKey: "AIzaSyDTDN2WIQIz2yIjuYQKuJuWBYt1_sgsdsQ",
  authDomain: "enot-space.firebaseapp.com",
  projectId: "enot-space",
  storageBucket: "enot-space.firebasestorage.app",
  messagingSenderId: "587891910947",
  appId: "1:587891910947:web:8a85980e4103313bf10496",
  measurementId: "G-HYJMR48FF0"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Сервисы
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;


