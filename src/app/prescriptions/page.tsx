"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, FileText, Loader2, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface PrescriptionStatus {
    id: string;
    status: "pending" | "approved" | "rejected";
    notes: string | null;
    expiresAt: string | null;
    createdAt: string;
    updatedAt: string;
}

const statusConfig = {
    pending: { label: "Pending review", className: "bg-amber-100 text-amber-800", icon: Clock3 },
    approved: { label: "Approved", className: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
    rejected: { label: "Rejected", className: "bg-red-100 text-red-800", icon: XCircle },
};

export default function PrescriptionsPage() {
    const { user, loading: authLoading } = useAuth();
    const [prescriptions, setPrescriptions] = useState<PrescriptionStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setLoading(false);
            return;
        }

        let cancelled = false;
        const loadPrescriptions = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch("/api/v1/prescriptions", {
                    headers: {
                        "X-User-UID": user.id,
                        "X-User-Email": user.email || "",
                    },
                });
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.error || "Unable to load prescriptions.");
                }
                if (!cancelled) setPrescriptions(result.data);
            } catch (loadError) {
                if (!cancelled) {
                    console.error("Failed to load prescription status:", loadError);
                    setError(loadError instanceof Error ? loadError.message : "Unable to load prescriptions.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void loadPrescriptions();
        return () => {
            cancelled = true;
        };
    }, [authLoading, user]);

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
            <div className="mx-auto max-w-4xl">
                <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary">
                    <ArrowLeft size={18} /> Back to home
                </Link>
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">My prescriptions</h1>
                    <p className="mt-2 text-slate-500">Track pharmacist review status without exposing your private documents.</p>
                </div>

                {!user && !authLoading ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                        <FileText className="mx-auto mb-4 text-primary" size={40} />
                        <h2 className="text-xl font-bold text-slate-900">Sign in to view your prescriptions</h2>
                        <Link href="/login" className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 font-semibold text-white">
                            Sign in
                        </Link>
                    </div>
                ) : loading ? (
                    <div className="flex justify-center rounded-2xl bg-white p-12 shadow-sm">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
                ) : prescriptions.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                        <FileText className="mx-auto mb-4 text-slate-300" size={40} />
                        <h2 className="text-xl font-bold text-slate-900">No prescriptions submitted</h2>
                        <p className="mt-2 text-slate-500">Upload a prescription to start a pharmacist review.</p>
                        <Link href="/upload-prescription" className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 font-semibold text-white">
                            Upload prescription
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {prescriptions.map((prescription) => {
                            const config = statusConfig[prescription.status];
                            const StatusIcon = config.icon;
                            return (
                                <article key={prescription.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex gap-3">
                                            <div className="rounded-xl bg-slate-100 p-3 text-primary"><FileText size={22} /></div>
                                            <div>
                                                <h2 className="font-bold text-slate-900">Prescription #{prescription.id.slice(0, 8)}</h2>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    Submitted {new Date(prescription.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-1 text-sm font-semibold ${config.className}`}>
                                            <StatusIcon size={16} /> {config.label}
                                        </span>
                                    </div>
                                    {prescription.notes && (
                                        <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                                            <span className="font-semibold text-slate-800">Pharmacist note: </span>{prescription.notes}
                                        </div>
                                    )}
                                    {prescription.expiresAt && (
                                        <p className="mt-4 text-sm text-slate-500">
                                            Valid until {new Date(prescription.expiresAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
