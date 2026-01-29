import { NextResponse } from "next/server";
import Razorpay from "razorpay";

// Initialize Razorpay
// Note: These must be in your .env.local file
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
    try {
        const { amount, currency = "INR" } = await request.json();

        if (!amount) {
            return NextResponse.json(
                { error: "Amount is required" },
                { status: 400 }
            );
        }

        // Create an order in Razorpay
        const options = {
            amount: Math.round(amount * 100), // convert to paise (lowest denomination)
            currency,
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json(order);
    } catch (error: any) {
        console.error("Error creating Razorpay order:", error);
        return NextResponse.json(
            { error: "Could not create order", details: error.message },
            { status: 500 }
        );
    }
}
