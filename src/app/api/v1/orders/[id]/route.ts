/**
 * GET   /api/v1/orders/[id]        — Get order details
 * PATCH /api/v1/orders/[id]        — Update order status (Admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { doc, getDoc } from "firebase/firestore";
import { transitionOrderStatus, OrderDoc, OrderStatus } from "@/lib/db/orders.service";
import { verifyAuth, requireRole } from "@/lib/middleware/auth";
import { COLLECTIONS } from "@/lib/db/connection";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const auth = await verifyAuth(request);
        if (!auth.authenticated) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        if (!db) throw new Error("Database not initialized");

        const orderRef = doc(db, COLLECTIONS.ORDERS, id);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const order = { id: orderSnap.id, ...orderSnap.data() } as OrderDoc;

        // Customers can only see their own orders
        if (auth.role === "customer" && order.customerId !== auth.uid) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        return NextResponse.json({ success: true, data: order });
    } catch (error: any) {
        console.error("API /v1/orders/[id] GET error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Only admin can update order status
        const { auth, response } = await requireRole(request, ["admin", "pharmacist"]);
        if (response) return response;

        const body = await request.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json(
                { error: "Status is required" },
                { status: 400 }
            );
        }

        const result = await transitionOrderStatus(
            id,
            status as OrderStatus,
            auth.uid!
        );

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Order ${id} status updated to ${status}`,
        });
    } catch (error: any) {
        console.error("API /v1/orders/[id] PATCH error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
