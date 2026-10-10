

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Heart, Info, Loader2, ShoppingCart } from "lucide-react";
import CartState from "@/components/CartState";
import Footer from "@/components/Footer";
import MedicineCard from "@/components/MedicineCard";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { Medicine } from "@/lib/medicines";
import { useAuth } from "@/context/AuthContext";

type MedicineDetails = Medicine & { requiresPrescription: boolean };

export default function MedicineDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { addToCart } = useCart();
    const { showToast } = useToast();
    const { user, loginWithGoogle } = useAuth();
    const [medicine, setMedicine] = useState<MedicineDetails | null>(null);
    const [related, setRelated] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    const toggleWishlist = async () => {
        if (!medicine) return;
        if (!user) {
            await loginWithGoogle();
            return;
        }
        setSaving(true);
        try {
            const response = await fetch(`/api/v1/wishlist${saved ? `?medicineId=${encodeURIComponent(medicine.id)}` : ""}`, {
                method: saved ? "DELETE" : "POST",
                headers: { "Content-Type": "application/json", "X-User-UID": user.id, "X-User-Email": user.email || "" },
                body: saved ? undefined : JSON.stringify({ medicineId: medicine.id }),
            });
            if (!response.ok) throw new Error("Unable to update wishlist.");
            setSaved(!saved);
            showToast(saved ? "Removed from wishlist" : "Saved to wishlist", "success");
        } catch (requestError) {
            showToast(requestError instanceof Error ? requestError.message : "Unable to update wishlist.", "error");
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        let active = true;
        void params.then(async ({ id }) => {
            try {
                const response = await fetch(`/api/v1/medicines/${encodeURIComponent(id)}`);
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || "Medicine not found.");
                const item = result.data as MedicineDetails;
                const relatedResponse = await fetch(`/api/v1/medicines?category=${encodeURIComponent(item.category)}&pageSize=12`);
                const relatedResult = await relatedResponse.json();
                if (active) {
                    setMedicine(item);
                    setRelated((relatedResult.data || []).filter((candidate: Medicine) => candidate.id !== item.id).slice(0, 4));
                }
                if (user) {
                    const wishlistResponse = await fetch("/api/v1/wishlist", {
                        headers: { "X-User-UID": user.id, "X-User-Email": user.email || "" },
                    });
                    if (wishlistResponse.ok && active) {
                        const wishlistResult = await wishlistResponse.json();
                        setSaved((wishlistResult.data || []).some((row: { medicine_id: string }) => row.medicine_id === item.id));
                    }
                }
            } catch (requestError) {
                if (active) setError(requestError instanceof Error ? requestError.message : "Unable to load medicine.");
            } finally {
                if (active) setLoading(false);
            }
        });
        return () => { active = false; };
    }, [params, user]);

    const addMedicineToCart = () => {
        if (!medicine) return;
        addToCart(medicine);
        showToast(`Added ${medicine.name} to cart`, "success");
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
    if (error || !medicine) return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><p className="text-red-600">{error || "Medicine not found."}</p><Link href="/catalog" className="text-primary font-bold">Back to catalog</Link></div>;

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <CartState />
            <main className="flex-grow max-w-6xl mx-auto w-full px-6 py-10">
                <Link href="/catalog" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary"><ArrowLeft size={16} /> Back to catalog</Link>
                <section className="mt-6 grid gap-8 rounded-3xl bg-white p-6 shadow-sm md:grid-cols-2 md:p-10">
                    <div className="flex min-h-72 items-center justify-center rounded-2xl bg-slate-50 p-8">
                        <img src={medicine.image} alt={medicine.name} className="max-h-72 w-full object-contain" />
                    </div>
                    <div className="space-y-5">
                        <p className="text-sm font-bold uppercase tracking-wider text-primary">{medicine.category}</p>
                        <h1 className="text-3xl font-bold">{medicine.name}</h1>
                        <p className="text-slate-600">{medicine.description}</p>
                        <p className="text-3xl font-bold">₹{medicine.price.toFixed(2)}</p>
                        <div className="flex flex-wrap gap-2 text-sm">
                            <span className={`rounded-full px-3 py-1 font-semibold ${medicine.inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{medicine.inStock ? "In stock" : "Currently unavailable"}</span>
                            {medicine.requiresPrescription && <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-700">Prescription required</span>}
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button onClick={addMedicineToCart} disabled={!medicine.inStock} className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><ShoppingCart size={18} /> Add to cart</button>
                            <button onClick={() => void toggleWishlist()} disabled={saving} className={`inline-flex items-center gap-2 rounded-xl border px-5 py-3 font-bold ${saved ? "border-primary bg-primary/10 text-primary" : "border-slate-200 text-slate-700"}`}><Heart size={18} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Wishlist"}</button>
                        </div>
                        {medicine.requiresPrescription && <p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800"><Info size={18} className="shrink-0" /> A valid prescription may be required before checkout. Follow your pharmacist&apos;s instructions.</p>}
                    </div>
                </section>
                <section className="mt-8 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-white p-6"><h2 className="mb-3 text-lg font-bold">Dosage and usage</h2><p className="flex gap-2 text-sm text-slate-600"><CheckCircle size={18} className="shrink-0 text-primary" /> Use only as directed on your prescription or by a qualified pharmacist. Do not self-medicate.</p></div>
                    <div className="rounded-2xl bg-white p-6"><h2 className="mb-3 text-lg font-bold">Stock availability</h2><p className="text-sm text-slate-600">{medicine.inStock ? "Available for ordering while stock lasts." : "This medicine is currently out of stock. You can request it from the prescription results screen."}</p></div>
                </section>
                {related.length > 0 && <section className="mt-10"><h2 className="mb-5 text-2xl font-bold">Related medicines</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{related.map((item) => <MedicineCard key={item.id} medicine={item} />)}</div></section>}
            </main>
            <Footer />
        </div>
    );
}
