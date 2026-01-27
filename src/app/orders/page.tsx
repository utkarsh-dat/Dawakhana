"use client";

import React from "react";
import { motion } from "framer-motion";
import { Package, Clock, CheckCircle, ChevronRight, MapPin, Truck } from "lucide-react";
import CartState from "@/components/CartState";
import Footer from "@/components/Footer";
import Link from "next/link";

const orders = [
    {
        id: "DK-92841",
        date: "Jan 26, 2026",
        status: "In Transit",
        items: 3,
        total: 82.50,
        eta: "15 mins",
    },
    {
        id: "DK-91732",
        date: "Jan 22, 2026",
        status: "Delivered",
        items: 1,
        total: 15.00,
        eta: "Delivered",
    },
    {
        id: "DK-89210",
        date: "Jan 15, 2026",
        status: "Delivered",
        items: 2,
        total: 42.00,
        eta: "Delivered",
    }
];

const OrdersPage = () => {
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
                            <span className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold shadow-sm">Active Orders (1)</span>
                            <span className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold shadow-sm">Past Orders (2)</span>
                        </div>
                    </div>

                    {/* Active Order Highlight */}
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
                                        <p className="text-xs text-primary font-bold uppercase tracking-widest">Active Tracking</p>
                                        <h2 className="text-2xl font-bold">Order #DK-92841</h2>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                                        <div>
                                            <p className="font-bold">Estimated Arrival</p>
                                            <p className="text-2xl font-bold text-primary">15 - 20 Minutes</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-300">
                                        <MapPin size={20} className="text-primary" />
                                        <p className="text-sm">Assigned Courier: <span className="text-white font-bold">Michael Jordan</span></p>
                                    </div>
                                </div>

                                <button className="px-10 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg shadow-primary/30">
                                    Track live map
                                </button>
                            </div>

                            <div className="flex-grow max-w-sm space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-6 h-6 border-2 border-primary rounded-full flex items-center justify-center">
                                            <CheckCircle size={14} className="text-primary" />
                                        </div>
                                        <span className="text-sm">Order Confirmed</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-6 h-6 border-2 border-primary rounded-full flex items-center justify-center">
                                            <CheckCircle size={14} className="text-primary" />
                                        </div>
                                        <span className="text-sm">Pharmacy Preparation</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-primary">
                                        <div className="w-6 h-6 border-2 border-primary rounded-full flex items-center justify-center bg-primary">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                        </div>
                                        <span className="text-sm font-bold">Out for Delivery</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-500">
                                        <div className="w-6 h-6 border-2 border-slate-700 rounded-full" />
                                        <span className="text-sm">Delivered</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Past Orders List */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold px-2">Order History</h3>
                        {orders.map((order, index) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white p-6 rounded-3xl border border-slate-100 premium-shadow flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/20 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                        <Package size={28} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">{order.id}</h4>
                                        <p className="text-xs text-muted-foreground">{order.date} • {order.items} Items</p>
                                    </div>
                                </div>

                                <div className="flex flex-col md:items-end gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${order.status === 'Delivered' ? 'bg-green-500' : 'bg-primary animate-pulse'}`} />
                                        <span className="font-bold text-sm">{order.status}</span>
                                    </div>
                                    <p className="text-lg font-bold">₹{order.total.toFixed(2)}</p>
                                </div>

                                <div className="hidden md:block">
                                    <div className="w-10 h-10 border border-slate-100 rounded-full flex items-center justify-center group-hover:bg-slate-50 transition-all">
                                        <ChevronRight size={20} className="text-slate-300 group-hover:text-primary" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default OrdersPage;
