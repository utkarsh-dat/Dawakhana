"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PrescriptionUpload from "@/components/PrescriptionUpload";
import PrescriptionResults from "@/components/PrescriptionResults";

export default function UploadPrescriptionPage() {
    const [recognizedMedicines, setRecognizedMedicines] = useState<string[] | null>(null);

    const handleReset = () => {
        setRecognizedMedicines(null);
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header Banner */}
            <div className="bg-primary text-white py-12 px-4 text-center relative">
                <Link href="/" className="absolute top-4 left-4 sm:top-8 sm:left-8 text-white/80 hover:text-white flex items-center gap-2 transition-colors">
                    <ArrowLeft size={20} /> Back to Home
                </Link>
                <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">Upload Your Prescription</h1>
                <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto">
                    Upload an image or type your prescription. Our AI will identify the medicines and check availability instantly.
                </p>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
                <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-10 min-h-[500px]">
                    {!recognizedMedicines ? (
                        <PrescriptionUpload onResults={setRecognizedMedicines} />
                    ) : (
                        <PrescriptionResults
                            recognizedNames={recognizedMedicines}
                            onReset={handleReset}
                        />
                    )}
                </div>
            </div>

            {/* Trust Badges */}
            <div className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="p-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    </div>
                    <h3 className="font-bold text-lg mb-2">Secure & Private</h3>
                    <p className="text-muted-foreground">Your prescription data is processed securely and never shared.</p>
                </div>
                <div className="p-4">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
                    </div>
                    <h3 className="font-bold text-lg mb-2">Instant Recognition</h3>
                    <p className="text-muted-foreground">Advanced AI instantly reads your prescription text or image.</p>
                </div>
                <div className="p-4">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                    </div>
                    <h3 className="font-bold text-lg mb-2">Easy Ordering</h3>
                    <p className="text-muted-foreground">Add available medicines to your cart with a single click.</p>
                </div>
            </div>
        </div>
    );
}
