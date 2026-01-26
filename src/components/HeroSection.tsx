"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, ShieldCheck, Zap, UserCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { medicines, Medicine } from "@/lib/medicines";

const HeroSection = () => {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<Medicine[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (query.length > 1) {
            const filtered = medicines.filter((m) =>
                m.name.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 5);
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [query]);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <section className="relative overflow-hidden pt-20 pb-16 px-6">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Content */}
                <div className="space-y-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase">
                            Trusted by 1M+ Customers
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-5xl lg:text-7xl font-bold tracking-tight text-foreground leading-tight"
                    >
                        Your Health, <br />
                        <span className="text-primary">Our Priority.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg text-muted-foreground leading-relaxed max-w-lg"
                    >
                        Get authentic medicines, wellness products, and healthcare essentials delivered to your door in minutes.
                    </motion.p>

                    {/* Search Bar with Suggestions */}
                    <div ref={searchRef} className="relative max-w-xl group">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="relative z-20"
                        >
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                <Search className="text-muted-foreground group-focus-within:text-primary transition-colors" size={24} />
                            </div>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onFocus={() => query.length > 1 && setShowSuggestions(true)}
                                placeholder="Search for medicines, wellness products..."
                                className="w-full h-16 pl-14 pr-14 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all premium-shadow text-lg"
                            />
                            {query && (
                                <button
                                    onClick={() => setQuery("")}
                                    className="absolute right-36 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            )}
                            <button className="absolute right-3 top-3 bottom-3 px-6 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-colors">
                                Search
                            </button>
                        </motion.div>

                        {/* Suggestions Dropdown */}
                        <AnimatePresence>
                            {showSuggestions && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl z-10 overflow-hidden"
                                >
                                    {suggestions.length > 0 ? (
                                        <div className="py-2">
                                            {suggestions.map((item) => (
                                                <button
                                                    key={item.id}
                                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-slate-50 rounded-lg overflow-hidden">
                                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-foreground">{item.name}</p>
                                                            <p className="text-[10px] text-primary font-bold uppercase tracking-wider">{item.category}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-400 group-hover:text-primary transition-colors">${item.price.toFixed(2)}</span>
                                                </button>
                                            ))}
                                            <div className="p-4 border-t border-slate-50 bg-slate-50/50">
                                                <p className="text-xs text-center text-muted-foreground italic">
                                                    Press Enter to see all results for "{query}"
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center">
                                            <p className="text-muted-foreground">No medicines found for "{query}"</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Trust Badges */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="flex flex-wrap items-center gap-8 pt-4"
                    >
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <ShieldCheck size={20} className="text-primary" />
                            </div>
                            <span className="text-sm font-medium">Verified Pharmacists</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <Zap size={20} className="text-primary" />
                            </div>
                            <span className="text-sm font-medium">Fast Delivery</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <UserCheck size={20} className="text-primary" />
                            </div>
                            <span className="text-sm font-medium">100% Secure Payment</span>
                        </div>
                    </motion.div>
                </div>

                {/* Feature Visual */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7 }}
                    className="relative hidden lg:block"
                >
                    <div className="relative z-10 rounded-[2.5rem] overflow-hidden border-8 border-white premium-shadow">
                        <div className="h-[500px] w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                            <div className="text-center space-y-4">
                                <div className="w-32 h-32 bg-white rounded-3xl mx-auto flex items-center justify-center shadow-lg">
                                    <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
                                        <span className="text-4xl text-primary animate-pulse">💊</span>
                                    </div>
                                </div>
                                <div className="glass p-6 rounded-2xl max-w-sm mx-auto">
                                    <h3 className="font-bold text-xl mb-2 text-glow">Authentic Medicines</h3>
                                    <p className="text-sm text-muted-foreground">Each medicine is verified by our team of professionals.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floating cards */}
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-10 -left-10 glass p-6 rounded-2xl premium-shadow"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <Zap size={20} className="text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Express</p>
                                <p className="font-bold">15-20 Min Delivery</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute -bottom-6 -right-6 glass p-6 rounded-2xl premium-shadow"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <ShieldCheck size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Certified</p>
                                <p className="font-bold">Trusted Experts</p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default HeroSection;
