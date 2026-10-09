import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { processShippingWebhookUpdate } from "../services/shipping";

const router = Router();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PAYMENT_WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET;
const COURIER_WEBHOOK_SECRET = process.env.COURIER_WEBHOOK_SECRET;

const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
}) : null;

/**
 * Helper function to verify HMAC SHA256 signature
 */
function verifyHmacSignature(rawBody: string | Buffer, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch (err) {
    return false;
  }
}

/**
 * POST /api/webhooks/payment
 * 
 * Idempotent Payment Webhook Endpoint
 * Verifies HMAC cryptographic signature from Razorpay / Stripe.
 * Atomically updates payment_status to 'paid' and status to 'processing'.
 */
router.post(
  "/payment",
  expressRawBodyParser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!PAYMENT_WEBHOOK_SECRET || !supabaseAdmin) {
        return res.status(503).json({ success: false, error: "Payment webhook is not configured." });
      }
      const signature = (req.headers["x-razorpay-signature"] || req.headers["stripe-signature"]) as string;

      if (!signature) {
        return res.status(401).json({ success: false, error: "Missing cryptographic webhook signature header." });
      }

      // Verify HMAC Signature against raw body payload
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      const isValid = verifyHmacSignature(rawBody, signature, PAYMENT_WEBHOOK_SECRET);

      if (!isValid && process.env.NODE_ENV === "production") {
        return res.status(401).json({ success: false, error: "Invalid HMAC webhook signature." });
      }

      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const eventType = body.event || body.type; // e.g. 'payment.captured' or 'payment_intent.succeeded'
      const eventId = body.event_id || body.id || `${body.payload?.payment?.entity?.id}_${eventType}`;

      console.log(`[PAYMENT WEBHOOK] Received event '${eventType}' with ID '${eventId}'`);

      // We focus on payment.captured / payment_intent.succeeded
      if (eventType === "payment.captured" || eventType === "payment_intent.succeeded") {
        const paymentEntity = body.payload?.payment?.entity || body.data?.object;
        const orderId = paymentEntity?.notes?.order_id || body.order_id || paymentEntity?.metadata?.order_id;
        const paymentId = paymentEntity?.id || eventId;

        if (!orderId) {
          return res.status(400).json({ success: false, error: "Missing order_id in webhook payload metadata." });
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
          return res.status(500).json({ success: false, error: error.message });
        }

        return res.status(200).json({
          success: true,
          message: data.idempotent
            ? "Event already processed (Idempotent)."
            : "Payment captured successfully. Order updated to processing.",
          data,
        });
      }

      // For non-payment capture events, acknowledge receiving
      return res.status(200).json({ success: true, message: `Event '${eventType}' acknowledged.` });

    } catch (error: any) {
      console.error("Payment webhook handling error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * POST /api/webhooks/shipping
 * 
 * Courier Logistics Webhook Endpoint
 * Consumes shipping status updates ('in_transit', 'delivered', etc.) and syncs back to DB.
 */
router.post("/shipping", async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!COURIER_WEBHOOK_SECRET) {
      return res.status(503).json({ success: false, error: "Courier webhook is not configured." });
    }
    const authHeader = req.headers["x-courier-secret"];

    if (authHeader !== COURIER_WEBHOOK_SECRET && process.env.NODE_ENV === "production") {
      return res.status(401).json({ success: false, error: "Unauthorized courier webhook request." });
    }

    const { awbNumber, currentStatus, location, remarks } = req.body;

    if (!awbNumber || !currentStatus) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields 'awbNumber' or 'currentStatus'.",
      });
    }

    const result = await processShippingWebhookUpdate({
      awbNumber,
      currentStatus,
      location,
      remarks,
    });

    return res.status(200).json({
      success: true,
      message: `Shipping status updated to '${result.newStatus}'.`,
      data: result,
    });

  } catch (error: any) {
    console.error("Shipping webhook error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Custom Raw Body Parser Middleware for Express HMAC Verification
 */
function expressRawBodyParser(req: Request, res: Response, next: NextFunction) {
  let data = "";
  req.setEncoding("utf8");
  req.on("data", (chunk: any) => {
    data += chunk;
  });
  req.on("end", () => {
    (req as any).rawBody = data;
    try {
      req.body = JSON.parse(data);
    } catch {
      req.body = data;
    }
    next();
  });
}

export default router;
