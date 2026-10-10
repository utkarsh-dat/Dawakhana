import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAuth } from "@/lib/middleware/auth";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    : null;

async function authenticate(request: NextRequest) {
    const auth = await verifyAuth(request);
    if (!auth.authenticated || !auth.uid) {
        return { response: NextResponse.json({ success: false, error: auth.error || "Authentication required." }, { status: 401 }) };
    }
    if (!supabaseAdmin) {
        return { response: NextResponse.json({ success: false, error: "Wishlist service is not configured." }, { status: 503 }) };
    }
    return { auth, client: supabaseAdmin };
}

export async function GET(request: NextRequest) {
    const result = await authenticate(request);
    if ("response" in result) return result.response;

    const { data, error } = await result.client
        .from("wishlists")
        .select("medicine_id, created_at, medicines(*)")
        .eq("user_id", result.auth.uid)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("GET /api/v1/wishlist error:", error);
        return NextResponse.json({ success: false, error: "Unable to load wishlist." }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: data || [] });
}

export async function POST(request: NextRequest) {
    const result = await authenticate(request);
    if ("response" in result) return result.response;

    try {
        const { medicineId } = await request.json();
        if (typeof medicineId !== "string" || medicineId.trim().length === 0) {
            return NextResponse.json({ success: false, error: "Medicine ID is required." }, { status: 400 });
        }

        const { data: medicine, error: medicineError } = await result.client
            .from("medicines")
            .select("id")
            .eq("id", medicineId)
            .maybeSingle();
        if (medicineError) throw medicineError;
        if (!medicine) return NextResponse.json({ success: false, error: "Medicine not found." }, { status: 404 });

        const { error } = await result.client
            .from("wishlists")
            .upsert({ user_id: result.auth.uid, medicine_id: medicineId }, { onConflict: "user_id,medicine_id", ignoreDuplicates: true });
        if (error) throw error;
        return NextResponse.json({ success: true, saved: true }, { status: 201 });
    } catch (error) {
        console.error("POST /api/v1/wishlist error:", error);
        return NextResponse.json({ success: false, error: "Unable to save medicine." }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const result = await authenticate(request);
    if ("response" in result) return result.response;

    const medicineId = request.nextUrl.searchParams.get("medicineId");
    if (!medicineId) return NextResponse.json({ success: false, error: "Medicine ID is required." }, { status: 400 });

    const { error } = await result.client
        .from("wishlists")
        .delete()
        .eq("user_id", result.auth.uid)
        .eq("medicine_id", medicineId);
    if (error) {
        console.error("DELETE /api/v1/wishlist error:", error);
        return NextResponse.json({ success: false, error: "Unable to remove medicine." }, { status: 500 });
    }
    return NextResponse.json({ success: true, saved: false });
}
