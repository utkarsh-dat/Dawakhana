"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Loader2 } from "lucide-react";
import CartState from "@/components/CartState";
import Footer from "@/components/Footer";
import MedicineCard from "@/components/MedicineCard";
import { useAuth } from "@/context/AuthContext";
import { Medicine } from "@/lib/medicines";

type WishlistRow = { medicine_id: string; medicines: Medicine | null };

export default function WishlistPage() {
    const { user, loading: authLoading, loginWithGoogle } = useAuth();
    const [items, setItems] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setLoading(false);
            return;
        }
        void fetch("/api/v1/wishlist", {
            headers: { "X-User-UID": user.id, "X-User-Email": user.email || "" },
        })
            .then(async (response) => {
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || "Unable to load wishlist.");
                setItems((result.data as WishlistRow[]).map((row) => row.medicines).filter((item): item is Medicine => Boolean(item)));
            })
            .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Unable to load wishlist."))
            .finally(() => setLoading(false));
    }, [authLoading, user]);

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <CartState />
            <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-10">
                <div className="mb-8 flex items-center gap-3">
                    <Heart className="text-primary" fill="currentColor" />
                    <div><h1 className="text-3xl font-bold">My Wishlist</h1><p className="text-slate-500">Save medicines to find them quickly later.</p></div>
                </div>
                {!user && !authLoading ? (
                    <div className="rounded-2xl bg-white p-10 text-center shadow-sm"><p className="mb-4 text-slate-600">Sign in to view and manage your wishlist.</p><button onClick={() => void loginWithGoogle()} className="rounded-xl bg-primary px-5 py-3 font-bold text-white">Sign in</button></div>
                ) : loading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" /></div>
                    : error ? <p className="text-red-600">{error}</p>
                        : items.length === 0 ? <div className="rounded-2xl bg-white p-10 text-center"><p className="mb-4 text-slate-600">Your wishlist is empty.</p><Link href="/catalog" className="font-bold text-primary">Browse medicines</Link></div>
                            : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{items.map((item) => <MedicineCard key={item.id} medicine={item} />)}</div>}
            </main>
            <Footer />
        </div>
    );
}
