import { NextRequest, NextResponse } from "next/server";
import { getMedicineById } from "@/lib/db/medicines.service";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const medicine = await getMedicineById(id);
        if (!medicine) {
            return NextResponse.json({ success: false, error: "Medicine not found." }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: medicine });
    } catch (error) {
        console.error("GET /api/v1/medicines/[id] error:", error);
        return NextResponse.json({ success: false, error: "Unable to load medicine." }, { status: 500 });
    }
}
