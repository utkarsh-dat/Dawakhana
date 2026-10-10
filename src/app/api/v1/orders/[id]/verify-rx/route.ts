/**
 * PATCH /api/v1/orders/[id]/verify-rx — Approve or reject prescription (Pharmacist)
 * 
 * Body: { decision: "APPROVED" | "REJECTED", notes?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyPrescription } from "@/lib/db/orders.service";
import { requirePharmacist } from "@/lib/middleware/auth";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Only pharmacists and admins can verify prescriptions
        const { auth, response } = await requirePharmacist(request);
        if (response) return response;

        const body = await request.json();
        const { decision, notes } = body;

        if (!decision || !["APPROVED", "REJECTED"].includes(decision)) {
            return NextResponse.json(
                { error: "Decision must be 'APPROVED' or 'REJECTED'" },
                { status: 400 }
            );
        }

        const result = await verifyPrescription(
            id,
            decision,
            auth.uid!,
            notes
        );

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Prescription for order ${id} has been ${decision.toLowerCase()}.`,
        });
    } catch (error: any) {
        console.error("API /v1/orders/[id]/verify-rx PATCH error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
