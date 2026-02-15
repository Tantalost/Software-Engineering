import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDNsgKuYC29zCc_HNNT6AUVSMXmGPmMNCk",
  authDomain: "centralized-ibt-management.firebaseapp.com",
  projectId: "centralized-ibt-management",
  storageBucket: "centralized-ibt-management.firebasestorage.app",
  messagingSenderId: "943202396950",
  appId: "1:943202396950:web:14487af98e8bef2efbfe37"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);









