// firebase.js
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailLink,
  signOut
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Use the actual Firebase config values instead of environment variables
const firebaseConfig = {
  apiKey: "AIzaSyC_lfQZTfREjhMnLovd0-M2CK4wEqv37ak",
  authDomain: "bloom-bc472.firebaseapp.com",
  projectId: "bloom-bc472",
  storageBucket: "bloom-bc472.firebasestorage.app",
  messagingSenderId: "157891694203",
  appId: "1:157891694203:web:eb2e9470547c34bd671cde",
  measurementId: "G-W5JMZ8XYFD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get auth instance
const auth = getAuth(app);

// Disable persistence to avoid storage issues
auth.settings = {
  appVerificationDisabledForTesting: true
};

// Helper function to check if device is mobile
export const isMobile = typeof window !== 'undefined' && 
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Helper function to check if browser is Safari
export const isSafari = typeof window !== 'undefined' && 
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// Configure Google provider with custom parameters
const provider = new GoogleAuthProvider();
provider.addScope('profile');
provider.addScope('email');
provider.setCustomParameters({
  // Force account selection even when one account is available
  prompt: 'select_account',
  // These parameters can help with iOS Safari issues
  login_hint: 'user@example.com'
});

export { auth };
export { provider };
export const db = getFirestore(app);
export { signInWithPopup, signInWithRedirect, getRedirectResult, signOut };
