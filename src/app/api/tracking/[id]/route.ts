import { NextRequest } from "next/server";
import { handleGetTracking, handleUpdateLocation } from "@/lib/tracking/controller";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    return handleGetTracking(id);
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();
    return handleUpdateLocation(id, body);
}
