"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Package,
    CheckCircle,
    Truck,
    Clock,
    AlertCircle,
    ArrowLeft,
    Search,
    Filter,
    RefreshCw,
    IndianRupee,
    ShoppingBag,
    Users,
    TrendingUp,
    Eye,
    X
} from "lucide-react";

// Admin email - only this user can access this page
const ADMIN_EMAIL = "vickynishad110@gmail.com";

interface OrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
}

interface Address {
    firstName: string;
    lastName: string;
    address: string;
    phoneNumber: string;
    postalCode: string;
}

interface Order {
    id: string;
    userId: string;
    items: OrderItem[];
    subtotal: number;
    deliveryFee: number;
    total: number;
    status: string;
    paymentMethod: string;
    transactionId?: string;
    address: Address;
    createdAt: Timestamp;
}

const statusOptions = [
    { value: "Pending", label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    { value: "Pending Verification", label: "Pending Verification", color: "bg-orange-100 text-orange-800", icon: AlertCircle },
    { value: "Order Placed", label: "Order Placed", color: "bg-blue-100 text-blue-800", icon: Package },
    { value: "Confirmed", label: "Confirmed", color: "bg-green-100 text-green-800", icon: CheckCircle },
    { value: "Shipped", label: "Shipped", color: "bg-purple-100 text-purple-800", icon: Truck },
    { value: "Delivered", label: "Delivered", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
    { value: "Cancelled", label: "Cancelled", color: "bg-red-100 text-red-800", icon: X },
];

export default function AdminPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

    // Check admin access
    useEffect(() => {
        if (!authLoading && (!user || user.email !== ADMIN_EMAIL)) {
            router.push("/");
        }
    }, [user, authLoading, router]);

    // Fetch orders in real-time
    useEffect(() => {
        if (!user || user.email !== ADMIN_EMAIL) return;

        const ordersQuery = query(
            collection(db, "orders"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
            const ordersData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Order[];
            setOrders(ordersData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Update order status
    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        setUpdatingStatus(orderId);
        try {
            await updateDoc(doc(db, "orders", orderId), {
                status: newStatus,
            });
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        } finally {
            setUpdatingStatus(null);
        }
    };

    // Filter orders
    const filteredOrders = orders.filter((order) => {
        const matchesSearch =
            order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.address.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.address.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.address.phoneNumber.includes(searchQuery);

        const matchesStatus = statusFilter === "all" || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Analytics
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter((order) => {
        if (!order.createdAt) return false;
        const orderDate = order.createdAt.toDate();
        return orderDate >= todayStart;
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
    const pendingOrders = orders.filter((o) =>
        o.status === "Pending" || o.status === "Pending Verification" || o.status === "Order Placed"
    ).length;

    const getStatusInfo = (status: string) => {
        return statusOptions.find((s) => s.value === status) || statusOptions[0];
    };

    // Loading / Auth check
    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex items-center gap-3">
                    <RefreshCw className="animate-spin" size={24} />
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    if (!user || user.email !== ADMIN_EMAIL) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                    <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                    <p className="text-slate-600 mb-4">You don&apos;t have permission to access this page.</p>
                    <Link href="/" className="text-primary hover:underline">
                        Go back to home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="p-2 hover:bg-slate-100 rounded-lg transition">
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                                <p className="text-sm text-slate-500">DawaKhana Order Management</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-600">{user.email}</span>
                            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                                A
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Analytics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <ShoppingBag className="text-blue-600" size={24} />
                            </div>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Total</span>
                        </div>
                        <h3 className="text-3xl font-bold">{orders.length}</h3>
                        <p className="text-sm text-slate-500">Total Orders</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <IndianRupee className="text-green-600" size={24} />
                            </div>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Total</span>
                        </div>
                        <h3 className="text-3xl font-bold">₹{totalRevenue.toFixed(0)}</h3>
                        <p className="text-sm text-slate-500">Total Revenue</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Clock className="text-orange-600" size={24} />
                            </div>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Action</span>
                        </div>
                        <h3 className="text-3xl font-bold">{pendingOrders}</h3>
                        <p className="text-sm text-slate-500">Pending Orders</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <TrendingUp className="text-purple-600" size={24} />
                            </div>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Today</span>
                        </div>
                        <h3 className="text-3xl font-bold">₹{todayRevenue.toFixed(0)}</h3>
                        <p className="text-sm text-slate-500">Today&apos;s Revenue ({todayOrders.length} orders)</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by order ID, name, or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter size={20} className="text-slate-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                <option value="all">All Status</option>
                                {statusOptions.map((status) => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Order ID</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Customer</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Items</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Total</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Payment</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Date</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                            <Package size={48} className="mx-auto mb-4 text-slate-300" />
                                            <p>No orders found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order) => {
                                        const statusInfo = getStatusInfo(order.status);
                                        const StatusIcon = statusInfo.icon;
                                        return (
                                            <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                                <td className="px-6 py-4">
                                                    <span className="font-mono text-sm text-slate-600">
                                                        #{order.id.slice(0, 8)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-medium">{order.address.firstName} {order.address.lastName}</p>
                                                        <p className="text-sm text-slate-500">{order.address.phoneNumber}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm">{order.items.length} items</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold">₹{order.total.toFixed(2)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-sm">{order.paymentMethod}</p>
                                                        {order.transactionId && (
                                                            <p className="text-xs text-slate-500 font-mono">UTR: {order.transactionId}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                        disabled={updatingStatus === order.id}
                                                        className={`px-3 py-1.5 rounded-full text-sm font-medium border-0 cursor-pointer ${statusInfo.color} ${updatingStatus === order.id ? "opacity-50" : ""}`}
                                                    >
                                                        {statusOptions.map((status) => (
                                                            <option key={status.value} value={status.value}>
                                                                {status.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-slate-500">
                                                        {order.createdAt?.toDate().toLocaleDateString("en-IN", {
                                                            day: "numeric",
                                                            month: "short",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => setSelectedOrder(order)}
                                                        className="p-2 hover:bg-slate-100 rounded-lg transition"
                                                        title="View Details"
                                                    >
                                                        <Eye size={18} className="text-slate-600" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold">Order Details</h2>
                                <p className="text-sm text-slate-500 font-mono">#{selectedOrder.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Customer Info */}
                            <div>
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <Users size={18} /> Customer Information
                                </h3>
                                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                                    <p><span className="text-slate-500">Name:</span> {selectedOrder.address.firstName} {selectedOrder.address.lastName}</p>
                                    <p><span className="text-slate-500">Phone:</span> {selectedOrder.address.phoneNumber}</p>
                                    <p><span className="text-slate-500">Address:</span> {selectedOrder.address.address}</p>
                                    <p><span className="text-slate-500">Postal Code:</span> {selectedOrder.address.postalCode}</p>
                                </div>
                            </div>

                            {/* Payment Info */}
                            <div>
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <IndianRupee size={18} /> Payment Information
                                </h3>
                                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                                    <p><span className="text-slate-500">Method:</span> {selectedOrder.paymentMethod}</p>
                                    {selectedOrder.transactionId && (
                                        <p><span className="text-slate-500">UTR/Transaction ID:</span> <span className="font-mono bg-yellow-100 px-2 py-0.5 rounded">{selectedOrder.transactionId}</span></p>
                                    )}
                                    <p><span className="text-slate-500">Status:</span> <span className={`px-2 py-0.5 rounded ${getStatusInfo(selectedOrder.status).color}`}>{selectedOrder.status}</span></p>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div>
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <Package size={18} /> Order Items
                                </h3>
                                <div className="space-y-3">
                                    {selectedOrder.items.map((item, index) => (
                                        <div key={index} className="flex items-center gap-4 bg-slate-50 rounded-lg p-3">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-12 h-12 object-cover rounded-lg"
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium">{item.name}</p>
                                                <p className="text-sm text-slate-500">Qty: {item.quantity} × ₹{item.price}</p>
                                            </div>
                                            <p className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="border-t border-slate-200 pt-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Subtotal</span>
                                        <span>₹{selectedOrder.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Delivery Fee</span>
                                        <span>₹{selectedOrder.deliveryFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                        <span>Total</span>
                                        <span>₹{selectedOrder.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        updateOrderStatus(selectedOrder.id, "Confirmed");
                                        setSelectedOrder(null);
                                    }}
                                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                                >
                                    ✓ Confirm Order
                                </button>
                                <button
                                    onClick={() => {
                                        updateOrderStatus(selectedOrder.id, "Shipped");
                                        setSelectedOrder(null);
                                    }}
                                    className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                                >
                                    🚚 Mark Shipped
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
