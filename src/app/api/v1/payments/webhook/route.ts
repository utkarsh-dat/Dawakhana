/**
 * POST /api/v1/payments/webhook — Process payment gateway updates (Signed)
 * 
 * Handles:
 * - Razorpay webhook signature verification
 * - UPI payment status updates
 * - Order payment status transitions
 * 
 * CRITICAL SAFEGUARD: Always verify incoming payment gateway signatures
 * before updating paymentStatus to prevent order fraud.
 */

import { NextRequest, NextResponse } from "next/server";
import { updatePaymentStatus, PAYMENT_STATUS } from "@/lib/db/orders.service";
import crypto from "crypto";

// ─── Webhook Signature Verification ──────────────────────────────────────────

/**
 * Verify Razorpay webhook signature
 * 
 * The signature is computed using HMAC SHA-256 with the webhook secret
 * and compared against the X-Razorpay-Signature header.
 */
function verifyRazorpaySignature(
    body: string,
    signature: string,
    secret: string
): boolean {
    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(signature, "hex")
    );
}

// ─── Webhook Handler ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get("X-Razorpay-Signature") || "";
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET;

        // CRITICAL: Verify signature before processing
        if (webhookSecret && signature) {
            const isValid = verifyRazorpaySignature(rawBody, signature, webhookSecret);
            if (!isValid) {
                console.error("⚠️ PAYMENT WEBHOOK: Invalid signature detected!");
                return NextResponse.json(
                    { error: "Invalid webhook signature" },
                    { status: 401 }
                );
            }
        } else if (process.env.NODE_ENV === "production") {
            // In production, always require signature verification
            console.error("⚠️ PAYMENT WEBHOOK: No webhook secret configured in production!");
            return NextResponse.json(
                { error: "Webhook secret not configured" },
                { status: 500 }
            );
        }

        // Parse the webhook payload
        const payload = JSON.parse(rawBody);
        const { event, payload: eventPayload } = payload;

        // Handle different payment events
        switch (event) {
            case "payment.authorized":
            case "payment.captured": {
                const payment = eventPayload?.payment?.entity;
                const orderId = payment?.notes?.orderId || payment?.order_id;
                const transactionId = payment?.id;

                if (!orderId) {
                    console.warn("Payment webhook missing orderId in notes");
                    return NextResponse.json({ status: "ignored", reason: "no orderId" });
                }

                await updatePaymentStatus(orderId, PAYMENT_STATUS.COMPLETED, transactionId);
                console.log(`✅ Payment confirmed for order: ${orderId}`);
                break;
            }

            case "payment.failed": {
                const payment = eventPayload?.payment?.entity;
                const orderId = payment?.notes?.orderId || payment?.order_id;

                if (orderId) {
                    await updatePaymentStatus(orderId, PAYMENT_STATUS.FAILED);
                    console.log(`❌ Payment failed for order: ${orderId}`);
                }
                break;
            }

            case "refund.created":
            case "refund.processed": {
                const refund = eventPayload?.refund?.entity;
                const orderId = refund?.notes?.orderId;
                console.log(`💰 Refund processed for order: ${orderId}`, refund);
                // Refund handling can be expanded here
                break;
            }

            default:
                console.log(`Unhandled payment webhook event: ${event}`);
        }

        // Always return 200 to acknowledge receipt
        return NextResponse.json({ status: "ok" });

    } catch (error: any) {
        console.error("API /v1/payments/webhook POST error:", error);
        // Return 200 even on error to prevent webhook retries for parsing errors
        return NextResponse.json(
            { status: "error", message: error.message },
            { status: 200 }
        );
    }
}
