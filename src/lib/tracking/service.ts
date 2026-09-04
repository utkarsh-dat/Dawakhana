import { db } from "../firebase";
import { doc, getDoc, setDoc, arrayUnion } from "firebase/firestore";

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

    if (!db) return null;
    try {
        console.log(`[Cache Miss] Fetching tracking info from Firestore for order: ${orderId}`);
        const docRef = doc(db, "tracking", orderId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data() as TrackingInfo;
            cache.set(orderId, { data, timestamp: Date.now() });
            return data;
        }
    } catch (e) {
        console.error("Firestore get error:", e);
    }
    return null;
}

export async function updateRiderLocation(orderId: string, lat: number, lng: number): Promise<void> {
    if (!db) return;
    try {
        const docRef = doc(db, "tracking", orderId);
        const updateData = {
            orderId,
            riderLocation: { lat, lng },
            updatedAt: Date.now()
        };
        await setDoc(docRef, updateData, { merge: true });

        // Update cache immediately (write-through)
        const cached = cache.get(orderId);
        if (cached && cached.data) {
            const updatedInfo: TrackingInfo = {
                ...cached.data,
                riderLocation: { lat, lng },
                updatedAt: updateData.updatedAt
            };
            cache.set(orderId, { data: updatedInfo, timestamp: Date.now() });
        } else {
            cache.delete(orderId);
        }
    } catch (e) {
        console.error("Firestore set error:", e);
    }
}

export async function addRouteMarker(orderId: string, lat: number, lng: number): Promise<void> {
    if (!db) return;
    try {
        const docRef = doc(db, "tracking", orderId);
        await setDoc(docRef, {
            orderId,
            markers: arrayUnion({ lat, lng }),
            updatedAt: Date.now()
        }, { merge: true });

        // Invalidate cache to force fetch the updated array next time
        cache.delete(orderId);
    } catch (e) {
        console.error("Firestore union error:", e);
    }
}
