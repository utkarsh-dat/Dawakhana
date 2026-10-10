import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/middleware/auth";
import { getCustomerPrescriptionRecords } from "@/server/services/prescription";

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);

  if (!auth.authenticated || !auth.uid) {
    return NextResponse.json(
      { success: false, error: auth.error || "Authentication required." },
      { status: 401 }
    );
  }

  if (!["customer", "admin"].includes(auth.role || "customer")) {
    return NextResponse.json(
      { success: false, error: "Only customers and admins can view prescriptions." },
      { status: 403 }
    );
  }

  try {
    const prescriptions = await getCustomerPrescriptionRecords(auth.uid);

    return NextResponse.json({
      success: true,
      data: prescriptions.map(({ id, status, notes, expires_at, created_at, updated_at }) => ({
        id,
        status,
        notes,
        expiresAt: expires_at,
        createdAt: created_at,
        updatedAt: updated_at,
      })),
    });
  } catch (error) {
    console.error("GET /api/v1/prescriptions error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load prescription status." },
      { status: 500 }
    );
  }
}
