"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, MapPin, Trash2 } from "lucide-react";
import CartState from "@/components/CartState";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { DeliveryAddress } from "@/lib/types";

type SavedAddress = DeliveryAddress & { id: string; is_default: boolean; city?: string; state?: string };

export default function AddressesPage() {
    const { user, loading: authLoading, loginWithGoogle } = useAuth();
    const [addresses, setAddresses] = useState<SavedAddress[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const response = await fetch("/api/v1/addresses", { headers: { "X-User-UID": user.id, "X-User-Email": user.email || "" } });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Unable to load addresses.");
            setAddresses((result.data || []).map((item: any) => ({
                id: item.id, firstName: item.first_name, lastName: item.last_name, address: item.street,
                phoneNumber: item.phone, postalCode: item.postal_code, city: item.city, state: item.state, is_default: item.is_default,
            })));
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Unable to load addresses.");
        } finally { setLoading(false); }
    };

    useEffect(() => { if (!authLoading && user) void load(); else if (!authLoading) setLoading(false); }, [authLoading, user]);

    const remove = async (id: string) => {
        if (!user || !confirm("Delete this saved address?")) return;
        const response = await fetch(`/api/v1/addresses?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: { "X-User-UID": user.id } });
        if (response.ok) setAddresses((current) => current.filter((item) => item.id !== id));
    };

    return <div className="min-h-screen flex flex-col bg-slate-50"><CartState /><main className="flex-grow max-w-4xl mx-auto w-full px-6 py-10">
        <div className="mb-8 flex items-center gap-3"><MapPin className="text-primary" /><div><h1 className="text-3xl font-bold">Saved addresses</h1><p className="text-slate-500">Manage addresses for faster checkout.</p></div></div>
        {!user && !authLoading ? <div className="rounded-2xl bg-white p-10 text-center"><p className="mb-4">Sign in to manage saved addresses.</p><button onClick={() => void loginWithGoogle()} className="rounded-xl bg-primary px-5 py-3 font-bold text-white">Sign in</button></div>
            : loading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" /></div>
                : error ? <p className="text-red-600">{error}</p>
                    : addresses.length === 0 ? <div className="rounded-2xl bg-white p-10 text-center text-slate-600">No saved addresses yet. You can save one during checkout.</div>
                        : <div className="space-y-4">{addresses.map((item) => <div key={item.id} className="flex items-start justify-between rounded-2xl bg-white p-5 shadow-sm"><div><p className="font-bold">{item.firstName} {item.lastName} {item.is_default && <span className="ml-2 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">Default</span>}</p><p className="mt-2 text-sm text-slate-600">{item.address}</p><p className="text-sm text-slate-500">{item.city}, {item.state} - {item.postalCode}</p><p className="text-sm text-slate-500">{item.phoneNumber}</p></div><button onClick={() => void remove(item.id)} className="p-2 text-red-500" aria-label="Delete address"><Trash2 size={18} /></button></div>)}</div>}
        <Link href="/checkout" className="mt-6 inline-block font-bold text-primary">Continue to checkout</Link>
    </main><Footer /></div>;
}
