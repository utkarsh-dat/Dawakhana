/**
 * Users Service — User & Auth Module
 * 
 * Manages user roles:
 * - customer (default)
 * - pharmacist
 * - delivery_partner
 * - admin
 * 
 * Uses the application database for identity and role/profile data.
 */

import {
    db, doc, getDoc, setDoc, updateDoc, getDocs,
    collection, query, where, serverTimestamp, COLLECTIONS
} from "./connection";

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserRole = "customer" | "pharmacist" | "delivery_partner" | "admin";

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string | null;
    role: UserRole;
    phone: string | null;
    isActive: boolean;
    createdAt: any;
    updatedAt: any;
}

// Hardcoded admin emails (matching existing AuthContext.tsx)
const ADMIN_EMAILS = ["vickynishad011@gmail.com", "utkarshparmar2367@gmail.com"];

// ─── User Profile Management ────────────────────────────────────────────────

/**
 * Get or create a user profile on login.
 * Auto-assigns 'admin' role for known admin emails.
 */
export async function ensureUserProfile(user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}): Promise<UserProfile> {
    if (!db) throw new Error("Database not initialized");

    const userRef = doc(db, COLLECTIONS.USERS, user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return { uid: user.uid, ...userSnap.data() } as UserProfile;
    }

    // Determine role
    const role: UserRole = ADMIN_EMAILS.includes(user.email || "")
        ? "admin"
        : "customer";

    const profile: Omit<UserProfile, "uid"> = {
        email: user.email || "",
        displayName: user.displayName || "",
        photoURL: user.photoURL || null,
        role,
        phone: null,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, profile);
    return { uid: user.uid, ...profile };
}

/**
 * Get a user's role
 */
export async function getUserRole(uid: string): Promise<UserRole | null> {
    if (!db) throw new Error("Database not initialized");

    const userRef = doc(db, COLLECTIONS.USERS, uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return null;
    return (userSnap.data() as UserProfile).role;
}

/**
 * Update a user's role (admin only)
 */
export async function updateUserRole(uid: string, newRole: UserRole): Promise<void> {
    if (!db) throw new Error("Database not initialized");

    const userRef = doc(db, COLLECTIONS.USERS, uid);
    await updateDoc(userRef, {
        role: newRole,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Check if a user has a specific role
 */
export async function hasRole(uid: string, requiredRole: UserRole | UserRole[]): Promise<boolean> {
    const role = await getUserRole(uid);
    if (!role) return false;

    if (Array.isArray(requiredRole)) {
        return requiredRole.includes(role);
    }
    return role === requiredRole;
}

/**
 * Get all users with a specific role
 */
export async function getUsersByRole(role: UserRole): Promise<UserProfile[]> {
    if (!db) throw new Error("Database not initialized");

    const q = query(
        collection(db, COLLECTIONS.USERS),
        where("role", "==", role)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as UserProfile[];
}
