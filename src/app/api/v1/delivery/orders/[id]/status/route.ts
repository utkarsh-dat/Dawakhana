/**
 * PATCH /api/v1/delivery/orders/[id]/status — Update delivery tracking state (Delivery Partner)
 * 
 * Body: { status: "OUT_FOR_DELIVERY" | "DELIVERED" | "FAILED_DELIVERY" | "RTO", lat?: number, lng?: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { transitionOrderStatus, OrderStatus } from "@/lib/db/orders.service";
import { requireDeliveryPartner } from "@/lib/middleware/auth";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Only delivery partners and admins can update delivery status
        const { auth, response } = await requireDeliveryPartner(request);
        if (response) return response;

        const body = await request.json();
        const { status, lat, lng } = body;

        // Only allow delivery-relevant status transitions
        const allowedStatuses: OrderStatus[] = ["OUT_FOR_DELIVERY", "DELIVERED", "FAILED_DELIVERY", "RTO"];
        if (!status || !allowedStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Allowed: ${allowedStatuses.join(", ")}` },
                { status: 400 }
            );
        }

        const result = await transitionOrderStatus(id, status, auth.uid!);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        // If location was provided, update tracking (uses existing tracking service)
        if (lat !== undefined && lng !== undefined) {
            try {
                const { updateRiderLocation } = await import("@/lib/tracking/service");
                await updateRiderLocation(id, lat, lng);
            } catch (trackingError) {
                console.warn("Tracking update failed (non-critical):", trackingError);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Delivery status updated to ${status}`,
            orderId: id,
        });
    } catch (error: any) {
        console.error("API /v1/delivery/orders/[id]/status PATCH error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
