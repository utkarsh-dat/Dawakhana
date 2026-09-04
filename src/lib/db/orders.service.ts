/**
 * Order Service — Order Engine Module
 * 
 * Manages the complete order lifecycle with:
 * - Order creation with atomic stock reservation
 * - State machine transitions with validation
 * - Prescription enforcement
 * - Payment status tracking
 */

import {
    db, collection, doc, getDoc, getDocs, setDoc, updateDoc,
    query, where, orderBy, limit, serverTimestamp,
    runTransaction, COLLECTIONS
} from "./connection";
import { reserveStock, releaseStock, checkPrescriptionRequired } from "./medicines.service";

// ─── Order Status Constants ──────────────────────────────────────────────────

export const ORDER_STATUS = {
    PENDING_RX_VERIFICATION: "PENDING_RX_VERIFICATION",
    ORDER_PLACED: "ORDER_PLACED",
    PACKED: "PACKED",
    OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
} as const;

export const PAYMENT_STATUS = {
    PENDING: "PENDING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];
export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

// Valid state transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
    [ORDER_STATUS.PENDING_RX_VERIFICATION]: [ORDER_STATUS.ORDER_PLACED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.ORDER_PLACED]: [ORDER_STATUS.PACKED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PACKED]: [ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.OUT_FOR_DELIVERY]: [ORDER_STATUS.DELIVERED],
    [ORDER_STATUS.DELIVERED]: [],
    [ORDER_STATUS.CANCELLED]: [],
};

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface OrderItem {
    medicineId: string;
    medicineName: string;
    quantity: number;
    priceAtPurchase: number;
    image: string;
    requiresPrescription: boolean;
}

export interface DeliveryAddress {
    street: string;
    city: string;
    pincode: string;
    fullAddress: string;
    phone: string;
    firstName: string;
    lastName: string;
}

export interface OrderDoc {
    id: string;
    customerId: string;
    customerEmail: string;
    items: OrderItem[];
    prescriptionUrl: string | null;
    prescriptionStatus: "NOT_REQUIRED" | "PENDING" | "APPROVED" | "REJECTED";
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethod: string;
    transactionId: string | null;
    subtotal: number;
    deliveryFee: number;
    total: number;
    deliveryAddress: DeliveryAddress;
    createdAt: any; // Firestore serverTimestamp
    updatedAt: any;
    statusHistory: { status: string; timestamp: string; updatedBy: string }[];
}

// ─── Order Creation ──────────────────────────────────────────────────────────

export interface CreateOrderInput {
    customerId: string;
    customerEmail: string;
    items: {
        medicineId: string;
        medicineName: string;
        quantity: number;
        price: number;
        image: string;
    }[];
    prescriptionUrl?: string;
    paymentMethod: string;
    transactionId?: string;
    deliveryAddress: DeliveryAddress;
}

/**
 * Create a new order with stock reservation and prescription enforcement.
 * 
 * Critical safeguards implemented:
 * 1. Atomic stock updates via Firestore transactions
 * 2. Prescription requirement check
 * 3. Order status set based on prescription needs
 */
