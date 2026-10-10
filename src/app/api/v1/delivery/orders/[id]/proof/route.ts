import { NextRequest, NextResponse } from "next/server";
import { attachDeliveryProof } from "@/lib/db/orders.service";
import { requireDeliveryPartner } from "@/lib/middleware/auth";
import { uploadPrivateDeliveryProof } from "@/server/services/storage";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { auth, response } = await requireDeliveryPartner(request);
    if (response) return response;

    try {
        const { id: orderId } = await params;
        const formData = await request.formData();
        const file = formData.get("proof") as File | null;

        if (!file) {
            return NextResponse.json({ success: false, error: "Delivery proof file is required." }, { status: 400 });
        }

        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ success: false, error: "Only JPEG, PNG, WEBP, or PDF proof files are allowed." }, { status: 400 });
        }
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ success: false, error: "Delivery proof must be 10MB or smaller." }, { status: 400 });
        }

        const upload = await uploadPrivateDeliveryProof(
            Buffer.from(await file.arrayBuffer()),
            file.name,
            file.type,
            auth.uid!,
            orderId
        );
        await attachDeliveryProof(orderId, auth.uid!, upload.storagePath);

        return NextResponse.json({ success: true, data: upload }, { status: 201 });
    } catch (error) {
        console.error("POST delivery proof error:", error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to upload delivery proof." }, { status: 500 });
    }
}
