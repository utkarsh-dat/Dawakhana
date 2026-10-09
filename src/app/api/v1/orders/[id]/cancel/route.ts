import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAuth } from "@/lib/middleware/auth";
import { ORDER_STATUS, transitionOrderStatus } from "@/lib/db/orders.service";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await verifyAuth(request);
    if (!auth.authenticated || !auth.uid) return NextResponse.json({ success: false, error: auth.error || "Authentication required." }, { status: 401 });
    if (!admin) return NextResponse.json({ success: false, error: "Order service is not configured." }, { status: 503 });

    try {
        const { id } = await params;
        const { data: order, error: fetchError } = await admin.from("orders").select("id, user_id, status").eq("id", id).maybeSingle();
        if (fetchError) throw fetchError;
        if (!order || order.user_id !== auth.uid) return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
        if (!["rx_review", "approved"].includes(order.status)) {
            return NextResponse.json({ success: false, error: "This order can no longer be cancelled." }, { status: 409 });
        }
        const result = await transitionOrderStatus(id, ORDER_STATUS.CANCELLED, auth.uid);
        if (!result.success) return NextResponse.json({ success: false, error: result.error || "Unable to cancel order." }, { status: 409 });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("POST /api/v1/orders/[id]/cancel error:", error);
        return NextResponse.json({ success: false, error: "Unable to cancel order." }, { status: 500 });
    }
}
