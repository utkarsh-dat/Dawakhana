import { NextRequest, NextResponse } from "next/server";
import { getPharmacistReviewQueue } from "@/server/services/pharmacistReview";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || "fallback_super_secret_jwt_key_32bytes!";

/**
 * GET /api/v1/pharmacist/prescriptions/queue
 * 
 * Pharmacist Queue Retrieval Endpoint
 */
export async function GET(request: NextRequest) {
  try {
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

    const role = decoded.role || decoded.user_metadata?.role;
    if (!["pharmacist", "admin"].includes(role)) {
      return NextResponse.json(
        { success: false, error: `Access denied. Role 'pharmacist' required. Current role: '${role}'.` },
        { status: 403 }
      );
    }

    // 2. Extract Query Parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || "pending";

    // 3. Fetch Paginated Queue
    const queueData = await getPharmacistReviewQueue(page, limit, status);

    return NextResponse.json({
      success: true,
      message: "Pharmacist review queue retrieved successfully.",
      ...queueData,
    });

  } catch (error: any) {
    console.error("GET /api/v1/pharmacist/prescriptions/queue error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
