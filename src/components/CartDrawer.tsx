"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
    const { cart, removeFromCart, updateQuantity, subtotal, totalItems } = useCart();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    />

                    {/* Drawer - Full width on mobile, max-w-md on larger screens */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full sm:max-w-md bg-white z-[70] shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center text-primary">
                                    <ShoppingBag size={18} className="sm:hidden" />
                                    <ShoppingBag size={20} className="hidden sm:block" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-base sm:text-lg">Your Cart</h2>
                                    <p className="text-xs text-muted-foreground">{totalItems} Items</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={22} className="text-slate-400 sm:hidden" />
                                <X size={24} className="text-slate-400 hidden sm:block" />
                            </button>
                        </div>

                        {/* Items List */}
                        <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-4">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-full flex items-center justify-center">
                                        <ShoppingBag size={32} className="text-slate-200 sm:hidden" />
                                        <ShoppingBag size={40} className="text-slate-200 hidden sm:block" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base sm:text-lg">Your cart is empty</h3>
                                        <p className="text-xs sm:text-sm text-muted-foreground">Add some medicines to get started.</p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="px-5 sm:px-6 py-2.5 sm:py-3 bg-primary text-white rounded-xl font-bold text-sm sm:text-base hover:bg-primary-hover transition-colors"
                                    >
                                        Start Shopping
                                    </button>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.id} className="flex gap-3 sm:gap-4 group">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-xl sm:rounded-2xl overflow-hidden flex-shrink-0">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-grow space-y-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-sm text-foreground truncate">{item.name}</h4>
                                                    <p className="text-[10px] text-primary font-bold uppercase tracking-wider">{item.category}</p>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                                >
                                                    <Trash2 size={14} className="sm:hidden" />
                                                    <Trash2 size={16} className="hidden sm:block" />
                                                </button>
                                            </div>
                                            <div className="flex justify-between items-center pt-1 sm:pt-2">
                                                <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 px-2 py-1 rounded-lg">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="p-1 hover:text-primary hover:bg-white rounded transition-colors"
                                                    >
                                                        <Minus size={12} className="sm:hidden" />
                                                        <Minus size={14} className="hidden sm:block" />
                                                    </button>
                                                    <span className="text-xs sm:text-sm font-bold w-4 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="p-1 hover:text-primary hover:bg-white rounded transition-colors"
                                                    >
                                                        <Plus size={12} className="sm:hidden" />
                                                        <Plus size={14} className="hidden sm:block" />
                                                    </button>
                                                </div>
                                                <span className="font-bold text-sm sm:text-base text-foreground">₹{(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {cart.length > 0 && (
                            <div className="p-4 sm:p-6 border-t border-slate-100 space-y-3 sm:space-y-4 bg-slate-50/50">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs sm:text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span className="font-semibold text-foreground">₹{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs sm:text-sm">
                                        <span className="text-muted-foreground">Delivery</span>
                                        <span className="text-green-600 font-medium">Free</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-slate-200">
                                        <span className="font-bold text-base sm:text-lg">Total</span>
                                        <span className="font-bold text-xl sm:text-2xl text-primary">₹{subtotal.toFixed(2)}</span>
                                    </div>
                                </div>
                                <Link
                                    href="/checkout"
                                    onClick={onClose}
                                    className="w-full py-3 sm:py-4 bg-slate-900 text-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-primary transition-all premium-shadow"
                                >
                                    Proceed to Checkout
                                    <ArrowRight size={18} className="sm:hidden" />
                                    <ArrowRight size={20} className="hidden sm:block" />
                                </Link>
                                <p className="text-[10px] text-center text-muted-foreground">
                                    Secure checkout powered by Pfizer Payment Gateway
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
