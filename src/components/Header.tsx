"use client";

import React from "react";
import Link from "next/link";
import { ShoppingCart, User, Search, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";

interface HeaderProps {
    onCartClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCartClick }) => {
    const { totalItems } = useCart();

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="sticky top-0 z-50 w-full px-6 py-4 glass"
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center premium-shadow group-hover:scale-110 transition-transform">
                        <span className="text-white font-bold text-xl">D</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-foreground">
                        Dawa<span className="text-primary">Khana</span>
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                    <Link href="/" className="text-foreground transition-colors">Home</Link>
                    <Link href="/catalog" className="text-muted-foreground hover:text-primary transition-colors">Catalog</Link>
                    <Link href="/wellness" className="text-muted-foreground hover:text-primary transition-colors">Wellness</Link>
                    <Link href="/orders" className="text-muted-foreground hover:text-primary transition-colors">My Orders</Link>
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-muted rounded-full transition-colors hidden sm:block">
                        <Search size={20} className="text-muted-foreground" />
                    </button>
                    <button
                        onClick={onCartClick}
                        className="p-2 hover:bg-muted rounded-full transition-colors relative"
                    >
                        <ShoppingCart size={20} className="text-muted-foreground" />
                        {totalItems > 0 && (
                            <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-white text-[10px] flex items-center justify-center rounded-full">
                                {totalItems}
                            </span>
                        )}
                    </button>
                    <button className="p-2 hover:bg-muted rounded-full transition-colors">
                        <User size={20} className="text-muted-foreground" />
                    </button>
                    <button className="p-2 md:hidden hover:bg-muted rounded-full transition-colors">
                        <Menu size={20} className="text-muted-foreground" />
                    </button>
                </div>
            </div>
        </motion.header>
    );
};

export default Header;
