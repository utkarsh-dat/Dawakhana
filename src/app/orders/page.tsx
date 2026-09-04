"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Clock, CheckCircle, ChevronRight, MapPin, Truck, Loader2 } from "lucide-react";
import CartState from "@/components/CartState";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { Order } from "@/lib/types";
import dynamic from "next/dynamic";

const TrackingModal = dynamic(() => import("@/components/TrackingModal"), {
    ssr: false,
    loading: () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl flex items-center gap-3 shadow-xl">
                <Loader2 className="animate-spin text-primary" size={24} />
                <span className="font-bold text-sm text-slate-700">Loading Tracking Map...</span>
            </div>
        </div>
    )
});

const OrdersPage = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<Order | null>(null);

    useEffect(() => {
        const loadLocalOrders = () => {
            try {
                const guestOrders = JSON.parse(localStorage.getItem("guest_orders") || "[]");
                // Show user's local orders or guest orders
                const filteredLocal = user 
                    ? guestOrders.filter((o: any) => o.userId === user.uid || o.userId.startsWith("guest_"))
                    : guestOrders;
                
                // Map fields to match Order structure
                const formatted = filteredLocal.map((o: any) => ({
                    ...o,
                    createdAt: o.createdAt || { seconds: Date.now() / 1000 }
                }));
                setOrders(formatted);
            } catch (err) {
                console.error("Error loading local orders:", err);
            } finally {
                setLoading(false);
            }
        };

        if (!user) {
            loadLocalOrders();
            return;
        }

        const q = query(
            collection(db, "orders"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Order[];
            setOrders(ordersData);
            setLoading(false);
        }, (error) => {
            console.warn("Firestore fetch failed, loading local orders instead:", error);
            loadLocalOrders();
        });

        return () => unsubscribe();
    }, [user]);

    const handleCancelOrder = async (orderId: string) => {
        if (!confirm("Are you sure you want to cancel this order?")) return;

        setCancellingId(orderId);
        try {
            await updateDoc(doc(db, "orders", orderId), {
                status: "Cancelled"
            });
        } catch (error) {
            console.warn("Error cancelling order in Firestore, updating locally:", error);
            // Fallback: Update in local storage
            try {
                const guestOrders = JSON.parse(localStorage.getItem("guest_orders") || "[]");
                const updated = guestOrders.map((o: any) => 
                    o.id === orderId ? { ...o, status: "Cancelled" } : o
                );
                localStorage.setItem("guest_orders", JSON.stringify(updated));
                // Update component state
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "Cancelled" } : o));
            } catch (e) {
                console.error("Failed to update local order cancellation:", e);
            }
        } finally {
            setCancellingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    const activeOrders = orders.filter(order => order.status !== "Delivered" && order.status !== "Cancelled");
    // For now, let's just stick to the newest active order for the highlight, or the newest order if no active ones
    const highlightedOrder = activeOrders.length > 0 ? activeOrders[0] : orders[0];

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <CartState />

            <main className="flex-grow py-12 px-6">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">My Orders</h1>
                            <p className="text-muted-foreground">Track and manage your pharmacy history.</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold shadow-sm">
                                Active ({activeOrders.length})
                            </span>
                            <span className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold shadow-sm">
                                Total ({orders.length})
                            </span>
                        </div>
                    </div>

                    {!orders.length ? (
                        <div className="text-center py-20">
                            <Package size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-xl font-bold text-slate-700">No orders yet</h3>
                            <p className="text-slate-500 mb-6">Looks like you haven't placed any orders yet.</p>
                            <Link href="/" className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors">
                                Start Shopping
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Highlighted Order (Most Recent) */}
                            {highlightedOrder && highlightedOrder.status !== "Cancelled" && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/20 blur-3xl pointer-events-none" />
                                    <div className="relative z-10 flex flex-col md:flex-row justify-between gap-12">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                                                    <Truck size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-primary font-bold uppercase tracking-widest">
                                                        {highlightedOrder.status === 'Delivered' ? 'Last Delivery' : 'Active Tracking'}
                                                    </p>
                                                    <h2 className="text-2xl font-bold">Order #{highlightedOrder.id.slice(0, 8)}</h2>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-2 h-2 rounded-full ${highlightedOrder.status === 'Delivered' ? 'bg-green-500' : 'bg-primary animate-ping'}`} />
                                                    <div>
                                                        <p className="font-bold">Status</p>
                                                        <p className="text-2xl font-bold text-primary">{highlightedOrder.status}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 text-slate-300">
                                                    <MapPin size={20} className="text-primary" />
                                                    <p className="text-sm">Deliver to: <span className="text-white font-bold">{highlightedOrder.address.firstName} {highlightedOrder.address.lastName}</span></p>
                                                </div>
                                                {highlightedOrder.status !== 'Delivered' && (
                                                    <button
                                                        onClick={() => setSelectedTrackingOrder(highlightedOrder)}
                                                        className="mt-2 w-full md:w-auto px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-primary/10"
                                                    >
                                                        <Truck size={16} />
                                                        Track Live Delivery
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-grow max-w-sm space-y-6">
                                            {/* Simple status visualization */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-6 h-6 border-2 border-primary rounded-full flex items-center justify-center">
                                                        <CheckCircle size={14} className="text-primary" />
                                                    </div>
                                                    <span className="text-sm">Order Confirmed</span>
                                                </div>
                                                {/* More steps could be dynamic based on status */}
                                            </div>

                                            {/* Cancel Button for Highlighted Order - only if pending */}
                                            {['Pending', 'Pending Verification', 'Order Placed'].includes(highlightedOrder.status) && (
                                                <div className="pt-4">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCancelOrder(highlightedOrder.id);
                                                        }}
                                                        disabled={cancellingId === highlightedOrder.id}
                                                        className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                                                    >
                                                        {cancellingId === highlightedOrder.id ? "Cancelling..." : "Cancel Order"}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Orders List */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold px-2">Order History</h3>
                                {orders.filter(o => o.id !== highlightedOrder?.id || highlightedOrder?.status === 'Cancelled').map((order, index) => (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`bg-white p-6 rounded-3xl border border-slate-100 premium-shadow flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/20 transition-all cursor-pointer group ${order.status === 'Cancelled' ? 'opacity-70' : ''}`}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                                <Package size={28} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg">#{order.id.slice(0, 8)}...</h4>
                                                <p className="text-xs text-muted-foreground">
                                                    {order.items.length} Items • {new Date(order.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:items-end gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${order.status === 'Delivered' ? 'bg-green-500' : order.status === 'Cancelled' ? 'bg-red-500' : 'bg-primary animate-pulse'}`} />
                                                <span className="font-bold text-sm">{order.status}</span>
                                            </div>
                                            <p className="text-lg font-bold">₹{order.total.toFixed(2)}</p>

                                            {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedTrackingOrder(order);
                                                    }}
                                                    className="mt-1 text-xs text-primary font-bold hover:underline flex items-center gap-1"
                                                >
                                                    <Truck size={12} />
                                                    Track Delivery
                                                </button>
                                            )}

                                            {/* Cancel Button */}
                                            {['Pending', 'Pending Verification', 'Order Placed'].includes(order.status) && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCancelOrder(order.id);
                                                    }}
                                                    disabled={cancellingId === order.id}
                                                    className="mt-2 text-xs text-red-500 hover:text-red-700 font-semibold hover:underline disabled:opacity-50"
                                                >
                                                    {cancellingId === order.id ? "Cancelling..." : "Cancel Order"}
                                                </button>
                                            )}
                                        </div>

                                        <div className="hidden md:block">
                                            <div className="w-10 h-10 border border-slate-100 rounded-full flex items-center justify-center group-hover:bg-slate-50 transition-all">
                                                <ChevronRight size={20} className="text-slate-300 group-hover:text-primary" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>

            <Footer />

            <AnimatePresence>
                {selectedTrackingOrder && (
                    <TrackingModal
                        order={selectedTrackingOrder}
                        onClose={() => setSelectedTrackingOrder(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default OrdersPage;
