import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBPD8SXMFl90JUvb_sS4SdkPMaHNeXTA6g",
  authDomain: "jewels-513a2.firebaseapp.com",
  projectId: "jewels-513a2",
  storageBucket: "jewels-513a2.firebasestorage.app",
  messagingSenderId: "747340933020",
  appId: "1:747340933020:web:487dface63d951254aca59",
  measurementId: "G-XW7P5P1P31"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, storage, googleProvider };
