"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MedicineCard from "./MedicineCard";
import { medicines, Medicine } from "@/lib/medicines";
import { Filter, ChevronDown } from "lucide-react";

const categories = ["All", "Psychiatric", "Cardiac", "Diabetic"];

const CatalogGrid = () => {
    const [activeCategory, setActiveCategory] = useState("All");

    console.log("CatalogGrid: Active Category:", activeCategory);
    console.log("CatalogGrid: Total Medicines:", medicines.length);

    const filteredMedicines = activeCategory === "All"
        ? medicines
        : medicines.filter(m => m.category === activeCategory);

    return (
        <section id="catalog" className="py-16 px-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">Our Medicine Catalog</h2>
                    <p className="text-muted-foreground">Browse through thousands of authentic medicines and products.</p>
                </div>

                {/* Filters */}
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
            </div>

            {/* Debugging Info (Hidden in production usually, but helpful now) */}
            {/* <div className="hidden">Medicines Loaded: {medicines.length}</div> */}

            {filteredMedicines.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-xl text-muted-foreground">No medicines found in this category.</p>
                    <button onClick={() => setActiveCategory("All")} className="mt-4 text-primary font-bold hover:underline">
                        View All
                    </button>
                    {/* Debug info visible if list is empty */}
                    <p className="text-xs text-slate-400 mt-4">Total Loaded: {medicines.length}</p>
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
                <p className="text-sm text-muted-foreground mb-6">Showing {filteredMedicines.length} of {medicines.length} items</p>
                <button className="px-8 py-4 bg-white border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-colors premium-shadow inline-flex items-center gap-2">
                    View All Products
                    <ChevronDown size={20} />
                </button>
            </div>
        </section>
    );
};

export default CatalogGrid;
