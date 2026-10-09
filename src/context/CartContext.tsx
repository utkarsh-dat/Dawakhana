"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Medicine } from "@/lib/medicines";
import dynamic from "next/dynamic";

const ChatBot = dynamic(() => import("@/components/ChatBot"), {
    ssr: false,
});
import { useAuth } from "./AuthContext";

interface CartItem extends Medicine {
    quantity: number;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (medicine: Medicine) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    subtotal: number;
    totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const prevUserRef = useRef<string | null>(null);

    // 1. Initial Load (Local Storage) - Only once on mount
    useEffect(() => {
        const savedCart = localStorage.getItem("cart");
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }
        // eslint-disable-next-line
        setIsInitialized(true);
    }, []);

    // 2. Handle Logout (Clear Cart)
    useEffect(() => {
        if (isInitialized && prevUserRef.current && !user) {
            // Wrap in setTimeout to avoid set-state-in-effect warnings and ensure clean cycle
            setTimeout(() => {
                setCart([]);
                localStorage.removeItem("cart");
            }, 0);
        }
        prevUserRef.current = user?.id || null;
    }, [user, isInitialized]);

    // Save the cart locally for both signed-in and guest customers.
    useEffect(() => {
        if (!isInitialized) return;

        // Always save to local storage as backup/guest
        localStorage.setItem("cart", JSON.stringify(cart));

    }, [cart, isInitialized]);

    const addToCart = (medicine: Medicine) => {
        setCart((prev) => {
            const existingItem = prev.find((item) => item.id === medicine.id);
            if (existingItem) {
                return prev.map((item) =>
                    item.id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...medicine, quantity: 1 }];
        });
    };

    const removeFromCart = (id: string) => {
        setCart((prev) => prev.filter((item) => item.id !== id));
    };

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity < 1) return;
        setCart((prev) =>
            prev.map((item) => (item.id === id ? { ...item, quantity } : item))
        );
    };

    const clearCart = () => setCart([]);

    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                subtotal,
                totalItems,
            }}
        >
            {children}
            <ChatBot />
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};
