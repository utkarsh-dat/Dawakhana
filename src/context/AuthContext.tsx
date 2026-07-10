"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
    User,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

const ADMIN_EMAILS = ["vickynishad110@gmail.com", "utkarshparmar2367@gmail.com"];

interface AuthContextType {
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAdmin: false,
    loading: true,
    loginWithGoogle: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            console.warn("AuthContext: Firebase Auth is not initialized. Check your environment variables.");
            // eslint-disable-next-line
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsAdmin(currentUser ? ADMIN_EMAILS.includes(currentUser.email || "") : false);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        if (!auth) {
            alert("Authentication is not configured. Please check site settings.");
            return;
        }
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Error logging in with Google:", error);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;

            // Handle specific Firebase Auth errors
            if (err?.code === 'auth/popup-closed-by-user') {
                alert("Login cancelled. You closed the popup.");
            } else if (err?.code === 'auth/cancelled-popup-request') {
                // Multiple popups, ignore
            } else if (err?.code === 'auth/unauthorized-domain') {
                alert("Login failed: This domain is not authorized in Firebase Console. Please add it to Authentication > Settings > Authorized Domains.");
            } else if (err?.code === 'auth/operation-not-allowed') {
                alert("Login failed: Google/Email provider is not enabled in Firebase Console.");
            } else {
                alert(`Login failed: ${err.message || "Unknown error"}`);
            }
            throw error;
        }
    };

    const logout = async () => {
        if (!auth) return;

        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error logging out:", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAdmin, loading, loginWithGoogle, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
