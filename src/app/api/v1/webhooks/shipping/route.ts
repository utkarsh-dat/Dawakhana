import { NextRequest, NextResponse } from "next/server";
import { processShippingWebhookUpdate } from "@/server/services/shipping";
import crypto from "crypto";

const COURIER_WEBHOOK_SECRET = process.env.COURIER_WEBHOOK_SECRET;

/**
 * POST /api/v1/webhooks/shipping — Courier Logistics Tracking Webhook
 */
export async function POST(request: NextRequest) {
  try {
    if (!COURIER_WEBHOOK_SECRET) {
      return NextResponse.json({ success: false, error: "Courier webhook is not configured." }, { status: 503 });
    }
    const signature = request.headers.get("x-courier-signature");
    const rawBody = await request.text();
    const expectedSignature = crypto
      .createHmac("sha256", COURIER_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    const providedSignature = signature ? Buffer.from(signature, "utf8") : null;
    const expectedSignatureBuffer = Buffer.from(expectedSignature, "utf8");
    const signaturesMatch = Boolean(
      providedSignature &&
      providedSignature.length === expectedSignatureBuffer.length &&
      crypto.timingSafeEqual(providedSignature, expectedSignatureBuffer)
    );

    if (!signaturesMatch) {
      return NextResponse.json(
        { success: false, error: "Unauthorized courier webhook request." },
        { status: 401 }
      );
    }

    const body = JSON.parse(rawBody);
    const { awbNumber, currentStatus, location, remarks } = body;

    if (!awbNumber || !currentStatus) {
      return NextResponse.json(
        { success: false, error: "Missing required fields 'awbNumber' or 'currentStatus'." },
        { status: 400 }
      );
    }

    const result = await processShippingWebhookUpdate({
      awbNumber,
      currentStatus,
      location,
      remarks,
    });

    return NextResponse.json({
      success: true,
      message: `Shipping status updated to '${result.newStatus}'.`,
      data: result,
    });

  } catch (error: any) {
    console.error("Shipping webhook error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
