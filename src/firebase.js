import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCYXnWKsPsDLXh5fKOB4011NzWeG59rTyw",
  authDomain: "intcolectiva-aa620.firebaseapp.com",
  projectId: "intcolectiva-aa620",
  storageBucket: "intcolectiva-aa620.firebasestorage.app",
  messagingSenderId: "430628599497",
  appId: "1:430628599497:web:d136a98b80a553e0687f18"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);