/**
 * Prescription Service — Prescription Upload & Approval Queue
 * 
 * Handles:
 * - Secure prescription image metadata storage
 * - Pharmacist approval queue
 * - Prescription status tracking
 */

import {
    db, doc, getDoc, getDocs, setDoc, updateDoc,
    collection, query, where, orderBy, serverTimestamp, COLLECTIONS
} from "./connection";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PrescriptionDoc {
    id: string;
    customerId: string;
    customerEmail: string;
    orderId: string | null; // Linked order (if any)
    imageUrl: string; // URL from S3/Cloudinary/Firebase Storage
    originalFileName: string;
    mimeType: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    reviewedBy: string | null; // Pharmacist UID
    reviewNotes: string | null;
    detectedMedicines: string[]; // AI-detected medicine names
    createdAt: any;
    updatedAt: any;
}

// ─── Prescription Operations ─────────────────────────────────────────────────

/**
 * Store prescription metadata after image upload
 */
export async function createPrescription(input: {
    customerId: string;
    customerEmail: string;
    imageUrl: string;
    originalFileName: string;
    mimeType: string;
    detectedMedicines?: string[];
    orderId?: string;
}): Promise<string> {
    if (!db) throw new Error("Database not initialized");

    const prescriptionId = `RX-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const prescriptionDoc: Omit<PrescriptionDoc, "id"> = {
        customerId: input.customerId,
        customerEmail: input.customerEmail,
        orderId: input.orderId || null,
        imageUrl: input.imageUrl,
        originalFileName: input.originalFileName,
        mimeType: input.mimeType,
        status: "PENDING",
        reviewedBy: null,
        reviewNotes: null,
        detectedMedicines: input.detectedMedicines || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, COLLECTIONS.PRESCRIPTIONS, prescriptionId), prescriptionDoc);
    return prescriptionId;
}

/**
 * Get pending prescriptions for pharmacist review queue
 */
export async function getPendingPrescriptions(): Promise<PrescriptionDoc[]> {
    if (!db) throw new Error("Database not initialized");

    const q = query(
        collection(db, COLLECTIONS.PRESCRIPTIONS),
        where("status", "==", "PENDING"),
        orderBy("createdAt", "asc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PrescriptionDoc[];
}

/**
 * Review a prescription (pharmacist action)
 */
export async function reviewPrescription(
    prescriptionId: string,
    decision: "APPROVED" | "REJECTED",
    pharmacistId: string,
    notes?: string
): Promise<void> {
    if (!db) throw new Error("Database not initialized");

    const prescRef = doc(db, COLLECTIONS.PRESCRIPTIONS, prescriptionId);

    await updateDoc(prescRef, {
        status: decision,
        reviewedBy: pharmacistId,
        reviewNotes: notes || null,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Get prescriptions by customer
 */
export async function getCustomerPrescriptions(customerId: string): Promise<PrescriptionDoc[]> {
    if (!db) throw new Error("Database not initialized");

    const q = query(
        collection(db, COLLECTIONS.PRESCRIPTIONS),
        where("customerId", "==", customerId),
        orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PrescriptionDoc[];
}

/**
 * Link a prescription to an order
 */
export async function linkPrescriptionToOrder(
    prescriptionId: string,
    orderId: string
): Promise<void> {
    if (!db) throw new Error("Database not initialized");

    const prescRef = doc(db, COLLECTIONS.PRESCRIPTIONS, prescriptionId);
    await updateDoc(prescRef, {
        orderId,
        updatedAt: serverTimestamp(),
    });
}
