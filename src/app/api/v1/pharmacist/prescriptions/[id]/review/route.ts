import { NextRequest, NextResponse } from "next/server";
import { processPrescriptionReview } from "@/server/services/pharmacistReview";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || "fallback_super_secret_jwt_key_32bytes!";

/**
 * POST /api/v1/pharmacist/prescriptions/[id]/review
 * 
 * Process Pharmacist Review Endpoint
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: prescriptionId } = await params;

    // 1. Authenticate & Enforce Pharmacist Role
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authentication required. Format: Bearer <token>" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err: any) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired JWT token." },
        { status: 401 }
      );
    }

    const pharmacistId = decoded.sub || decoded.id;
    const role = decoded.role || decoded.user_metadata?.role;

    if (!["pharmacist", "admin"].includes(role)) {
      return NextResponse.json(
        { success: false, error: `Access denied. Role 'pharmacist' required. Current role: '${role}'.` },
        { status: 403 }
      );
    }

    // 2. Parse & Validate Body
    const body = await request.json();
    const { status, pharmacist_notes, approved_medicine_ids } = body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status. Allowed values: 'approved' or 'rejected'." },
        { status: 400 }
      );
    }

    if (!pharmacist_notes || typeof pharmacist_notes !== "string" || pharmacist_notes.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "pharmacist_notes string is required." },
        { status: 400 }
      );
    }

    // 3. Process Review Transactionally
    const reviewData = await processPrescriptionReview({
      prescriptionId,
      pharmacistId,
      status,
      pharmacistNotes: pharmacist_notes.trim(),
      approvedMedicineIds: approved_medicine_ids,
    });

    return NextResponse.json({
      success: true,
      message: `Prescription #${prescriptionId} reviewed: ${status.toUpperCase()}.`,
      data: reviewData,
    });

  } catch (error: any) {
    console.error("POST /api/v1/pharmacist/prescriptions/[id]/review error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
