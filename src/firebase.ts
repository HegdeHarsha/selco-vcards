import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyCpMulx58q-AXaCD8zFb1DwXOQq9irg0-g",
  authDomain: "selco-vcards.firebaseapp.com",
  projectId: "selco-vcards",
  storageBucket: "selco-vcards.firebasestorage.app",
  messagingSenderId: "812430572722",
  appId: "1:812430572722:web:42a604934a5d27eb5d5dab"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);