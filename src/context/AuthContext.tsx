"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import supabase from "@/lib/supabaseClient";

const ADMIN_EMAILS = ["vickynishad011@gmail.com", "dawakhana011@gmail.com"];
const PHARMACIST_EMAILS = ["pharmacist@dawakhana.com"];
const DELIVERY_EMAILS = ["delivery@dawakhana.com"];

export type UserRole = "customer" | "pharmacist" | "delivery_partner" | "admin";

interface AuthContextType {
    user: User | null;
    role: UserRole;
    isAdmin: boolean;
    isPharmacist: boolean;
    isDeliveryPartner: boolean;
    loading: boolean;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: "customer",
    isAdmin: false,
    isPharmacist: false,
    isDeliveryPartner: false,
    loading: true,
    loginWithGoogle: async () => undefined,
    logout: async () => undefined,
});

export const useAuth = () => useContext(AuthContext);

function roleForEmail(email: string | undefined): UserRole {
    if (email && ADMIN_EMAILS.includes(email)) return "admin";
    if (email && PHARMACIST_EMAILS.includes(email)) return "pharmacist";
    if (email && DELIVERY_EMAILS.includes(email)) return "delivery_partner";
    return "customer";
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>("customer");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async (currentUser: User | null) => {
            setUser(currentUser);
            if (!currentUser) {
                setRole("customer");
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from("users")
                .select("role")
                .eq("id", currentUser.id)
                .maybeSingle();
            setRole((data?.role as UserRole | undefined) || roleForEmail(currentUser.email));
            setLoading(false);
        };

        supabase.auth.getSession().then(({ data }) => loadProfile(data.session?.user || null));
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            void loadProfile(session?.user || null);
        });
        return () => listener.subscription.unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
        if (error) throw error;
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{
            user,
            role,
            isAdmin: role === "admin",
            isPharmacist: role === "pharmacist",
            isDeliveryPartner: role === "delivery_partner",
            loading,
            loginWithGoogle,
            logout,
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
