import { NextResponse } from "next/server";
import * as service from "./service";

export async function handleGetTracking(orderId: string) {
    try {
        const info = await service.getTrackingInfo(orderId);
        if (!info) {
            return NextResponse.json({
                orderId,
                riderLocation: null,
                markers: [],
                updatedAt: null,
            });
        }
        return NextResponse.json(info);
    } catch (error: any) {
        console.error("Controller Error (GET):", error);
        return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
    }
}

export async function handleUpdateLocation(orderId: string, body: any) {
    try {
        const { lat, lng } = body;
        if (typeof lat !== "number" || typeof lng !== "number") {
            return NextResponse.json({ error: "Invalid lat/lng parameters" }, { status: 400 });
        }
        await service.updateRiderLocation(orderId, lat, lng);
        return NextResponse.json({ success: true, lat, lng });
    } catch (error: any) {
        console.error("Controller Error (POST):", error);
        return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
    }
}

export async function handleAddMarker(orderId: string, body: any) {
    try {
        const { lat, lng } = body;
        if (typeof lat !== "number" || typeof lng !== "number") {
            return NextResponse.json({ error: "Invalid lat/lng parameters" }, { status: 400 });
        }
        await service.addRouteMarker(orderId, lat, lng);
        return NextResponse.json({ success: true, lat, lng });
    } catch (error: any) {
        console.error("Controller Error (POST markers):", error);
        return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
    }
}
