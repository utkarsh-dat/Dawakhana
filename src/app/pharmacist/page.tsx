"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle, ExternalLink, FileText, Loader2, LogIn, RefreshCw, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Prescription {
    id: string;
    user_id: string;
    signedUrl: string;
    status: string;
    notes?: string;
    created_at: string;
    customer: {
        full_name: string;
        phone: string | null;
    };
}

interface QueueResponse {
    data: Prescription[];
    pagination: {
        total: number;
        page: number;
        totalPages: number;
    };
}

export default function PharmacistPage() {
    const { user, role, isAdmin, isPharmacist, loading: authLoading, loginWithGoogle } = useAuth();
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [selected, setSelected] = useState<Prescription | null>(null);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const canReview = isPharmacist || isAdmin;

    const loadQueue = useCallback(async () => {
        if (!user || !canReview) return;

        setLoading(true);
        setError("");
        try {
            const response = await fetch(`/api/v1/pharmacist/prescriptions/queue?page=${page}&limit=10&status=pending`, {
                headers: { "X-User-UID": user.id, "X-User-Email": user.email || "" },
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || "Unable to load prescription queue.");
            }

            const queue = result as QueueResponse;
            setPrescriptions(queue.data);
            setTotalPages(queue.pagination.totalPages || 1);
            if (selected && !queue.data.some((item) => item.id === selected.id)) {
                setSelected(null);
            }
        } catch (loadError) {
            console.error("Failed to load pharmacist queue:", loadError);
            setError(loadError instanceof Error ? loadError.message : "Unable to load prescription queue.");
        } finally {
            setLoading(false);
        }
    }, [canReview, page, selected, user]);

    useEffect(() => {
        void loadQueue();
    }, [loadQueue]);

    const selectPrescription = (prescription: Prescription) => {
        setSelected(prescription);
        setNotes(prescription.notes || "");
        setError("");
    };

    const reviewPrescription = async (status: "approved" | "rejected") => {
        if (!selected || !notes.trim()) {
            setError("Please add pharmacist notes before submitting the review.");
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            const response = await fetch(`/api/v1/pharmacist/prescriptions/${selected.id}/review`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-User-UID": user?.id || "",
                    "X-User-Email": user?.email || "",
                },
                body: JSON.stringify({
                    status,
                    pharmacist_notes: notes.trim(),
                }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || "Unable to submit prescription review.");
            }

            setSelected(null);
            setNotes("");
            await loadQueue();
        } catch (reviewError) {
            console.error("Failed to review prescription:", reviewError);
            setError(reviewError instanceof Error ? reviewError.message : "Unable to submit prescription review.");
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
    }

    if (!user) {
        return (
            <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md w-full text-center">
                    <LogIn className="mx-auto text-primary mb-4" size={40} />
                    <h1 className="text-2xl font-bold">Pharmacist Review</h1>
                    <p className="text-slate-500 mt-2 mb-6">Sign in with an authorized pharmacist or admin account.</p>
                    <button onClick={() => void loginWithGoogle()} className="w-full rounded-xl bg-primary text-white py-3 font-bold">Sign in with Google</button>
                </div>
            </main>
        );
    }

    if (!canReview) {
        return (
            <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md w-full text-center">
                    <AlertCircle className="mx-auto text-red-500 mb-4" size={40} />
                    <h1 className="text-2xl font-bold">Access denied</h1>
                    <p className="text-slate-500 mt-2">This dashboard is restricted to pharmacists and admins.</p>
                    <p className="text-xs text-slate-400 mt-3">Current role: {role}</p>
                    <Link href="/" className="inline-flex items-center gap-2 mt-6 text-primary font-bold"><ArrowLeft size={16} /> Back to home</Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div>
                        <Link href="/" className="text-sm text-slate-500 inline-flex items-center gap-2"><ArrowLeft size={15} /> Home</Link>
                        <h1 className="text-2xl font-bold mt-2">Prescription Review Queue</h1>
                    </div>
                    <button onClick={() => void loadQueue()} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50">
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
                <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex justify-between">
                        <div><h2 className="font-bold">Pending prescriptions</h2><p className="text-sm text-slate-500">{prescriptions.length} shown</p></div>
                        <FileText className="text-primary" />
                    </div>
                    {error && <p className="m-4 rounded-lg bg-red-50 text-red-700 p-3 text-sm">{error}</p>}
                    {loading ? (
                        <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>
                    ) : prescriptions.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">No pending prescriptions.</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {prescriptions.map((prescription) => (
                                <button key={prescription.id} onClick={() => selectPrescription(prescription)} className={`w-full text-left p-5 hover:bg-slate-50 ${selected?.id === prescription.id ? "bg-blue-50 border-l-4 border-primary" : ""}`}>
                                    <div className="flex justify-between gap-3">
                                        <div><p className="font-bold">{prescription.customer.full_name}</p><p className="text-xs text-slate-500 mt-1">{prescription.customer.phone || "No phone"} · {new Date(prescription.created_at).toLocaleString()}</p></div>
                                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 h-fit">{prescription.status}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                    {totalPages > 1 && <div className="p-4 flex justify-between text-sm"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="disabled:opacity-40">Previous</button><span>Page {page} of {totalPages}</span><button disabled={page === totalPages} onClick={() => setPage((value) => value + 1)} className="disabled:opacity-40">Next</button></div>}
                </section>

                <section className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6">
                    {!selected ? (
                        <div className="h-full min-h-96 flex flex-col items-center justify-center text-center text-slate-500"><FileText size={48} className="mb-3 text-slate-300" /><p>Select a prescription to review.</p></div>
                    ) : (
                        <div className="space-y-5">
                            <div className="flex items-start justify-between"><div><h2 className="text-xl font-bold">{selected.customer.full_name}</h2><p className="text-sm text-slate-500">Prescription ID: {selected.id}</p></div><span className="text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">{selected.status}</span></div>
                            <div className="rounded-xl bg-slate-100 min-h-72 flex items-center justify-center overflow-hidden">
                                {selected.signedUrl ? <a href={selected.signedUrl} target="_blank" rel="noreferrer" className="relative group"><img src={selected.signedUrl} alt="Prescription document" className="max-h-[28rem] max-w-full object-contain" /><span className="absolute bottom-3 right-3 bg-slate-900/80 text-white rounded-lg px-3 py-2 text-sm inline-flex items-center gap-2"><ExternalLink size={14} /> Open document</span></a> : <p className="text-slate-500">Prescription document unavailable.</p>}
                            </div>
                            <div><label htmlFor="pharmacist-notes" className="block text-sm font-bold mb-2">Pharmacist notes</label><textarea id="pharmacist-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-primary" placeholder="Add approval or rejection notes..." /></div>
                            <div className="flex flex-wrap gap-3">
                                <button disabled={submitting} onClick={() => void reviewPrescription("approved")} className="inline-flex items-center gap-2 rounded-xl bg-green-600 text-white px-5 py-3 font-bold disabled:opacity-50"><CheckCircle size={18} /> Approve</button>
                                <button disabled={submitting} onClick={() => void reviewPrescription("rejected")} className="inline-flex items-center gap-2 rounded-xl bg-red-600 text-white px-5 py-3 font-bold disabled:opacity-50"><XCircle size={18} /> Reject</button>
                                {submitting && <Loader2 className="animate-spin self-center text-slate-500" />}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
