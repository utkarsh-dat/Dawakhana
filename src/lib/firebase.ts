import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyBE9dlO2lvSoYpFfqtvRLe4iOiR8tNUXJU",
    authDomain: "dawakhana-99269.firebaseapp.com",
    projectId: "dawakhana-99269",
    storageBucket: "dawakhana-99269.firebasestorage.app",
    messagingSenderId: "507485906944",
    appId: "1:507485906944:web:260831bd16c73372f250e5",
    measurementId: "G-V4WND4S19K"
};

// Initialize Firebase (singleton pattern to avoid reloading)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Analytics (only on client side)
let analytics;
if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { app, auth, googleProvider, analytics };
