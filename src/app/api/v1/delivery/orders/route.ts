import { NextRequest, NextResponse } from "next/server";
import { getOrdersByDeliveryPartner } from "@/lib/db/orders.service";
import { requireDeliveryPartner } from "@/lib/middleware/auth";

export async function GET(request: NextRequest) {
    const { auth, response } = await requireDeliveryPartner(request);
    if (response) return response;

    try {
        const orders = await getOrdersByDeliveryPartner(auth.uid!);
        return NextResponse.json({ success: true, data: orders });
    } catch (error) {
        console.error("GET /api/v1/delivery/orders error:", error);
        return NextResponse.json({ success: false, error: "Unable to load assigned orders." }, { status: 500 });
    }
}