export async function createOrder(input: CreateOrderInput): Promise<{
    success: boolean;
    orderId?: string;
    error?: string;
}> {
    if (!db) throw new Error("Database not initialized");

    const { customerId, customerEmail, items, prescriptionUrl, paymentMethod, transactionId, deliveryAddress } = input;

    // Step 1: Check if any items require prescription
    const medicineIds = items.map(item => item.medicineId);
    const rxCheck = await checkPrescriptionRequired(medicineIds);

    // Step 2: Determine initial status
    let initialStatus: OrderStatus;
    let prescriptionStatus: OrderDoc["prescriptionStatus"];

    if (rxCheck.required) {
        if (!prescriptionUrl) {
            return {
                success: false,
                error: `Prescription required for: ${rxCheck.rxItems.join(", ")}. Please upload a prescription.`
            };
        }
        initialStatus = ORDER_STATUS.PENDING_RX_VERIFICATION;
        prescriptionStatus = "PENDING";
    } else {
        initialStatus = ORDER_STATUS.ORDER_PLACED;
        prescriptionStatus = "NOT_REQUIRED";
    }

    // Step 3: Reserve stock atomically
    const stockItems = items.map(item => ({
        medicineId: item.medicineId,
        quantity: item.quantity
    }));

    const stockResult = await reserveStock(stockItems);
    if (!stockResult.success) {
        return {
            success: false,
            error: `Stock reservation failed for items: ${stockResult.failedItems.join(", ")}`
        };
    }

    // Step 4: Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const DELIVERY_THRESHOLD = 200;
    const STANDARD_DELIVERY_FEE = 40;
    const deliveryFee = subtotal >= DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
    const total = subtotal + deliveryFee;

    // Step 5: Create order document
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const orderDoc: Omit<OrderDoc, "id"> = {
        customerId,
        customerEmail,
        items: items.map(item => ({
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            quantity: item.quantity,
            priceAtPurchase: item.price,
            image: item.image,
            requiresPrescription: rxCheck.rxItems.includes(item.medicineName),
        })),
        prescriptionUrl: prescriptionUrl || null,
        prescriptionStatus,
        status: initialStatus,
        paymentStatus: paymentMethod === "COD" ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.PENDING,
        paymentMethod,
        transactionId: transactionId || null,
        subtotal,
        deliveryFee,
        total,
        deliveryAddress,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        statusHistory: [{
            status: initialStatus,
            timestamp: new Date().toISOString(),
            updatedBy: "system"
        }],
    };

    try {
        await setDoc(doc(db, COLLECTIONS.ORDERS, orderId), orderDoc);
        return { success: true, orderId };
    } catch (error: any) {
        // Rollback stock reservation on failure
        await releaseStock(stockItems).catch(e => console.error("Stock rollback failed:", e));
        return { success: false, error: `Failed to create order: ${error.message}` };
    }
}

// ─── Order Status Transitions ────────────────────────────────────────────────

/**
 * Transition order to a new status with validation.
 * 
 * CRITICAL SAFEGUARD: Orders containing requiresPrescription items
 * cannot transition to PACKED without pharmacist approval.
 */
export async function transitionOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    updatedBy: string
): Promise<{ success: boolean; error?: string }> {
    if (!db) throw new Error("Database not initialized");

    const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
        return { success: false, error: "Order not found" };
    }

    const order = orderSnap.data() as OrderDoc;

    // Validate transition
    const validNextStates = VALID_TRANSITIONS[order.status] || [];
    if (!validNextStates.includes(newStatus)) {
        return {
            success: false,
            error: `Invalid transition: ${order.status} → ${newStatus}. Valid: ${validNextStates.join(", ")}`
        };
    }

    // PRESCRIPTION ENFORCEMENT: Block packing without Rx approval
    if (newStatus === ORDER_STATUS.PACKED) {
        const hasRxItems = order.items.some(item => item.requiresPrescription);
        if (hasRxItems && order.prescriptionStatus !== "APPROVED") {
            return {
                success: false,
                error: "Cannot pack order: Prescription items require pharmacist approval before packing."
            };
        }
    }

    // Handle cancellation: release reserved stock
    if (newStatus === ORDER_STATUS.CANCELLED) {
        const stockItems = order.items.map(item => ({
            medicineId: item.medicineId,
            quantity: item.quantity
        }));
        await releaseStock(stockItems);
    }

    // Update order status
    await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        statusHistory: [
            ...order.statusHistory,
            { status: newStatus, timestamp: new Date().toISOString(), updatedBy }
        ],
    });

    return { success: true };
}

// ─── Prescription Verification ───────────────────────────────────────────────

