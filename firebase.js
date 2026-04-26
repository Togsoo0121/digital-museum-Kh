import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC8BuafpyUUA2qI255Cvo3YLFG1C7c1fDM",
  authDomain: "khentii-museum-app.firebaseapp.com",
  databaseURL:
    "https://khentii-museum-app-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "khentii-museum-app",
  storageBucket: "khentii-museum-app.firebasestorage.app",
  messagingSenderId: "340629147874",
  appId: "1:340629147874:web:0e5c50e6902a0982c34ebb",
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);
