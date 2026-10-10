/**
 * Prescription Guard Middleware
 * 
 * CRITICAL SAFEGUARD: Blocks orders containing requiresPrescription: true items
 * from transitioning to PACKED without explicit approval from a pharmacist account.
 */

import { NextResponse } from "next/server";
import { OrderDoc, ORDER_STATUS } from "../db/orders.service";

/**
 * Validate that an order can proceed to the PACKED status.
 * Returns an error response if prescription enforcement blocks it.
 */
export function enforcePrescriptionRequirement(
    order: OrderDoc,
    targetStatus: string
): NextResponse | null {
    // Only enforce on transition to PACKED
    if (targetStatus !== ORDER_STATUS.PACKED) return null;

    // Check if any items require prescription
    const rxItems = order.items.filter(item => item.requiresPrescription);
    if (rxItems.length === 0) return null;

    // Block if prescription is not approved
    if (order.prescriptionStatus !== "APPROVED") {
        const rxItemNames = rxItems.map(item => item.medicineName).join(", ");
        return NextResponse.json(
            {
                error: "Prescription verification required",
                message: `Cannot pack order: The following items require an approved prescription: ${rxItemNames}`,
                prescriptionStatus: order.prescriptionStatus,
                requiresAction: "pharmacist_review"
            },
            { status: 403 }
        );
    }

    return null; // All checks passed
}
