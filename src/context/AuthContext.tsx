"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
    User,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    loginWithGoogle: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error: any) {
            console.error("Error logging in with Google:", error);

            // Handle specific Firebase Auth errors
            if (error?.code === 'auth/popup-closed-by-user') {
                alert("Login cancelled. You closed the popup.");
            } else if (error?.code === 'auth/cancelled-popup-request') {
                // Multiple popups, ignore
            } else if (error?.code === 'auth/unauthorized-domain') {
                alert("Login failed: This domain is not authorized in Firebase Console. Please add it to Authentication > Settings > Authorized Domains.");
            } else if (error?.code === 'auth/operation-not-allowed') {
                alert("Login failed: Google/Email provider is not enabled in Firebase Console.");
            } else {
                alert(`Login failed: ${error.message || "Unknown error"}`);
            }
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error logging out:", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
