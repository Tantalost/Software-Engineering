import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey:  "AIzaSyCNFb1di6tcjGLZ-9PFVptmXh7CsjfgTR0",
  authDomain:  "ibt-management.firebaseapp.com",
  projectId:  "ibt-management",
  storageBucket:  "ibt-management.firebasestorage.app",
  messagingSenderId: "836090031732",
  appId:  "1:836090031732:web:a64dab9c9f1025efcfab21"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);


