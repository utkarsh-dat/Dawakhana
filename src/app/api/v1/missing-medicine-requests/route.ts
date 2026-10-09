import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { verifyAuth } from "@/lib/middleware/auth";

const STAFF_ROLES = ["pharmacist", "admin"];

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated || !auth.uid) {
    return NextResponse.json({ success: false, error: auth.error || "Authentication required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const medicineName = typeof body.medicineName === "string" ? body.medicineName.trim() : "";
    if (medicineName.length < 3 || medicineName.length > 100) {
      return NextResponse.json({ success: false, error: "Medicine name must be between 3 and 100 characters." }, { status: 400 });
    }

    const { data, error } = await db
      .from("missing_medicine_requests")
      .insert({ user_id: auth.uid, medicine_name: medicineName })
      .select("id, medicine_name, status, created_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/missing-medicine-requests error:", error);
    return NextResponse.json({ success: false, error: "Unable to submit medicine request." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated || !auth.uid) {
    return NextResponse.json({ success: false, error: auth.error || "Authentication required." }, { status: 401 });
  }

  try {
    const query = db
      .from("missing_medicine_requests")
      .select("id, user_id, medicine_name, status, created_at, updated_at")
      .order("created_at", { ascending: false });
    const { data, error } = STAFF_ROLES.includes(auth.role || "")
      ? await query
      : await query.eq("user_id", auth.uid);

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error("GET /api/v1/missing-medicine-requests error:", error);
    return NextResponse.json({ success: false, error: "Unable to load medicine requests." }, { status: 500 });
  }
}
