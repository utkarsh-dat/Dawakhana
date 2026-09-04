"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
    User,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const ADMIN_EMAILS = ["vickynishad011@gmail.com", "utkarshparmar2367@gmail.com"];
const PHARMACIST_EMAILS = ["pharmacist@dawakhana.com"];
const DELIVERY_EMAILS = ["delivery@dawakhana.com"];

export type UserRole = "customer" | "pharmacist" | "delivery_partner" | "admin";

interface AuthContextType {
    user: User | null;
    role: UserRole;
    isAdmin: boolean;
    isPharmacist: boolean;
    isDeliveryPartner: boolean;
    loading: boolean;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: "customer",
    isAdmin: false,
    isPharmacist: false,
    isDeliveryPartner: false,
    loading: true,
    loginWithGoogle: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>("customer");
    const [loading, setLoading] = useState(true);

    const isAdmin = role === "admin";
    const isPharmacist = role === "pharmacist";
    const isDeliveryPartner = role === "delivery_partner";

    useEffect(() => {
        if (!auth) {
            console.warn("AuthContext: Firebase Auth is not initialized. Check your environment variables.");
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    // Sync profile and fetch role from Firestore
                    const userRef = doc(db, "users", currentUser.uid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        setRole(data.role || "customer");
                    } else {
                        // Create default user profile
                        let initialRole: UserRole = "customer";
                        if (ADMIN_EMAILS.includes(currentUser.email || "")) {
                            initialRole = "admin";
                        } else if (PHARMACIST_EMAILS.includes(currentUser.email || "")) {
                            initialRole = "pharmacist";
                        } else if (DELIVERY_EMAILS.includes(currentUser.email || "")) {
                            initialRole = "delivery_partner";
                        }

                        await setDoc(userRef, {
                            email: currentUser.email || "",
                            displayName: currentUser.displayName || "",
                            photoURL: currentUser.photoURL || null,
                            role: initialRole,
                            isActive: true,
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp(),
                        });
                        setRole(initialRole);
                    }
                } catch (error) {
                    console.error("Error fetching/syncing user profile:", error);
                    // Fallback to email list check on failure
                    if (ADMIN_EMAILS.includes(currentUser.email || "")) {
                        setRole("admin");
                    } else {
                        setRole("customer");
                    }
                }
            } else {
                setRole("customer");
            }
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;

            // Handle specific Firebase Auth errors
            if (err?.code === 'auth/popup-closed-by-user') {
                console.warn("User closed the Google auth login popup window.");
                alert("Login cancelled. You closed the popup.");
            } else if (err?.code === 'auth/cancelled-popup-request') {
                console.warn("Google auth popup request was cancelled (duplicate request).");
            } else {
                console.error("Error logging in with Google:", error);
                if (err?.code === 'auth/unauthorized-domain') {
                    alert("Login failed: This domain is not authorized in Firebase Console. Please add it to Authentication > Settings > Authorized Domains.");
                } else if (err?.code === 'auth/operation-not-allowed') {
                    alert("Login failed: Google/Email provider is not enabled in Firebase Console.");
                } else {
                    alert(`Login failed: ${err.message || "Unknown error"}`);
                    throw error;
                }
            }
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
        <AuthContext.Provider value={{
            user,
            role,
            isAdmin,
            isPharmacist,
            isDeliveryPartner,
            loading,
            loginWithGoogle,
            logout
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

