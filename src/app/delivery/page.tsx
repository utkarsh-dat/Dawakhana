"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Loader2, LogIn, MapPin, Package, Phone, RefreshCw, Truck, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface DeliveryOrder {
    id: string;
    status: string;
    total: number;
    customerEmail: string;
    deliveryAddress: {
        firstName?: string;
        lastName?: string;
        fullAddress?: string;
        phone?: string;
        pincode?: string;
    };
}

const statusLabels: Record<string, string> = {
    PACKED: "Ready for pickup",
    OUT_FOR_DELIVERY: "Out for delivery",
    DELIVERED: "Delivered",
    FAILED_DELIVERY: "Failed delivery",
    RTO: "Return to origin",
};

export default function DeliveryPage() {
    const { user, isAdmin, isDeliveryPartner, loading: authLoading, loginWithGoogle } = useAuth();
    const [orders, setOrders] = useState<DeliveryOrder[]>([]);
    const [selectedId, setSelectedId] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updating, setUpdating] = useState("");
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [failureReason, setFailureReason] = useState("");
    const [proofFile, setProofFile] = useState<Record<string, File | null>>({});
    const [proofUploaded, setProofUploaded] = useState<Record<string, boolean>>({});

    const canDeliver = isDeliveryPartner || isAdmin;

    const loadOrders = useCallback(async () => {
        if (!user || !canDeliver) return;
        setLoading(true);
        setError("");
        try {
            const response = await fetch("/api/v1/delivery/orders", {
                headers: {
                    "X-User-UID": user.id,
                    "X-User-Email": user.email || "",
                },
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || "Unable to load assigned orders.");
            setOrders(result.data || []);
        } catch (loadError) {
            console.error("Failed to load delivery orders:", loadError);
            setError(loadError instanceof Error ? loadError.message : "Unable to load assigned orders.");
        } finally {
            setLoading(false);
        }
    }, [canDeliver, user]);

    useEffect(() => { void loadOrders(); }, [loadOrders]);

    const updateStatus = async (orderId: string, status: "OUT_FOR_DELIVERY" | "DELIVERED" | "FAILED_DELIVERY" | "RTO") => {
        setUpdating(orderId);
        setError("");
        try {
            const response = await fetch(`/api/v1/delivery/orders/${orderId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "X-User-UID": user?.id || "", "X-User-Email": user?.email || "" },
                body: JSON.stringify({ status, ...(location || {}) }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || "Unable to update delivery status.");
            await loadOrders();
        } catch (statusError) {
            console.error("Failed to update delivery status:", statusError);
            setError(statusError instanceof Error ? statusError.message : "Unable to update delivery status.");
        } finally {
            setUpdating("");
        }
    };

    const shareLocation = () => {
        if (!navigator.geolocation) {
            setError("Location is not supported by this device.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => setLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
            () => setError("Location permission was not granted.")
        );
    };

    const uploadProof = async (orderId: string) => {
        const file = proofFile[orderId];
        if (!file) {
            setError("Please select a delivery proof file first.");
            return;
        }
        setUpdating(orderId);
        try {
            const formData = new FormData();
            formData.append("proof", file);
            const response = await fetch(`/api/v1/delivery/orders/${orderId}/proof`, {
                method: "POST",
                headers: { "X-User-UID": user?.id || "", "X-User-Email": user?.email || "" },
                body: formData,
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || "Unable to upload delivery proof.");
            setProofUploaded((current) => ({ ...current, [orderId]: true }));
        } catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : "Unable to upload delivery proof.");
        } finally {
            setUpdating("");
        }
    };

    if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
    if (!user) return <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4"><div className="bg-white p-8 rounded-3xl shadow-lg text-center max-w-md w-full"><LogIn className="mx-auto text-primary mb-4" size={40} /><h1 className="text-2xl font-bold">Delivery Partner Login</h1><p className="text-slate-500 my-4">Sign in with an authorized delivery or admin account.</p><button onClick={() => void loginWithGoogle()} className="w-full bg-primary text-white py-3 rounded-xl font-bold">Sign in with Google</button></div></main>;
    if (!canDeliver) return <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4"><div className="bg-white p-8 rounded-3xl shadow-lg text-center max-w-md w-full"><XCircle className="mx-auto text-red-500 mb-4" size={40} /><h1 className="text-2xl font-bold">Access denied</h1><p className="text-slate-500 mt-2">Only delivery partners and admins can access this dashboard.</p><Link href="/" className="inline-flex items-center gap-2 text-primary font-bold mt-6"><ArrowLeft size={16} /> Home</Link></div></main>;

    return (
        <main className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200"><div className="max-w-6xl mx-auto p-6 flex items-center justify-between"><div><Link href="/" className="text-sm text-slate-500 inline-flex items-center gap-2"><ArrowLeft size={15} /> Home</Link><h1 className="text-2xl font-bold mt-2">Delivery Dashboard</h1></div><button onClick={() => void loadOrders()} className="inline-flex gap-2 items-center border rounded-xl px-4 py-2 font-semibold"><RefreshCw size={16} /> Refresh</button></div></header>
            <div className="max-w-6xl mx-auto p-6">
                {error && <div className="mb-5 bg-red-50 text-red-700 rounded-xl p-3">{error}</div>}
                <div className="flex flex-wrap gap-3 mb-6"><button onClick={shareLocation} className="inline-flex items-center gap-2 bg-white border px-4 py-2 rounded-xl font-semibold"><MapPin size={16} /> {location ? "Location ready" : "Share live location"}</button>{location && <span className="text-sm text-slate-500 self-center">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>}</div>
                {loading ? <div className="text-center p-12"><Loader2 className="animate-spin mx-auto text-primary" /></div> : orders.length === 0 ? <div className="bg-white rounded-2xl p-12 text-center text-slate-500">No assigned orders.</div> : <div className="grid gap-5">{orders.map((order) => { const address = order.deliveryAddress || {}; const busy = updating === order.id; return <article key={order.id} className="bg-white rounded-2xl border border-slate-200 p-5"><div className="flex flex-wrap justify-between gap-4"><div><p className="font-bold text-lg">Order {order.id}</p><span className="text-xs rounded-full bg-blue-100 text-blue-700 px-3 py-1">{statusLabels[order.status] || order.status}</span></div><p className="font-bold">₹{order.total?.toFixed(2)}</p></div><div className="mt-4 grid md:grid-cols-2 gap-3 text-sm text-slate-600"><p className="flex gap-2"><Package size={17} /> {address.firstName} {address.lastName}</p><p className="flex gap-2"><Phone size={17} /> {address.phone || "No phone"}</p><p className="flex gap-2 md:col-span-2"><Truck size={17} /> {address.fullAddress || "Address unavailable"} {address.pincode || ""}</p></div><div className="mt-5 flex flex-wrap gap-2">{order.status === "PACKED" && <button disabled={busy} onClick={() => void updateStatus(order.id, "OUT_FOR_DELIVERY")} className="bg-primary text-white px-4 py-2 rounded-xl font-bold disabled:opacity-50">Pickup / Start delivery</button>}{order.status === "OUT_FOR_DELIVERY" && <button disabled={busy || !proofUploaded[order.id]} onClick={() => void updateStatus(order.id, "DELIVERED")} className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold disabled:opacity-50"><CheckCircle size={16} className="inline mr-1" /> Delivered</button>}{order.status === "OUT_FOR_DELIVERY" && <button disabled={busy || !failureReason.trim()} onClick={() => void updateStatus(order.id, "FAILED_DELIVERY")} className="bg-orange-500 text-white px-4 py-2 rounded-xl font-bold disabled:opacity-50">Failed delivery</button>}{order.status === "FAILED_DELIVERY" && <button disabled={busy} onClick={() => void updateStatus(order.id, "RTO")} className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold disabled:opacity-50">Mark RTO</button>}{busy && <Loader2 className="animate-spin self-center" />}</div>{order.status === "OUT_FOR_DELIVERY" && <><input value={failureReason} onChange={(event) => setFailureReason(event.target.value)} placeholder="Failure reason (required for failed delivery)" className="mt-3 w-full border rounded-xl px-3 py-2 text-sm" /><div className="mt-3 flex flex-wrap gap-2 items-center"><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setProofFile((current) => ({ ...current, [order.id]: event.target.files?.[0] || null }))} /><button disabled={busy || !proofFile[order.id]} onClick={() => void uploadProof(order.id)} className="bg-slate-800 text-white px-3 py-2 rounded-xl text-sm font-bold disabled:opacity-50">{proofUploaded[order.id] ? "Proof uploaded" : "Upload proof"}</button></div></>}</article>; })}</div>}
            </div>
        </main>
    );
}
