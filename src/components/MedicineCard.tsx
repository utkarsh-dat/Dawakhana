"use client";

import React from "react";
import Image from "next/image";
import { Plus, Star, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { Medicine } from "@/lib/medicines";
import { useCart } from "@/context/CartContext";

interface MedicineCardProps {
    medicine: Medicine;
}

const MedicineCard: React.FC<MedicineCardProps> = ({ medicine }) => {
    const { addToCart } = useCart();

    return (
        <motion.div
            whileHover={{ y: -10 }}
            className="group relative bg-white rounded-3xl overflow-hidden border border-slate-100 premium-shadow transition-all"
        >
            {/* Image Container */}
            <div className="relative h-48 w-full overflow-hidden bg-slate-50">
                <img
                    src={medicine.image}
                    alt={medicine.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${medicine.inStock ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        }`}>
                        {medicine.inStock ? "In Stock" : "Out of Stock"}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                        {medicine.category}
                    </span>
                    <div className="flex items-center gap-1">
                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-bold">{medicine.rating}</span>
                    </div>
                </div>

                <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {medicine.name}
                </h3>

                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                    {medicine.description}
                </p>

                <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                    <div>
                        <span className="text-2xl font-bold text-foreground">${medicine.price.toFixed(2)}</span>
                    </div>
                    <button
                        disabled={!medicine.inStock}
                        onClick={() => addToCart(medicine)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${medicine.inStock
                            ? "bg-slate-900 text-white hover:bg-primary premium-shadow"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            }`}
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default MedicineCard;
