"use client";

import React from "react";
import Image from "next/image";
import { Plus, Star, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { Medicine } from "@/lib/medicines";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";

interface MedicineCardProps {
    medicine: Medicine;
}

const MedicineCard: React.FC<MedicineCardProps> = ({ medicine }) => {
    const { addToCart } = useCart();
    const { showToast } = useToast();

    const handleAddToCart = () => {
        addToCart(medicine);
        showToast(`Added ${medicine.name} to cart`, "success");
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="group relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-100 premium-shadow transition-all"
        >
            {/* Image Container - Responsive height */}
            <Link href={`/medicines/${medicine.id}`} className="relative block h-36 xs:h-40 sm:h-48 w-full overflow-hidden bg-slate-50" aria-label={`View ${medicine.name}`}>
                <img
                    src={medicine.image}
                    alt={medicine.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                    <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${medicine.inStock ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        }`}>
                        {medicine.inStock ? "In Stock" : "Out of Stock"}
                    </span>
                </div>
            </Link>

            {/* Content - Responsive padding */}
            <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-semibold text-primary uppercase tracking-wider">
                        {medicine.category}
                    </span>
                    <div className="flex items-center gap-0.5 sm:gap-1">
                        <Star size={12} className="text-yellow-400 fill-yellow-400 sm:hidden" />
                        <Star size={14} className="text-yellow-400 fill-yellow-400 hidden sm:block" />
                        <span className="text-[10px] sm:text-xs font-bold">{medicine.rating}</span>
                    </div>
                </div>

                <Link href={`/medicines/${medicine.id}`} className="block font-bold text-sm sm:text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {medicine.name}
                </Link>

                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 min-h-[32px] sm:min-h-[40px]">
                    {medicine.description}
                </p>

                <div className="pt-3 sm:pt-4 flex items-center justify-between border-t border-slate-50">
                    <div>
                        <span className="text-lg sm:text-2xl font-bold text-foreground">₹{medicine.price.toFixed(2)}</span>
                    </div>
                    <motion.button
                        layout
                        whileTap={{ scale: 0.9 }}
                        disabled={!medicine.inStock}
                        onClick={handleAddToCart}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors shadow-sm ${medicine.inStock
                            ? "bg-slate-900 text-white hover:bg-primary shadow-slate-200"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            }`}
                    >
                        <Plus size={18} className="sm:hidden" />
                        <Plus size={20} className="hidden sm:block" />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};

export default MedicineCard;
