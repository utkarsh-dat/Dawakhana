import { NextRequest, NextResponse } from "next/server";
import { processShippingWebhookUpdate } from "@/server/services/shipping";

const COURIER_WEBHOOK_SECRET = process.env.COURIER_WEBHOOK_SECRET || "courier_whsec_secret_67890";

/**
 * POST /api/v1/webhooks/shipping — Courier Logistics Tracking Webhook
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("x-courier-secret");

    if (authHeader !== COURIER_WEBHOOK_SECRET && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { success: false, error: "Unauthorized courier webhook request." },
        { status: 401 }
      );
    }

    const body = await request.json();
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
