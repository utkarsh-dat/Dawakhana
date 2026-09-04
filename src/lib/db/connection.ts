/**
 * Firestore Database Connection
 * Re-exports the Firestore instance from firebase.ts for use in service modules.
 * Provides server-side utilities for Firestore operations.
 */

import { db } from "../firebase";
import { 
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit, startAfter, 
    runTransaction, writeBatch, increment, serverTimestamp,
    DocumentReference, CollectionReference, Query
} from "firebase/firestore";

// Re-export db instance
export { db };

// Re-export commonly used Firestore functions
export {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit, startAfter,
    runTransaction, writeBatch, increment, serverTimestamp
};

// Collection references
export const COLLECTIONS = {
    MEDICINES: "medicines",
    ORDERS: "orders",
    PRESCRIPTIONS: "prescriptions",
    USERS: "users",
    TRACKING: "tracking",
    MISSING_MEDICINE_REQUESTS: "missingMedicineRequests",
} as const;

// Helper: Get a typed collection reference
export function getCollection(name: string): CollectionReference {
    if (!db) throw new Error("Firestore is not initialized");
    return collection(db, name);
}

// Helper: Get a typed document reference
export function getDocRef(collectionName: string, docId: string): DocumentReference {
    if (!db) throw new Error("Firestore is not initialized");
    return doc(db, collectionName, docId);
}
