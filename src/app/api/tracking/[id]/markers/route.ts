import { NextRequest } from "next/server";
import { handleAddMarker } from "@/lib/tracking/controller";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();
    return handleAddMarker(id, body);
}
