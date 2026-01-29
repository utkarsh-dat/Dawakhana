"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, User, Search, Menu, X, LogOut, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
    onCartClick?: () => void;
}

const ADMIN_EMAILS = ["vickynishad110@gmail.com", "dawakhana011@gmail.com"];

const Header: React.FC<HeaderProps> = ({ onCartClick }) => {
    const { totalItems } = useCart();
    const { user, logout, loginWithGoogle } = useAuth();
    const router = useRouter();
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
            setShowSearch(false);
            setSearchQuery("");
        }
    };

    const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

    return (
        <>
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
                        <Link href="/orders" className="text-muted-foreground hover:text-primary transition-colors">My Orders</Link>
                        {isAdmin && (
                            <Link href="/admin" className="text-primary font-semibold hover:text-primary/80 transition-colors">
                                Admin
                            </Link>
                        )}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {/* Search Button */}
                        <button
                            onClick={() => setShowSearch(true)}
                            className="p-2 hover:bg-muted rounded-full transition-colors"
                        >
                            <Search size={20} className="text-muted-foreground" />
                        </button>

                        {/* Cart */}
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

                        {/* User Menu */}
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="p-1 hover:bg-muted rounded-full transition-colors"
                                >
                                    {user.photoURL ? (
                                        <img
                                            src={user.photoURL}
                                            alt={user.displayName || "User"}
                                            className="w-8 h-8 rounded-full border border-border"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {user.email?.[0].toUpperCase()}
                                        </div>
                                    )}
                                </button>

                                {/* Dropdown Menu */}
                                <AnimatePresence>
                                    {showUserMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50"
                                        >
                                            <div className="p-3 border-b border-slate-100">
                                                <p className="font-medium text-sm truncate">{user.displayName || "User"}</p>
                                                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                            </div>
                                            <div className="p-1">
                                                <Link
                                                    href="/orders"
                                                    onClick={() => setShowUserMenu(false)}
                                                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 rounded-lg transition"
                                                >
                                                    <ShoppingCart size={16} /> My Orders
                                                </Link>
                                                {isAdmin && (
                                                    <Link
                                                        href="/admin"
                                                        onClick={() => setShowUserMenu(false)}
                                                        className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/5 rounded-lg transition"
                                                    >
                                                        <Settings size={16} /> Admin Panel
                                                    </Link>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        logout();
                                                        setShowUserMenu(false);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                                                >
                                                    <LogOut size={16} /> Logout
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <button
                                onClick={() => loginWithGoogle()}
                                className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
                            >
                                Login
                            </button>
                        )}

                        <button className="p-2 md:hidden hover:bg-muted rounded-full transition-colors">
                            <Menu size={20} className="text-muted-foreground" />
                        </button>
                    </div>
                </div>
            </motion.header>

            {/* Search Modal */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20"
                        onClick={() => setShowSearch(false)}
                    >
                        <motion.div
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <form onSubmit={handleSearch} className="flex items-center gap-3 p-4">
                                <Search size={24} className="text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search medicines..."
                                    autoFocus
                                    className="flex-1 text-lg outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSearch(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition"
                                >
                                    <X size={20} />
                                </button>
                            </form>
                            <div className="px-4 pb-4">
                                <button
                                    type="submit"
                                    onClick={handleSearch}
                                    className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition"
                                >
                                    Search
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Click outside to close user menu */}
            {showUserMenu && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                />
            )}
        </>
    );
};

export default Header;

