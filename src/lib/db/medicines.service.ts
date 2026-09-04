/**
 * Medicine Service — Catalog & Inventory Module
 * 
 * Manages medicine listings with:
 * - Prescription requirement flags (requiresPrescription)
 * - Batch numbers and expiry dates
 * - Real-time stock counts with atomic updates
 * - Search and category filtering
 */

import {
    db, collection, doc, getDoc, getDocs, setDoc, updateDoc,
    query, where, orderBy, limit, startAfter, increment,
    runTransaction, COLLECTIONS
} from "./connection";

// Enhanced Medicine interface matching the specification
export interface MedicineDoc {
    id: string;
    name: string;
    brand: string;
    category: string; // e.g., 'Cardiac', 'Diabetic', 'Wellness', 'OTC', 'Antibiotics'
    price: number;
    stock: number;
    requiresPrescription: boolean;
    expiryDate: string | null; // ISO date string
    batchNumber: string | null;
    description: string;
    image: string;
    rating: number;
    reviews: number;
    inStock: boolean; // Computed from stock > 0
    createdAt: string;
    updatedAt: string;
}

/**
 * Search medicines by name, category, or general query
 */
export async function searchMedicines(params: {
    search?: string;
    category?: string;
    requiresPrescription?: boolean;
    inStockOnly?: boolean;
    pageSize?: number;
}): Promise<MedicineDoc[]> {
    if (!db) throw new Error("Database not initialized");

    const { search, category, requiresPrescription, inStockOnly, pageSize = 50 } = params;

    let q = query(
        collection(db, COLLECTIONS.MEDICINES),
        limit(pageSize)
    );

    // Category filter
    if (category && category !== "All") {
        q = query(
            collection(db, COLLECTIONS.MEDICINES),
            where("category", "==", category),
            limit(pageSize)
        );
    }

    // Prescription filter
    if (requiresPrescription !== undefined) {
        q = query(
            collection(db, COLLECTIONS.MEDICINES),
            where("requiresPrescription", "==", requiresPrescription),
            limit(pageSize)
        );
    }

    const snapshot = await getDocs(q);
    let medicines = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as MedicineDoc[];

    // Client-side search filter (Firestore doesn't support full-text search natively)
    if (search) {
        const searchLower = search.toLowerCase();
        medicines = medicines.filter(med =>
            med.name.toLowerCase().includes(searchLower) ||
            med.brand?.toLowerCase().includes(searchLower) ||
            med.category.toLowerCase().includes(searchLower)
        );
    }

    // In-stock filter
    if (inStockOnly) {
        medicines = medicines.filter(med => med.stock > 0);
    }

    return medicines;
}

/**
 * Get a single medicine by ID
 */
export async function getMedicineById(id: string): Promise<MedicineDoc | null> {
    if (!db) throw new Error("Database not initialized");

    const docRef = doc(db, COLLECTIONS.MEDICINES, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as MedicineDoc;
}

/**
 * Atomic stock reservation — uses Firestore transactions to prevent race conditions.
 * This is the critical safeguard against double-selling.
 * 
 * @returns true if stock was successfully reserved, false if insufficient stock
 */
export async function reserveStock(
    items: { medicineId: string; quantity: number }[]
): Promise<{ success: boolean; failedItems: string[] }> {
    if (!db) throw new Error("Database not initialized");

    const failedItems: string[] = [];

    try {
        await runTransaction(db, async (transaction) => {
            // Phase 1: Read all medicine docs
            const medDocs = await Promise.all(
                items.map(async (item) => {
                    const docRef = doc(db, COLLECTIONS.MEDICINES, item.medicineId);
                    const docSnap = await transaction.get(docRef);
                    return { ref: docRef, data: docSnap.data(), item };
                })
            );

            // Phase 2: Validate all stock levels
            for (const { data, item } of medDocs) {
                if (!data) {
                    failedItems.push(item.medicineId);
                    throw new Error(`Medicine ${item.medicineId} not found`);
                }
                if ((data.stock || 0) < item.quantity) {
                    failedItems.push(item.medicineId);
                    throw new Error(`Insufficient stock for ${data.name}: requested ${item.quantity}, available ${data.stock}`);
                }
            }

            // Phase 3: Atomically decrement all stock counts
            for (const { ref, item } of medDocs) {
                transaction.update(ref, {
                    stock: increment(-item.quantity),
                    updatedAt: new Date().toISOString()
                });
            }
        });

        return { success: true, failedItems: [] };
    } catch (error: any) {
        console.error("Stock reservation failed:", error.message);
        return { success: false, failedItems };
    }
}

/**
 * Release reserved stock (e.g., on order cancellation)
 */
export async function releaseStock(
    items: { medicineId: string; quantity: number }[]
): Promise<void> {
    if (!db) throw new Error("Database not initialized");

    await runTransaction(db, async (transaction) => {
        for (const item of items) {
            const docRef = doc(db, COLLECTIONS.MEDICINES, item.medicineId);
            transaction.update(docRef, {
                stock: increment(item.quantity),
                updatedAt: new Date().toISOString()
            });
        }
    });
}

/**
 * Check if any items in the list require a prescription
 */
export async function checkPrescriptionRequired(
    medicineIds: string[]
): Promise<{ required: boolean; rxItems: string[] }> {
    if (!db) throw new Error("Database not initialized");

    const rxItems: string[] = [];

    for (const id of medicineIds) {
        const med = await getMedicineById(id);
        if (med && med.requiresPrescription) {
            rxItems.push(med.name);
        }
    }

    return { required: rxItems.length > 0, rxItems };
}
