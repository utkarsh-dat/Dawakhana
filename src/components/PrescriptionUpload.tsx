"use client";

import React, { useState, useRef } from "react";
import { Upload, FileText, Camera, Loader2 } from "lucide-react";
import { recognizePrescription } from "@/app/actions/recognizePrescription";

interface PrescriptionUploadProps {
    onResults: (medicines: string[]) => void;
}

export default function PrescriptionUpload({ onResults }: PrescriptionUploadProps) {
    const [activeTab, setActiveTab] = useState<"image" | "text">("image");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Image state
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Text state
    const [textInput, setTextInput] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setError(null);
        }
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setError(null);

        const formData = new FormData();
        if (activeTab === "image") {
            if (!fileInputRef.current?.files?.[0]) {
                setError("Please select an image first.");
                setIsAnalyzing(false);
                return;
            }
            formData.append("file", fileInputRef.current.files[0]);
        } else {
            if (!textInput.trim()) {
                setError("Please enter prescription text.");
                setIsAnalyzing(false);
                return;
            }
            formData.append("text", textInput);
        }

        try {
            const result = await recognizePrescription(formData);
            if ("error" in result) {
                setError(result.error);
            } else {
                onResults(result.medicines);
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6 sm:space-y-8">
            {/* Tabs */}
            <div className="flex p-1 bg-muted rounded-xl">
                <button
                    onClick={() => setActiveTab("image")}
                    className={`flex-1 py-2.5 sm:py-3 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === "image" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <Camera size={18} /> Upload Image
                </button>
                <button
                    onClick={() => setActiveTab("text")}
                    className={`flex-1 py-2.5 sm:py-3 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === "text" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <FileText size={18} /> Type Prescription
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-10 text-center">
                {activeTab === "image" ? (
                    <div className="space-y-6">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />

                        {previewUrl ? (
                            <div className="relative w-full max-w-sm mx-auto aspect-[3/4] bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                                <img src={previewUrl} alt="Prescription Preview" className="w-full h-full object-contain" />
                                <button
                                    onClick={() => {
                                        setPreviewUrl(null);
                                        if (fileInputRef.current) fileInputRef.current.value = "";
                                    }}
                                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full max-w-sm mx-auto aspect-[4/3] border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors group"
                            >
                                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-transform">
                                    <Upload size={32} className="text-slate-400 group-hover:text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-semibold text-foreground">Click to upload prescription</p>
                                    <p className="text-sm text-muted-foreground">JPG, PNG up to 5MB</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <textarea
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="E.g. I need 2 strips of Paracetamol and Antibiotics..."
                            className="w-full h-32 sm:h-40 p-4 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none resize-none text-base sm:text-lg"
                        />
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                        {error}
                    </div>
                )}

                {/* Main Action Button */}
                <div className="mt-8">
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="animate-spin" /> Analyzing...
                            </>
                        ) : (
                            "Analyze Prescription"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
