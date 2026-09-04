import { NextRequest, NextResponse } from "next/server";
import { placeOrderWithFEFO } from "@/server/services/orderEngine";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || "fallback_super_secret_jwt_key_32bytes!";

/**
 * POST /api/v1/orders/checkout — FEFO Inventory Deduction & Order Placement
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate JWT
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

    const userId = decoded.sub || decoded.id;

    // 2. Parse Request Body
    const body = await request.json();
    const { shippingAddressId, prescriptionId, items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Request body must contain an 'items' array." },
        { status: 400 }
      );
    }

    // 3. Execute Order Placement with FEFO & Transaction Safety
    const result = await placeOrderWithFEFO({
      userId,
      shippingAddressId,
      prescriptionId,
      items,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Order placed successfully with FEFO inventory deduction.",
        data: result,
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("POST /api/v1/orders/checkout error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process order checkout." },
      { status: 400 }
    );
  }
}
