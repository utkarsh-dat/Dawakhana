import supabase from "../supabaseClient";

export interface TrackingInfo {
    orderId: string;
    riderLocation: { lat: number; lng: number } | null;
    markers: { lat: number; lng: number }[];
    updatedAt: number;
}

// Simple TTL-based cache to reduce database load
interface CacheEntry {
    data: TrackingInfo | null;
    timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5000; // 5 seconds TTL

export async function getTrackingInfo(orderId: string): Promise<TrackingInfo | null> {
    const cached = cache.get(orderId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[Cache Hit] Serving tracking info for order: ${orderId}`);
        return cached.data;
    }

    try {
        const { data, error } = await supabase.from("tracking").select("*").eq("order_id", orderId).maybeSingle();
        if (error) throw error;
        if (data) {
            const info = { orderId, riderLocation: data.rider_location, markers: data.markers || [], updatedAt: data.updated_at } as TrackingInfo;
            cache.set(orderId, { data: info, timestamp: Date.now() });
            return info;
        }
    } catch (e) {
        console.error("Tracking read error:", e);
    }
    return null;
}

export async function updateRiderLocation(orderId: string, lat: number, lng: number): Promise<void> {
    try {
        const updateData = { order_id: orderId, rider_location: { lat, lng }, updated_at: Date.now() };
        const { error } = await supabase.from("tracking").upsert(updateData, { onConflict: "order_id" });
        if (error) throw error;

        // Update cache immediately (write-through)
        const cached = cache.get(orderId);
        if (cached && cached.data) {
            const updatedInfo: TrackingInfo = {
                ...cached.data,
                riderLocation: { lat, lng },
                updatedAt: updateData.updated_at
            };
            cache.set(orderId, { data: updatedInfo, timestamp: Date.now() });
        } else {
            cache.delete(orderId);
        }
    } catch (e) {
        console.error("Tracking location update error:", e);
    }
}

export async function addRouteMarker(orderId: string, lat: number, lng: number): Promise<void> {
    try {
        const current = await getTrackingInfo(orderId);
        const markers = [...(current?.markers || []), { lat, lng }];
        const { error } = await supabase.from("tracking").upsert({ order_id: orderId, markers, updated_at: Date.now() }, { onConflict: "order_id" });
        if (error) throw error;

        // Invalidate cache to force fetch the updated array next time
        cache.delete(orderId);
    } catch (e) {
        console.error("Tracking marker update error:", e);
    }
}
