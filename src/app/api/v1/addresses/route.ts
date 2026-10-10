import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAuth } from "@/lib/middleware/auth";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

async function context(request: NextRequest) {
    const auth = await verifyAuth(request);
    if (!auth.authenticated || !auth.uid) {
        return { response: NextResponse.json({ success: false, error: auth.error || "Authentication required." }, { status: 401 }) };
    }
    if (!admin) return { response: NextResponse.json({ success: false, error: "Address service is not configured." }, { status: 503 }) };
    return { auth, db: admin };
}

export async function GET(request: NextRequest) {
    const result = await context(request);
    if ("response" in result) return result.response;
    const { data, error } = await result.db.from("addresses").select("*").eq("user_id", result.auth.uid).order("is_default", { ascending: false }).order("created_at", { ascending: false });
    if (error) {
        console.error("GET /api/v1/addresses error:", error);
        return NextResponse.json({ success: false, error: "Unable to load saved addresses." }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: data || [] });
}

export async function POST(request: NextRequest) {
    const result = await context(request);
    if ("response" in result) return result.response;
    try {
        const body = await request.json();
        const required = ["firstName", "lastName", "address", "phoneNumber", "postalCode"];
        if (required.some((field) => typeof body[field] !== "string" || !body[field].trim())) {
            return NextResponse.json({ success: false, error: "All address fields are required." }, { status: 400 });
        }
        const isDefault = Boolean(body.isDefault);
        if (isDefault) await result.db.from("addresses").update({ is_default: false }).eq("user_id", result.auth.uid);
        const { data, error } = await result.db.from("addresses").insert({
            user_id: result.auth.uid,
            first_name: body.firstName.trim(),
            last_name: body.lastName.trim(),
            street: body.address.trim(),
            city: typeof body.city === "string" ? body.city.trim() : "",
            state: typeof body.state === "string" ? body.state.trim() : "",
            postal_code: body.postalCode.trim(),
            phone: body.phoneNumber.trim(),
            is_default: isDefault,
        }).select("*").single();
        if (error) throw error;
        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) {
        console.error("POST /api/v1/addresses error:", error);
        return NextResponse.json({ success: false, error: "Unable to save address." }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const result = await context(request);
    if ("response" in result) return result.response;
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Address ID is required." }, { status: 400 });
    const { error } = await result.db.from("addresses").delete().eq("id", id).eq("user_id", result.auth.uid);
    if (error) {
        console.error("DELETE /api/v1/addresses error:", error);
        return NextResponse.json({ success: false, error: "Unable to delete address." }, { status: 500 });
    }
    return NextResponse.json({ success: true });
}
