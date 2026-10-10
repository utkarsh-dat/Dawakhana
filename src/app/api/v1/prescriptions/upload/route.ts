import { NextRequest, NextResponse } from "next/server";
import { uploadPrivatePrescription } from "@/server/services/storage";
import { createPrescriptionRecord } from "@/server/services/prescription";
import jwt from "jsonwebtoken";
import { verifyAuth } from "@/lib/middleware/auth";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;

/**
 * POST /api/v1/prescriptions/upload — Secure Prescription Upload Endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const headerAuth = await verifyAuth(request);
    if (headerAuth.authenticated) {
      if (!["customer", "admin"].includes(headerAuth.role || "customer")) {
        return NextResponse.json({ success: false, error: "Only customers and admins can upload prescriptions." }, { status: 403 });
      }
    }

    if (!JWT_SECRET) {
      return NextResponse.json({ success: false, error: "Prescription authentication is not configured." }, { status: 503 });
    }
    // 1. Authenticate JWT & Enforce RBAC
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
    const role = decoded.role || decoded.user_metadata?.role || "customer";

    // Enforce role permission (customer or admin)
    if (!["customer", "admin"].includes(role)) {
      return NextResponse.json(
        { success: false, error: `Access denied. Role '${role}' cannot upload prescriptions.` },
        { status: 403 }
      );
    }

    // 2. Parse Multipart Form Data
    const formData = await request.formData();
    const file = formData.get("prescription") as File | null;
    const notes = formData.get("notes") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No prescription file provided. Use field name 'prescription'." },
        { status: 400 }
      );
    }

    // 3. Validate File Type & Size (10MB Limit)
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Invalid file type '${file.type}'. Allowed: JPEG, PNG, WEBP, PDF.` },
        { status: 400 }
      );
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 10MB limit." },
        { status: 400 }
      );
    }

    // 4. Upload to Private Bucket & Get Time-Limited Signed URL
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const expiresInSeconds = 3600;

    const { storagePath, signedUrl } = await uploadPrivatePrescription(
      buffer,
      file.name,
      file.type,
      userId,
      expiresInSeconds
    );

    // 5. Insert Record into PostgreSQL Prescriptions table (status = 'pending') & notify Queue
    const record = await createPrescriptionRecord({
      userId,
      imageUrl: storagePath,
      notes: notes || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Prescription uploaded successfully and marked for pharmacist review.",
        data: {
          prescriptionId: record.id,
          status: record.status,
          signedUrl,
          expiresInSeconds,
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("API /v1/prescriptions/upload error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
