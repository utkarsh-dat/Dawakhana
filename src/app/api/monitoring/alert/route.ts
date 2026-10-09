import { NextRequest, NextResponse } from "next/server";
import { sendMonitoringAlert } from "@/server/services/monitoringAlerts";

export async function POST(request: NextRequest) {
    const expectedSecret = process.env.MONITORING_WEBHOOK_SECRET;
    const providedSecret = request.headers.get("x-monitoring-secret");
    if (!expectedSecret || !providedSecret || providedSecret !== expectedSecret) {
        return NextResponse.json({ success: false, error: "Unauthorized monitoring webhook." }, { status: 401 });
    }

    try {
        const body = await request.json() as { status?: string; details?: string };
        if (body.status !== "down" && body.status !== "recovered") {
            return NextResponse.json({ success: false, error: "Status must be 'down' or 'recovered'." }, { status: 400 });
        }
        const details = typeof body.details === "string" && body.details.trim()
            ? body.details.trim().slice(0, 1_000)
            : "No additional details were provided.";
        await sendMonitoringAlert(body.status, details);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Monitoring alert delivery failed:", error);
        return NextResponse.json({ success: false, error: "Unable to deliver monitoring alert." }, { status: 503 });
    }
}
