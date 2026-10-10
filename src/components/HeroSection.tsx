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
        <section className="relative overflow-hidden pt-12 sm:pt-16 md:pt-20 pb-12 sm:pb-16 px-4 sm:px-6">
            {/* Decorative Background Elements - Smaller on mobile */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] lg:w-[1000px] h-[400px] sm:h-[500px] lg:h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />
            <div className="absolute -top-24 -right-24 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-accent/5 rounded-full blur-3xl -z-10" />

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
                {/* Content */}
                <div className="space-y-6 sm:space-y-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-bold tracking-wider uppercase">
                            Trusted by 1M+ Customers
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-foreground leading-tight"
                    >
                        Your Health, <br />
                        <span className="text-primary">Our Priority.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg"
                    >
                        Get authentic medicines, wellness products, and healthcare essentials delivered to your door.
                    </motion.p>

                    {/* Search Bar with Suggestions - Responsive */}
                    <div ref={searchRef} className="relative w-full max-w-xl group">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="relative z-20"
                        >
                            {/* Mobile: Stacked layout */}
                            <div className="sm:hidden space-y-3">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                        <Search className="text-muted-foreground" size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onFocus={() => query.length > 1 && setShowSuggestions(true)}
                                        placeholder="Search medicines..."
                                        className="w-full h-12 pl-12 pr-10 rounded-xl bg-white border border-slate-200 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all premium-shadow text-base"
                                    />
                                    {query && (
                                        <button
                                            onClick={() => setQuery("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                                <button className="w-full h-12 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-colors premium-shadow">
                                    Search
                                </button>
                            </div>

                            {/* Desktop: Inline layout */}
                            <div className="hidden sm:block">
                                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                    <Search className="text-muted-foreground group-focus-within:text-primary transition-colors" size={24} />
                                </div>
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onFocus={() => query.length > 1 && setShowSuggestions(true)}
                                    placeholder="Search for medicines, wellness products..."
                                    className="w-full h-14 lg:h-16 pl-14 pr-36 lg:pr-40 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all premium-shadow text-base lg:text-lg"
                                />
                                {query && (
                                    <button
                                        onClick={() => setQuery("")}
                                        className="absolute right-32 lg:right-36 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                                <button className="absolute right-2 lg:right-3 top-2 lg:top-3 bottom-2 lg:bottom-3 px-4 lg:px-6 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-colors">
                                    Search
                                </button>
                            </div>
                        </motion.div>

                        {/* Suggestions Dropdown */}
                        <AnimatePresence>
                            {showSuggestions && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-2xl z-10 overflow-hidden"
                                >
                                    {suggestions.length > 0 ? (
                                        <div className="py-2">
                                            {suggestions.map((item) => (
                                                <button
                                                    key={item.id}
                                                    className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left group"
                                                >
                                                    <div className="flex items-center gap-3 sm:gap-4">
                                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0">
                                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-sm text-foreground truncate">{item.name}</p>
                                                            <p className="text-[10px] text-primary font-bold uppercase tracking-wider">{item.category}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-400 group-hover:text-primary transition-colors flex-shrink-0 ml-2">₹{item.price.toFixed(2)}</span>
                                                </button>
                                            ))}
                                            <div className="p-3 sm:p-4 border-t border-slate-50 bg-slate-50/50">
                                                <p className="text-xs text-center text-muted-foreground italic">
                                                    Press Enter to see all results for "{query}"
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-6 sm:p-8 text-center">
                                            <p className="text-muted-foreground text-sm sm:text-base">No medicines found for "{query}"</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Trust Badges - Stack on very small screens */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="flex flex-col xs:flex-row flex-wrap items-start xs:items-center gap-4 sm:gap-6 lg:gap-8 pt-2 sm:pt-4"
                    >
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 sm:p-2 bg-slate-100 rounded-lg">
                                <ShieldCheck size={18} className="text-primary sm:hidden" />
                                <ShieldCheck size={20} className="text-primary hidden sm:block" />
                            </div>
                            <span className="text-xs sm:text-sm font-medium">Verified Pharmacists</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="p-1.5 sm:p-2 bg-slate-100 rounded-lg">
                                <UserCheck size={18} className="text-primary sm:hidden" />
                                <UserCheck size={20} className="text-primary hidden sm:block" />
                            </div>
                            <span className="text-xs sm:text-sm font-medium">100% Secure Payment</span>
                        </div>
                    </motion.div>
                </div>

                {/* Feature Visual - Hidden on mobile, simplified tablet version */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7 }}
                    className="relative hidden lg:block"
                >
                    <div className="relative z-10 rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden border-4 lg:border-8 border-white premium-shadow">
                        <div className="h-[400px] lg:h-[500px] w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                            <div className="text-center space-y-4">
                                <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white rounded-2xl lg:rounded-3xl mx-auto flex items-center justify-center shadow-lg">
                                    <div className="w-16 h-16 lg:w-20 lg:h-20 bg-primary/10 rounded-xl lg:rounded-2xl flex items-center justify-center">
                                        <span className="text-3xl lg:text-4xl text-primary animate-pulse">💊</span>
                                    </div>
                                </div>
                                <div className="glass p-4 lg:p-6 rounded-xl lg:rounded-2xl max-w-xs lg:max-w-sm mx-auto">
                                    <h3 className="font-bold text-lg lg:text-xl mb-2 text-glow">Authentic Medicines</h3>
                                    <p className="text-xs lg:text-sm text-muted-foreground">Each medicine is verified by our team of professionals.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute -bottom-4 lg:-bottom-6 -right-4 lg:-right-6 glass p-4 lg:p-6 rounded-xl lg:rounded-2xl premium-shadow"
                    >
                        <div className="flex items-center gap-2 lg:gap-3">
                            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <ShieldCheck size={16} className="text-blue-600 lg:hidden" />
                                <ShieldCheck size={20} className="text-blue-600 hidden lg:block" />
                            </div>
                            <div>
                                <p className="text-[10px] lg:text-xs text-muted-foreground uppercase font-bold tracking-wider">Certified</p>
                                <p className="font-bold text-sm lg:text-base">Trusted Experts</p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default HeroSection;
