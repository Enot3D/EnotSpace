import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
// For production, these values should come from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDTDN2WIQIz2yIjuYQKuJuWBYt1_sgsdsQ",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "enot-space.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "enot-space",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "enot-space.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "587891910947",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:587891910947:web:8a85980e4103313bf10496",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-HYJMR48FF0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
