"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Info, AlertTriangle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "success") => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.9 }}
                            layout
                            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md min-w-[300px] ${toast.type === "success" ? "bg-white/90 border-green-200 text-green-800" :
                                    toast.type === "error" ? "bg-white/90 border-red-200 text-red-800" :
                                        toast.type === "warning" ? "bg-white/90 border-yellow-200 text-yellow-800" :
                                            "bg-white/90 border-slate-200 text-slate-800"
                                }`}
                        >
                            {toast.type === "success" && <CheckCircle size={18} className="text-green-500" />}
                            {toast.type === "error" && <X size={18} className="text-red-500" />}
                            {toast.type === "info" && <Info size={18} className="text-blue-500" />}
                            {toast.type === "warning" && <AlertTriangle size={18} className="text-yellow-500" />}

                            <p className="text-sm font-medium flex-1">{toast.message}</p>

                            <button
                                onClick={() => removeToast(toast.id)}
                                className="p-1 hover:bg-black/5 rounded-full transition-colors opacity-50 hover:opacity-100"
                            >
                                <X size={14} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};
