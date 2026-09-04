"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Medicine } from "@/lib/medicines";
import dynamic from "next/dynamic";

const ChatBot = dynamic(() => import("@/components/ChatBot"), {
    ssr: false,
});
import { useAuth } from "./AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { User } from "firebase/auth";

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
    const prevUserRef = useRef<User | null>(null);

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
        prevUserRef.current = user;
    }, [user, isInitialized]);

    // 2. Sync with Cloud on Login
    useEffect(() => {
        if (!user || !isInitialized) return;

        const syncCart = async () => {
            const userCartRef = doc(db, "users", user.uid);

            try {
                const docSnap = await getDoc(userCartRef);

                if (docSnap.exists()) {
                    const cloudCart = docSnap.data().cart || [];

                    // MERGE LOGIC: Cloud wins for same items, unless we want to be smarter. 
                    // Simple merge: If local has items, add them if not in cloud.
                    // For now, let's just use Cloud as source of truth if it exists, + current session items?
                    // actually, standard e-commerce: "Merge Local cart into Cloud account"

                    setCart((currentLocalCart) => {
                        // If no local items, just take cloud
                        if (currentLocalCart.length === 0) return cloudCart;

                        // If local items exist, merge them
                        // Create a map by ID
                        const mergedMap = new Map();

                        // Add cloud items first
                        cloudCart.forEach((item: CartItem) => mergedMap.set(item.id, item));

                        // Add/Overwrite with local items (User intent usually implies local session is freshest)
                        currentLocalCart.forEach((item) => {
                            if (mergedMap.has(item.id)) {
                                // If exists, maybe sum quantity? Let's just keep the max or local
                                const existing = mergedMap.get(item.id);
                                mergedMap.set(item.id, { ...item, quantity: Math.max(existing.quantity, item.quantity) });
                            } else {
                                mergedMap.set(item.id, item);
                            }
                        });

                        return Array.from(mergedMap.values());
                    });
                }
            } catch (error) {
                console.error("Error syncing cart from cloud:", error);
            }
        };

        syncCart();
    }, [user, isInitialized]);

    // 3. Save to LocalStorage AND Cloud (Debounced)
    useEffect(() => {
        if (!isInitialized) return;

        // Always save to local storage as backup/guest
        localStorage.setItem("cart", JSON.stringify(cart));

        if (user) {
            const timeoutId = setTimeout(async () => {
                try {
                    await setDoc(doc(db, "users", user.uid), { cart }, { merge: true });
                } catch (error) {
                    console.error("Error saving cart to cloud:", error);
                }
            }, 1000); // 1 sec debounce

            return () => clearTimeout(timeoutId);
        }
    }, [cart, user, isInitialized]);

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
