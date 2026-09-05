"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MedicineCard from "./MedicineCard";
import { medicines as staticMedicines, Medicine } from "@/lib/medicines";
import { Filter, ChevronDown, Search, X } from "lucide-react";

const categories = ["All", "Prescriptions", "Healthcare", "Wellness", "Personal Care", "Psychiatric", "Cardiac", "Diabetic"];

interface CatalogGridProps {
    limit?: number;
    searchQuery?: string;
}

const CatalogGrid = ({ limit, searchQuery }: CatalogGridProps) => {
    const [activeCategory, setActiveCategory] = useState("All");
    const [localSearch, setLocalSearch] = useState(searchQuery || "");
    const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFallback, setIsFallback] = useState(false);

    useEffect(() => {
        const fetchMedicines = async () => {
            setLoading(true);
            try {
                // Dynamic import to keep component bundle lightweight and avoid server-side dependency issues
                const { searchMedicines } = await import("@/lib/db/medicines.service");
                const dbItems = await searchMedicines({
                    category: activeCategory,
                    search: localSearch
                });

                if (dbItems && dbItems.length > 0) {
                    // Map MedicineDoc properties to local Medicine interface if necessary
                    const mappedItems: Medicine[] = dbItems.map(item => ({
                        id: item.id,
                        name: item.name,
                        category: item.category as any,
                        price: item.price,
                        description: item.description,
                        image: item.image,
                        inStock: item.inStock,
                        rating: item.rating,
                        reviews: item.reviews
                    }));

                    let finalItems = mappedItems;
                    if (limit) {
                        finalItems = finalItems.slice(0, limit);
                    }
                    setFilteredMedicines(finalItems);
                    setIsFallback(false);
                } else {
                    // If DB is empty, run local filtering
                    runLocalFallback();
                }
            } catch (err) {
                console.warn("Firestore fetch failed, falling back to static medicines list:", err);
                runLocalFallback();
            } finally {
                setLoading(false);
            }
        };

        const runLocalFallback = () => {
            setIsFallback(true);
            let local = activeCategory === "All"
                ? staticMedicines
                : staticMedicines.filter(m => 
                    m.category === activeCategory || 
                    m.category.replace(/\s+/g, '') === activeCategory.replace(/\s+/g, '')
                  );

            const searchTerm = localSearch.toLowerCase().trim();
            if (searchTerm) {
                local = local.filter(m =>
                    m.name.toLowerCase().includes(searchTerm) ||
                    m.description.toLowerCase().includes(searchTerm) ||
                    m.category.toLowerCase().includes(searchTerm)
                );
            }

            if (limit) {
                local = local.slice(0, limit);
            }
            setFilteredMedicines(local);
        };

        fetchMedicines();
    }, [activeCategory, localSearch, limit]);


    return (
        <section id="catalog" className="py-12 sm:py-16 px-4 sm:px-6 max-w-7xl mx-auto">
            {/* Search and filters header */}
            <div className="flex flex-col gap-4 sm:gap-6 mb-8 sm:mb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="text-center md:text-left">
                        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Our Medicine Catalog</h2>
                        <p className="text-sm sm:text-base text-muted-foreground">Browse through thousands of authentic medicines and products.</p>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            placeholder="Search medicines..."
                            className="w-full pl-11 pr-10 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm sm:text-base"
                        />
                        {localSearch && (
                            <button
                                onClick={() => setLocalSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Category Filters - Horizontal scroll on mobile */}
                <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${activeCategory === category
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "bg-white border border-slate-200 text-muted-foreground hover:border-primary/30"
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Search result count */}
                {localSearch && (
                    <p className="text-sm text-slate-500 text-center md:text-left">
                        Found <span className="font-semibold text-primary">{filteredMedicines.length}</span> results for "{localSearch}"
                    </p>
                )}
            </div>

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    {[...Array(limit || 6)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-100 premium-shadow p-4 sm:p-6 space-y-4 animate-pulse">
                            <div className="h-36 xs:h-40 sm:h-48 w-full bg-slate-100 rounded-xl sm:rounded-2xl" />
                            <div className="flex justify-between items-center">
                                <div className="h-4 w-16 bg-slate-100 rounded" />
                                <div className="h-4 w-12 bg-slate-100 rounded" />
                            </div>
                            <div className="h-6 w-3/4 bg-slate-100 rounded" />
                            <div className="space-y-2">
                                <div className="h-4 w-full bg-slate-100 rounded" />
                                <div className="h-4 w-5/6 bg-slate-100 rounded" />
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                <div className="h-8 w-24 bg-slate-100 rounded" />
                                <div className="h-10 w-10 bg-slate-100 rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredMedicines.length === 0 ? (
                <div className="text-center py-12 sm:py-20">
                    <p className="text-lg sm:text-xl text-muted-foreground">
                        {localSearch ? `No medicines found for "${localSearch}"` : "No medicines found in this category."}
                    </p>
                    <button
                        onClick={() => { setActiveCategory("All"); setLocalSearch(""); }}
                        className="mt-4 text-primary font-bold hover:underline"
                    >
                        View All Medicines
                    </button>
                </div>
            ) : (
                <motion.div
                    layout
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredMedicines.map((medicine, index) => (
                            <motion.div
                                key={medicine.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                <MedicineCard medicine={medicine} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Load More/Stats */}
            <div className="mt-10 sm:mt-16 text-center">
                {limit && !loading && (
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                        Showing {filteredMedicines.length} top products {isFallback && "(Demo Mode)"}
                    </p>
                )}
                {!limit && !loading && (
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                        Showing {filteredMedicines.length} of {isFallback ? staticMedicines.length : filteredMedicines.length} items {isFallback && "(Demo Mode)"}
                    </p>
                )}

                {limit ? (
                    <a href="/catalog" className="px-6 sm:px-8 py-3 sm:py-4 bg-white border border-slate-200 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base hover:bg-slate-50 transition-colors premium-shadow inline-flex items-center gap-2">
                        View All Products
                        <ChevronDown size={18} className="-rotate-90 sm:hidden" />
                        <ChevronDown size={20} className="-rotate-90 hidden sm:block" />
                    </a>
                ) : (
                    <div className="text-slate-400 text-xs sm:text-sm">End of Catalog</div>
                )}
            </div>
        </section>
    );
};

export default CatalogGrid;
