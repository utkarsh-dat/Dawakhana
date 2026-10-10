import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PAYMENT_WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET;

const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
}) : null;

/**
 * POST /api/v1/webhooks/payment — Idempotent Payment Webhook Endpoint
 */
export async function POST(request: NextRequest) {
  try {
    if (!PAYMENT_WEBHOOK_SECRET || !supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Payment webhook is not configured." }, { status: 503 });
    }
    const signature = request.headers.get("x-razorpay-signature") || request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { success: false, error: "Missing cryptographic webhook signature header." },
        { status: 401 }
      );
    }

    const rawBody = await request.text();
    const expectedSignature = crypto
      .createHmac("sha256", PAYMENT_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );

    if (!isValid && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { success: false, error: "Invalid HMAC webhook signature." },
        { status: 401 }
      );
    }

    const body = JSON.parse(rawBody);
    const eventType = body.event || body.type;
    const eventId = body.event_id || body.id || `${body.payload?.payment?.entity?.id}_${eventType}`;

    if (eventType === "payment.captured" || eventType === "payment_intent.succeeded") {
      const paymentEntity = body.payload?.payment?.entity || body.data?.object;
      const orderId = paymentEntity?.notes?.order_id || body.order_id || paymentEntity?.metadata?.order_id;
      const paymentId = paymentEntity?.id || eventId;

      if (!orderId) {
        return NextResponse.json(
          { success: false, error: "Missing order_id in payload metadata." },
          { status: 400 }
        );
      }

      // Execute Idempotent Database Transaction
      const { data, error } = await supabaseAdmin.rpc("process_payment_captured_idempotent", {
        p_event_id: eventId,
        p_order_id: orderId,
        p_payment_id: paymentId,
        p_gateway: "razorpay",
        p_payload: body,
      });

      if (error) {
        console.error("Payment webhook database error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: data.idempotent
          ? "Event already processed (Idempotent)."
          : "Payment captured successfully. Order updated to processing.",
        data,
      });
    }

    return NextResponse.json({ success: true, message: `Event '${eventType}' acknowledged.` });

  } catch (error: any) {
    console.error("Payment webhook error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
