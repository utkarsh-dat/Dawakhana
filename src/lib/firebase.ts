import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase (singleton pattern to avoid reloading)
let app: FirebaseApp = undefined as unknown as FirebaseApp;
let auth: Auth = undefined as unknown as Auth;
let googleProvider: GoogleAuthProvider = undefined as unknown as GoogleAuthProvider;
let db: Firestore = undefined as unknown as Firestore;
let analytics: Analytics = undefined as unknown as Analytics;

if (typeof window !== 'undefined' || firebaseConfig.apiKey) {
    try {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        googleProvider = new GoogleAuthProvider();
        db = getFirestore(app);
    } catch (error) {
        console.error("Firebase initialization error:", error);
    }
}

// Initialize Analytics (only on client side)
if (typeof window !== 'undefined' && app) {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { app, auth, googleProvider, analytics, db };
