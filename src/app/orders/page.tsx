"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Clock, CheckCircle, ChevronRight, MapPin, Truck, Loader2, XCircle, RefreshCw, FileDown } from "lucide-react";
import CartState from "@/components/CartState";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
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

const timelineSteps = [
    { key: "confirmed", label: "Order confirmed", description: "Your order has been received." },
    { key: "processing", label: "Being prepared", description: "The pharmacy is preparing your medicines." },
    { key: "shipped", label: "Shipped", description: "Your parcel has been handed to the courier." },
    { key: "out_for_delivery", label: "Out for delivery", description: "Your delivery partner is on the way." },
    { key: "delivered", label: "Delivered", description: "Your order was delivered successfully." },
] as const;

function normalizeStatus(status: string) {
    return status.toLowerCase().replace(/[\s-]+/g, "_");
}

function escapeInvoiceText(value: unknown): string {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function OrderTimeline({ order }: { order: Order }) {
    const status = normalizeStatus(order.status);
    const isCancelled = status === "cancelled";
    const isFailed = status === "failed_delivery" || status === "rto";
    const currentIndex = status === "pending" || status === "order_placed" || status === "pending_verification"
        ? 0
        : status === "processing" || status === "confirmed"
            ? 1
            : status === "shipped" || status === "in_transit"
                ? 2
                : status === "out_for_delivery"
                    ? 3
                    : status === "delivered"
                        ? 4
                        : -1;
    const events = order.trackingHistory || [];

    if (isCancelled || isFailed) {
        const label = isCancelled ? "Order cancelled" : status === "rto" ? "Returned to origin" : "Delivery failed";
        return (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm">
                <XCircle className="mt-0.5 shrink-0 text-red-500" size={18} />
                <div>
                    <p className="font-bold text-red-800">{label}</p>
                    <p className="text-red-700">This order will not proceed to delivery.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3" aria-label="Order tracking timeline">
            {timelineSteps.map((step, index) => {
                const event = events.find((item) => {
                    const eventStatus = normalizeStatus(item.status);
                    return eventStatus === step.key ||
                        (step.key === "shipped" && eventStatus === "in_transit");
                });
                const complete = index <= currentIndex;
                return (
                    <div key={step.key} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                            <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${complete ? "border-primary bg-primary text-white" : "border-slate-300 text-transparent"}`}>
                                <CheckCircle size={14} />
                            </div>
                            {index < timelineSteps.length - 1 && <div className={`h-6 w-0.5 ${index < currentIndex ? "bg-primary" : "bg-slate-200"}`} />}
                        </div>
                        <div className="-mt-0.5 flex-1">
                            <p className={`text-sm font-bold ${complete ? "text-slate-800" : "text-slate-400"}`}>{step.label}</p>
                            <p className="text-xs text-slate-500">{event?.remarks || step.description}</p>
                            {event?.location && <p className="text-xs text-slate-400">{event.location}</p>}
                            {event?.timestamp && <p className="text-[11px] text-slate-400">{new Date(event.timestamp).toLocaleString()}</p>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

const OrdersPage = () => {
    const { user } = useAuth();
    const { addToCart } = useCart();
    const { showToast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<Order | null>(null);
    const [returningId, setReturningId] = useState<string | null>(null);

    useEffect(() => {
        const loadLocalOrders = () => {
            try {
                const guestOrders = JSON.parse(localStorage.getItem("guest_orders") || "[]");
                // Show user's local orders or guest orders
                const filteredLocal = user 
                    ? guestOrders.filter((o: any) => o.userId === user.id || o.userId.startsWith("guest_"))
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

        loadLocalOrders();
    }, [user]);

    const handleCancelOrder = async (orderId: string) => {
        if (!confirm("Are you sure you want to cancel this order?")) return;

        setCancellingId(orderId);
        try {
            const guestOrders = JSON.parse(localStorage.getItem("guest_orders") || "[]");
            const updated = guestOrders.map((o: any) =>
                o.id === orderId ? { ...o, status: "Cancelled" } : o
            );
            localStorage.setItem("guest_orders", JSON.stringify(updated));
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "Cancelled" } : o));
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Unable to cancel order.", "error");
        } finally {
            setCancellingId(null);
        }
    };

    const handleReturnRequest = async (order: Order) => {
        if (!user) return showToast("Please sign in to request a return.", "error");
        const reason = window.prompt("Please describe the reason for your return (at least 10 characters).");
        if (!reason) return;
        setReturningId(order.id);
        try {
            const response = await fetch(`/api/v1/orders/${encodeURIComponent(order.id)}/return-request`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-User-UID": user.id, "X-User-Email": user.email || "" },
                body: JSON.stringify({ reason }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Unable to submit return request.");
            showToast("Return request submitted for review.", "success");
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Unable to submit return request.", "error");
        } finally { setReturningId(null); }
    };

    const handleReorder = (order: Order) => {
        const unavailable: string[] = [];
        let addedCount = 0;

        for (const item of order.items || []) {
            if (!item.inStock) {
                unavailable.push(item.name);
                continue;
            }
            const quantity = Math.max(1, Number(item.quantity) || 1);
            for (let index = 0; index < quantity; index += 1) addToCart(item);
            addedCount += 1;
        }

        if (addedCount > 0) {
            showToast(
                unavailable.length > 0
                    ? `${addedCount} item(s) added. ${unavailable.length} unavailable.`
                    : `${addedCount} item(s) added to your cart.`,
                unavailable.length > 0 ? "warning" : "success"
            );
        } else {
            showToast("None of the items in this order are currently available.", "error");
        }
    };

    const downloadInvoice = (order: Order) => {
        const createdAt = typeof order.createdAt === "object" && "seconds" in order.createdAt
            ? new Date(order.createdAt.seconds * 1000)
            : new Date(order.createdAt || Date.now());
        const itemRows = (order.items || []).map((item) => `
            <tr>
                <td>${escapeInvoiceText(item.name)}</td>
                <td>${item.quantity}</td>
                <td>₹${Number(item.price).toFixed(2)}</td>
                <td>₹${(Number(item.price) * item.quantity).toFixed(2)}</td>
            </tr>`).join("");
        const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${escapeInvoiceText(order.id)}</title>
            <style>
                body{font-family:Arial,sans-serif;color:#172033;max-width:800px;margin:40px auto;padding:0 24px}
                header{display:flex;justify-content:space-between;border-bottom:2px solid #0f766e;padding-bottom:20px}
                h1{color:#0f766e;margin:0}h2{margin-top:32px}table{width:100%;border-collapse:collapse;margin-top:16px}
                th,td{text-align:left;padding:10px;border-bottom:1px solid #e5e7eb}th{background:#f0fdfa}
                .total{margin-left:auto;max-width:300px;margin-top:20px}.row{display:flex;justify-content:space-between;padding:6px}
                .grand{font-weight:bold;font-size:18px;border-top:2px solid #172033;margin-top:8px;padding-top:10px}
                .muted{color:#64748b;font-size:13px} @media print{body{margin:0}}
            </style></head><body>
            <header><div><h1>DawaKhana</h1><p class="muted">Authentic medicines delivered to your door</p></div>
            <div><strong>INVOICE</strong><br><span class="muted">Order #${escapeInvoiceText(order.id)}</span><br><span class="muted">${createdAt.toLocaleDateString()}</span></div></header>
            <h2>Delivery details</h2><p>${escapeInvoiceText(order.address?.firstName)} ${escapeInvoiceText(order.address?.lastName)}<br>
            ${escapeInvoiceText(order.address?.address)}<br>PIN: ${escapeInvoiceText(order.address?.postalCode)}<br>
            Phone: ${escapeInvoiceText(order.address?.phoneNumber)}</p>
            <h2>Items</h2><table><thead><tr><th>Medicine</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>${itemRows}</tbody></table>
            <div class="total"><div class="row"><span>Subtotal</span><span>₹${Number(order.subtotal).toFixed(2)}</span></div>
            <div class="row"><span>Delivery</span><span>₹${Number(order.deliveryFee).toFixed(2)}</span></div>
            <div class="row grand"><span>Total</span><span>₹${Number(order.total).toFixed(2)}</span></div></div>
            <p class="muted">Payment method: ${escapeInvoiceText(order.paymentMethod)}<br>Status: ${escapeInvoiceText(order.status)}</p>
            <p class="muted">This invoice is generated from your DawaKhana order record.</p></body></html>`;
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `dawakhana-invoice-${order.id}.html`;
        link.click();
        URL.revokeObjectURL(url);
        showToast("Invoice downloaded. Open it and choose Print > Save as PDF.", "success");
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
                                            <OrderTimeline order={highlightedOrder} />
                                            <button
                                                onClick={() => downloadInvoice(highlightedOrder)}
                                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:border-primary hover:text-primary"
                                            >
                                                <FileDown size={15} /> Download invoice
                                            </button>
                                            <button
                                                onClick={() => handleReorder(highlightedOrder)}
                                                className="inline-flex items-center gap-2 rounded-xl border border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-primary/10"
                                            >
                                                <RefreshCw size={15} /> Reorder items
                                            </button>

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
                                                    {order.items.length} Items • {new Date(typeof order.createdAt === "object" && "seconds" in order.createdAt ? order.createdAt.seconds * 1000 : order.createdAt || Date.now()).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:items-end gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${order.status === 'Delivered' ? 'bg-green-500' : order.status === 'Cancelled' ? 'bg-red-500' : 'bg-primary animate-pulse'}`} />
                                                <span className="font-bold text-sm">{order.status}</span>
                                            </div>
                                            <p className="text-lg font-bold">₹{order.total.toFixed(2)}</p>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    downloadInvoice(order);
                                                }}
                                                className="mt-1 text-xs text-primary font-bold hover:underline flex items-center gap-1"
                                            >
                                                <FileDown size={12} /> Download invoice
                                            </button>
                                            {order.status === "Delivered" && (
                                                <button onClick={(e) => { e.stopPropagation(); void handleReturnRequest(order); }} disabled={returningId === order.id} className="mt-1 text-xs font-semibold text-primary hover:underline disabled:opacity-50">
                                                    {returningId === order.id ? "Submitting..." : "Request return/refund"}
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleReorder(order);
                                                }}
                                                className="mt-1 text-xs text-primary font-bold hover:underline flex items-center gap-1"
                                            >
                                                <RefreshCw size={12} /> Reorder
                                            </button>

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
