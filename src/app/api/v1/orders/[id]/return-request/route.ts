import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAuth } from "@/lib/middleware/auth";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await verifyAuth(request);
    if (!auth.authenticated || !auth.uid) return NextResponse.json({ success: false, error: auth.error || "Authentication required." }, { status: 401 });
    if (!admin) return NextResponse.json({ success: false, error: "Return service is not configured." }, { status: 503 });

    try {
        const { id } = await params;
        const body = await request.json();
        const reason = typeof body.reason === "string" ? body.reason.trim() : "";
        if (reason.length < 10 || reason.length > 500) return NextResponse.json({ success: false, error: "Please provide a reason between 10 and 500 characters." }, { status: 400 });
        const { data: order } = await admin.from("orders").select("id, user_id, status").eq("id", id).maybeSingle();
        if (!order || order.user_id !== auth.uid) return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
        if (order.status !== "delivered") return NextResponse.json({ success: false, error: "Return requests are available after delivery." }, { status: 409 });
        const { data, error } = await admin.from("return_requests").insert({ order_id: id, user_id: auth.uid, reason }).select("id, status, created_at").single();
        if (error) throw error;
        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) {
        console.error("POST /api/v1/orders/[id]/return-request error:", error);
        return NextResponse.json({ success: false, error: "Unable to submit return request." }, { status: 500 });
    }
}
