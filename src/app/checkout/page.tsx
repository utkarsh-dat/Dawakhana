"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, CreditCard, Truck, CheckCircle, ShieldCheck, Loader2, MapPin } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import CartState from "@/components/CartState";
import Footer from "@/components/Footer";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { DeliveryAddress } from "@/lib/types";

const steps = ["Delivery", "Payment", "Confirm"];

const CheckoutPage = () => {
    const { cart, subtotal, clearCart } = useCart();
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);

    // Location State
    const [detectingLocation, setDetectingLocation] = useState(false);

    const [address, setAddress] = useState<DeliveryAddress>({
        firstName: "",
        lastName: "",
        address: "",
        phoneNumber: "",
        postalCode: "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setAddress((prev) => ({ ...prev, [name]: value }));
    };

    const detectLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setDetectingLocation(true);

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                // Use OpenStreetMap Nominatim API (Free)
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await response.json();

                if (data && data.address) {
                    setAddress(prev => ({
                        ...prev,
                        address: data.display_name,
                        postalCode: data.address.postcode || prev.postalCode,
                    }));
                }
            } catch (error) {
                console.error("Location detection failed:", error);
                alert("Could not fetch location address.");
            } finally {
                setDetectingLocation(false);
            }
        }, (error) => {
            console.error(error);
            alert("Unable to retrieve your location. Check permissions.");
            setDetectingLocation(false);
        });
    };

    const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

    const DELIVERY_THRESHOLD = 200;
    const STANDARD_DELIVERY_FEE = 40;
    const deliveryFee = subtotal >= DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
    const total = subtotal + deliveryFee;



    const [selectedMethod, setSelectedMethod] = useState<"COD" | "UPI">("COD");
    const [utrNumber, setUtrNumber] = useState("");

    const placeOrder = async () => {
        if (!user) {
            alert("Please login to place an order");
            return;
        }

        if (selectedMethod === "UPI" && !utrNumber) {
            alert("Please enter the Reference/Transaction ID (UTR) after payment.");
            return;
        }

        setLoading(true);

        try {
            await addDoc(collection(db, "orders"), {
                userId: user.uid,
                items: cart,
                subtotal,
                deliveryFee,
                total,
                status: selectedMethod === "UPI" ? "Pending Verification" : "Pending",
                paymentMethod: selectedMethod === "COD" ? "Cash on Delivery" : "UPI (QR Scan)",
                transactionId: selectedMethod === "UPI" ? utrNumber : null,
                address,
                createdAt: serverTimestamp(),
            });

            // For now, simpler ID generation or just rely on Firestore generated ID which we don't display immediately here usually 
            // but let's grab the ref above if we need to show ID. 
            // Correct logic:
            // const orderRef = await addDoc...
            // setOrderId(orderRef.id);

            // Re-implementing correctly below in clean block
        } catch (error) {
            // Defined below
        }
    };

    // REDEFINING FULL COMPONENT CONTENT TO ENSURE CLEAN SWAP
    const handlePlaceOrder = async () => {
        if (!user) {
            alert("Please login to place an order");
            return;
        }

        if (selectedMethod === "UPI" && !utrNumber) {
            alert("Please enter the Reference/Transaction ID (UTR) after payment.");
            return;
        }

        setLoading(true);
        try {
            const orderRef = await addDoc(collection(db, "orders"), {
                userId: user.uid,
                items: cart,
                subtotal,
                deliveryFee,
                total,
                status: selectedMethod === "UPI" ? "Pending Verification" : "Order Placed",
                paymentMethod: selectedMethod === "COD" ? "Cash on Delivery" : "UPI (QR Scan)",
                transactionId: selectedMethod === "UPI" ? utrNumber : null,
                address,
                createdAt: serverTimestamp(),
            });

            setOrderId(orderRef.id);
            clearCart();
            nextStep();
        } catch (error) {
            console.error("Error placing order:", error);
            alert("Failed to place order. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <CartState />

            <main className="flex-grow py-12 px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Progress Header */}
                    <div className="flex items-center justify-between mb-12">
                        <h1 className="text-3xl font-bold">Checkout</h1>
                        <div className="flex items-center gap-4">
                            {steps.map((step, index) => (
                                <React.Fragment key={step}>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index <= currentStep ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-400"
                                            }`}>
                                            {index < currentStep ? <CheckCircle size={16} /> : index + 1}
                                        </div>
                                        <span className={`text-sm font-semibold ${index <= currentStep ? "text-foreground" : "text-slate-400"}`}>
                                            {step}
                                        </span>
                                    </div>
                                    {index < steps.length - 1 && <ChevronRight size={16} className="text-slate-300" />}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Form Section */}
                        <div className="lg:col-span-2 space-y-8">
                            <AnimatePresence mode="wait">
                                {currentStep === 0 && (
                                    <motion.div
                                        key="delivery"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="bg-white p-8 rounded-[2rem] border border-slate-100 premium-shadow space-y-6"
                                    >
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <Truck className="text-primary" />
                                                <h2 className="text-xl font-bold">Delivery Address</h2>
                                            </div>
                                            <button
                                                onClick={detectLocation}
                                                disabled={detectingLocation}
                                                className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                                            >
                                                {detectingLocation ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
                                                Use Present Location
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">First Name</label>
                                                <input
                                                    name="firstName"
                                                    value={address.firstName}
                                                    onChange={handleInputChange}
                                                    type="text"
                                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 outline-none focus:border-primary transition-colors"
                                                    placeholder="John"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Last Name</label>
                                                <input
                                                    name="lastName"
                                                    value={address.lastName}
                                                    onChange={handleInputChange}
                                                    type="text"
                                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 outline-none focus:border-primary transition-colors"
                                                    placeholder="Doe"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Address</label>
                                            <textarea
                                                name="address"
                                                value={address.address}
                                                onChange={(e) => setAddress(prev => ({ ...prev, address: e.target.value }))}
                                                className="w-full h-24 px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-primary transition-colors resize-none"
                                                placeholder="123 Health Ave, Wellness City"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number</label>
                                                <input
                                                    name="phoneNumber"
                                                    value={address.phoneNumber}
                                                    onChange={handleInputChange}
                                                    type="text"
                                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 outline-none focus:border-primary transition-colors"
                                                    placeholder="+1 234 567 890"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Postal Code</label>
                                                <input
                                                    name="postalCode"
                                                    value={address.postalCode}
                                                    onChange={handleInputChange}
                                                    type="text"
                                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 outline-none focus:border-primary transition-colors"
                                                    placeholder="10001"
                                                />
                                            </div>
                                        </div>
                                        <button onClick={nextStep} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold hover:bg-primary transition-all mt-4">
                                            Continue to Payment
                                        </button>
                                    </motion.div>
                                )}

                                {currentStep === 1 && (
                                    <motion.div
                                        key="payment"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="bg-white p-8 rounded-[2rem] border border-slate-100 premium-shadow space-y-6"
                                    >
                                        <div className="flex items-center gap-3 mb-6">
                                            <CreditCard className="text-primary" />
                                            <h2 className="text-xl font-bold">Select Payment Method</h2>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setSelectedMethod("COD")}
                                                className={`p-6 rounded-2xl border-2 text-left transition-all ${selectedMethod === "COD"
                                                    ? "border-primary bg-primary/5"
                                                    : "border-slate-100 hover:border-slate-200"
                                                    }`}
                                            >
                                                <div className="font-bold text-lg mb-1">Cash on Delivery</div>
                                                <p className="text-sm text-muted-foreground">Pay when you receive your order.</p>
                                            </button>

                                            <button
                                                onClick={() => setSelectedMethod("UPI")}
                                                className={`p-6 rounded-2xl border-2 text-left transition-all ${selectedMethod === "UPI"
                                                    ? "border-primary bg-primary/5"
                                                    : "border-slate-100 hover:border-slate-200"
                                                    }`}
                                            >
                                                <div className="font-bold text-lg mb-1">UPI / QR Scan</div>
                                                <p className="text-sm text-muted-foreground">Scan QR and pay instantly.</p>
                                            </button>
                                        </div>

                                        {selectedMethod === "UPI" && (
                                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                                                <div className="text-center">
                                                    <div className="w-48 h-48 bg-white p-2 rounded-xl mx-auto border border-slate-200 mb-2 flex items-center justify-center">
                                                        {/* Dynamic QR Code - Robust Generation */}
                                                        {(() => {
                                                            const upiId = process.env.NEXT_PUBLIC_UPI_ID || "8707535798@ybl";
                                                            const payeeName = "DawaKhana";
                                                            const amount = total.toFixed(2);
                                                            const note = `Order Payment`;

                                                            // Construct the raw UPI string first
                                                            const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

                                                            // Encode the entire string for the QR API parameter
                                                            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiString)}`;

                                                            return (
                                                                <img
                                                                    src={qrApiUrl}
                                                                    alt="UPI QR Code"
                                                                    className="w-full h-full object-contain"
                                                                />
                                                            );
                                                        })()}
                                                    </div>
                                                    <p className="font-bold text-sm">Scan with any UPI App</p>
                                                    <p className="text-xs text-muted-foreground">GPay, PhonePe, Paytm, etc.</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Enter Transaction ID / UTR</label>
                                                    <input
                                                        value={utrNumber}
                                                        onChange={(e) => setUtrNumber(e.target.value)}
                                                        type="text"
                                                        className="w-full h-12 px-4 rounded-xl border border-slate-200 outline-none focus:border-primary transition-colors"
                                                        placeholder="e.g. 123456789012"
                                                    />
                                                    <p className="text-[10px] text-slate-400">We will verify this ID to process your order.</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            <button onClick={prevStep} className="h-14 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-colors">
                                                Go Back
                                            </button>
                                            <button
                                                onClick={handlePlaceOrder}
                                                disabled={loading}
                                                className="h-14 bg-slate-900 text-white rounded-2xl font-bold hover:bg-primary transition-all flex items-center justify-center gap-2"
                                            >
                                                {loading ? <Loader2 className="animate-spin" /> : "Place Order"}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {currentStep === 2 && (
                                    <motion.div
                                        key="confirm"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="bg-white p-8 rounded-[2rem] border border-slate-100 premium-shadow text-center space-y-6"
                                    >
                                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <CheckCircle size={40} />
                                        </div>
                                        <h2 className="text-3xl font-bold">Order Received!</h2>
                                        <p className="text-muted-foreground max-w-sm mx-auto">
                                            Thank you for choosing DawaKhana. Your order #{orderId} is being processed.
                                        </p>
                                        <div className="pt-6 flex flex-col gap-3">
                                            <Link href="/orders" className="h-14 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center hover:bg-primary transition-all">
                                                Track Order
                                            </Link>
                                            <Link href="/" className="text-sm font-bold text-primary hover:underline">
                                                Return to Homepage
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Summary Section */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 premium-shadow space-y-6">
                                <h3 className="font-bold text-lg">Order Summary</h3>
                                <div className="space-y-4">
                                    {cart.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0">
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold line-clamp-1">{item.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">Qty: {item.quantity}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-4 border-t border-slate-100 space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span className="font-bold">₹{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Delivery</span>
                                        {deliveryFee === 0 ? (
                                            <span className="text-green-600 font-bold">Free</span>
                                        ) : (
                                            <span className="font-bold">₹{deliveryFee.toFixed(2)}</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-slate-100">
                                        <span className="font-bold">Total</span>
                                        <span className="text-lg font-bold text-primary">₹{total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex items-start gap-3">
                                <ShieldCheck className="text-primary flex-shrink-0" size={20} />
                                <p className="text-[10px] text-slate-600 leading-relaxed">
                                    Your personal information is secure. We verify all manual payments within 24 hours.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default CheckoutPage;