/**
 * Pharmacist approves or rejects a prescription.
 * Only users with 'pharmacist' or 'admin' role should call this.
 */
export async function verifyPrescription(
    orderId: string,
    decision: "APPROVED" | "REJECTED",
    pharmacistId: string,
    notes?: string
): Promise<{ success: boolean; error?: string }> {
    if (!db) throw new Error("Database not initialized");

    const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
        return { success: false, error: "Order not found" };
    }

    const order = orderSnap.data() as OrderDoc;

    if (order.status !== ORDER_STATUS.PENDING_RX_VERIFICATION) {
        return { success: false, error: "Order is not pending Rx verification" };
    }

    if (decision === "APPROVED") {
        // Approve prescription → move to ORDER_PLACED
        await updateDoc(orderRef, {
            prescriptionStatus: "APPROVED",
            status: ORDER_STATUS.ORDER_PLACED,
            updatedAt: serverTimestamp(),
            rxApprovedBy: pharmacistId,
            rxApprovalNotes: notes || "",
            statusHistory: [
                ...order.statusHistory,
                { status: "RX_APPROVED", timestamp: new Date().toISOString(), updatedBy: pharmacistId },
                { status: ORDER_STATUS.ORDER_PLACED, timestamp: new Date().toISOString(), updatedBy: pharmacistId },
            ],
        });
    } else {
        // Reject prescription → cancel order & release stock
        const stockItems = order.items.map(item => ({
            medicineId: item.medicineId,
            quantity: item.quantity
        }));
        await releaseStock(stockItems);

        await updateDoc(orderRef, {
            prescriptionStatus: "REJECTED",
            status: ORDER_STATUS.CANCELLED,
            updatedAt: serverTimestamp(),
            rxRejectedBy: pharmacistId,
            rxRejectionNotes: notes || "Prescription invalid or unreadable",
            statusHistory: [
                ...order.statusHistory,
                { status: "RX_REJECTED", timestamp: new Date().toISOString(), updatedBy: pharmacistId },
                { status: ORDER_STATUS.CANCELLED, timestamp: new Date().toISOString(), updatedBy: pharmacistId },
            ],
        });
    }

    return { success: true };
}

// ─── Payment Updates ─────────────────────────────────────────────────────────

/**
 * Update payment status (called by webhook handler or admin)
 */
export async function updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    transactionId?: string
): Promise<{ success: boolean; error?: string }> {
    if (!db) throw new Error("Database not initialized");

    const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
        return { success: false, error: "Order not found" };
    }

    const updateData: any = {
        paymentStatus,
        updatedAt: serverTimestamp(),
    };

    if (transactionId) {
        updateData.transactionId = transactionId;
    }

    // If payment failed, cancel the order and release stock
    if (paymentStatus === PAYMENT_STATUS.FAILED) {
        const order = orderSnap.data() as OrderDoc;
        const stockItems = order.items.map(item => ({
            medicineId: item.medicineId,
            quantity: item.quantity
        }));
        await releaseStock(stockItems);
        updateData.status = ORDER_STATUS.CANCELLED;
    }

    await updateDoc(orderRef, updateData);
    return { success: true };
}

// ─── Order Queries ───────────────────────────────────────────────────────────

/**
 * Get orders by customer ID
 */
export async function getOrdersByCustomer(customerId: string): Promise<OrderDoc[]> {
    if (!db) throw new Error("Database not initialized");

    const q = query(
        collection(db, COLLECTIONS.ORDERS),
        where("customerId", "==", customerId),
        orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OrderDoc[];
}

/**
 * Get orders pending pharmacist review
 */
export async function getPendingRxOrders(): Promise<OrderDoc[]> {
    if (!db) throw new Error("Database not initialized");

    const q = query(
        collection(db, COLLECTIONS.ORDERS),
        where("status", "==", ORDER_STATUS.PENDING_RX_VERIFICATION),
        orderBy("createdAt", "asc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OrderDoc[];
}
