"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, onSnapshot, doc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Pill, Trash2, Calendar, TrendingUp } from "lucide-react";

const ADMIN_EMAILS = ["vickynishad110@gmail.com", "dawakhana011@gmail.com"];

interface MissingMedicine {
    id: string;
    name: string;
    count: number;
    lastRequested: Timestamp;
}

export default function RequestedMedicinesPage() {
    const { user, loading: authLoading } = useAuth();
    const [medicines, setMedicines] = useState<MissingMedicine[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !ADMIN_EMAILS.includes(user.email || "")) return;

        const unsubscribe = onSnapshot(collection(db, "missingMedicineRequests"), (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as MissingMedicine[];

            // Sort by count (highest first)
            data.sort((a, b) => (b.count || 0) - (a.count || 0));
            setMedicines(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleDelete = async (id: string) => {
        if (!confirm("Remove this medicine from requests?")) return;
        try {
            await deleteDoc(doc(db, "missingMedicineRequests", id));
        } catch (error) {
            console.error("Failed to delete:", error);
            alert("Failed to delete");
        }
    };

    // Auth loading
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    // Not admin
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                    <p className="text-slate-500">You need admin access to view this page.</p>
                    <a href="/" className="text-primary mt-4 inline-block hover:underline">← Back to Home</a>
                </div>
            </div>
        );
    }

    const totalRequests = medicines.reduce((sum, m) => sum + (m.count || 0), 0);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
                    <a href="/admin" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <ArrowLeft size={24} />
                    </a>
                    <div>
                        <h1 className="text-xl font-bold">Requested Medicines</h1>
                        <p className="text-sm text-slate-500">Medicines users searched for but aren&apos;t in stock</p>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-6 border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Pill className="text-orange-600" size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">{medicines.length}</h3>
                                <p className="text-sm text-slate-500">Unique Medicines</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <TrendingUp className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">{totalRequests}</h3>
                                <p className="text-sm text-slate-500">Total Requests</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Calendar className="text-green-600" size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">
                                    {medicines[0]?.lastRequested?.toDate?.().toLocaleDateString("en-IN", { day: "numeric", month: "short" }) || "—"}
                                </h3>
                                <p className="text-sm text-slate-500">Last Request</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Medicine List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                    </div>
                ) : medicines.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
                        <Pill size={48} className="mx-auto mb-4 text-slate-300" />
                        <h3 className="text-lg font-semibold text-slate-600">No medicine requests yet</h3>
                        <p className="text-slate-400">When users search for medicines not in stock, they&apos;ll appear here.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Medicine Name</th>
                                    <th className="text-center px-6 py-4 text-sm font-semibold text-slate-600">Requests</th>
                                    <th className="text-center px-6 py-4 text-sm font-semibold text-slate-600">Last Requested</th>
                                    <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {medicines.map((medicine, index) => (
                                    <tr key={medicine.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${index < 3 ? "bg-orange-50/50" : ""}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${index < 3 ? "bg-orange-100" : "bg-slate-100"}`}>
                                                    <Pill className={index < 3 ? "text-orange-600" : "text-slate-400"} size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{medicine.name}</p>
                                                    {index < 3 && <span className="text-xs text-orange-600 font-medium">🔥 High Demand</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${index < 3 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"}`}>
                                                {medicine.count}x
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm text-slate-500">
                                            {medicine.lastRequested?.toDate?.().toLocaleDateString("en-IN", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric"
                                            }) || "—"}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(medicine.id)}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remove from list"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Info */}
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-sm text-blue-700">
                        <strong>💡 Tip:</strong> These are medicines that users searched for but couldn&apos;t find in your catalog.
                        Consider adding popular items to your inventory!
                    </p>
                </div>
            </main>
        </div>
    );
}
