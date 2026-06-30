import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  type User 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Standard scopes for basic profile access
googleProvider.addScope("profile");
googleProvider.addScope("email");

export { signInWithPopup, signOut, onAuthStateChanged, type User };
