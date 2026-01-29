"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MedicineCard from "./MedicineCard";
import { medicines, Medicine } from "@/lib/medicines";
import { Filter, ChevronDown, Search } from "lucide-react";

const categories = ["All", "Psychiatric", "Cardiac", "Diabetic"];

interface CatalogGridProps {
    limit?: number;
    searchQuery?: string;
}

const CatalogGrid = ({ limit, searchQuery }: CatalogGridProps) => {
    const [activeCategory, setActiveCategory] = useState("All");
    const [localSearch, setLocalSearch] = useState(searchQuery || "");

    // Filter by category
    let filteredMedicines = activeCategory === "All"
        ? medicines
        : medicines.filter(m => m.category === activeCategory);

    // Filter by search query (either from prop or local state)
    const searchTerm = localSearch.toLowerCase().trim();
    if (searchTerm) {
        filteredMedicines = filteredMedicines.filter(m =>
            m.name.toLowerCase().includes(searchTerm) ||
            m.description.toLowerCase().includes(searchTerm) ||
            m.category.toLowerCase().includes(searchTerm)
        );
    }

    // Apply limit if provided (for Homepage view)
    const isLimited = limit && filteredMedicines.length > limit;
    if (limit) {
        filteredMedicines = filteredMedicines.slice(0, limit);
    }

    return (
        <section id="catalog" className="py-16 px-6 max-w-7xl mx-auto">
            {/* Search and filters header */}
            <div className="flex flex-col gap-6 mb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-foreground mb-2">Our Medicine Catalog</h2>
                        <p className="text-muted-foreground">Browse through thousands of authentic medicines and products.</p>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            placeholder="Search medicines..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                        />
                        {localSearch && (
                            <button
                                onClick={() => setLocalSearch("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                {/* Category Filters */}
                <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${activeCategory === category
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
                    <p className="text-sm text-slate-500">
                        Found <span className="font-semibold text-primary">{filteredMedicines.length}</span> results for "{localSearch}"
                    </p>
                )}
            </div>

            {filteredMedicines.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-xl text-muted-foreground">
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
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
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
            <div className="mt-16 text-center">
                {limit && (
                    <p className="text-sm text-muted-foreground mb-6">Showing {filteredMedicines.length} top products</p>
                )}
                {!limit && (
                    <p className="text-sm text-muted-foreground mb-6">Showing {filteredMedicines.length} of {medicines.length} items</p>
                )}

                {limit ? (
                    <a href="/catalog" className="px-8 py-4 bg-white border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-colors premium-shadow inline-flex items-center gap-2">
                        View All Products
                        <ChevronDown size={20} className="-rotate-90" />
                    </a>
                ) : (
                    // On full catalog, maybe hide or show something else
                    <div className="text-slate-400 text-sm">End of Catalog</div>
                )}
            </div>
        </section>
    );
};

export default CatalogGrid;
