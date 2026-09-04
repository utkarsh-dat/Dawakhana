/**
 * POST /api/v1/orders — Create order & reserve stock (Customer)
 * GET  /api/v1/orders — Get orders for the authenticated user
 */

import { NextRequest, NextResponse } from "next/server";
import { createOrder, getOrdersByCustomer } from "@/lib/db/orders.service";
import { verifyAuth } from "@/lib/middleware/auth";

export async function POST(request: NextRequest) {
    try {
        // Authenticate
        const auth = await verifyAuth(request);
        if (!auth.authenticated) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const body = await request.json();
        const { items, prescriptionUrl, paymentMethod, transactionId, deliveryAddress } = body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: "Order must contain at least one item" },
                { status: 400 }
            );
        }

        if (!deliveryAddress) {
            return NextResponse.json(
                { error: "Delivery address is required" },
                { status: 400 }
            );
        }

        const result = await createOrder({
            customerId: auth.uid!,
            customerEmail: auth.email || "",
            items,
            prescriptionUrl,
            paymentMethod: paymentMethod || "COD",
            transactionId,
            deliveryAddress,
        });

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            orderId: result.orderId,
            message: "Order created successfully with stock reserved.",
        }, { status: 201 });

    } catch (error: any) {
        console.error("API /v1/orders POST error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        // Authenticate
        const auth = await verifyAuth(request);
        if (!auth.authenticated) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const orders = await getOrdersByCustomer(auth.uid!);

        return NextResponse.json({
            success: true,
            count: orders.length,
            data: orders,
        });
    } catch (error: any) {
        console.error("API /v1/orders GET error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
