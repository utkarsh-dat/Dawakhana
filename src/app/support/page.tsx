import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Footer from "@/components/Footer";
import CartState from "@/components/CartState";

export const metadata: Metadata = {
    title: "Customer Support & Contact",
    description: "Contact DawaKhana customer support for order and pharmacy assistance.",
};

export default function SupportPage() {
    return <div className="min-h-screen flex flex-col bg-slate-50"><CartState /><main className="flex-grow max-w-5xl mx-auto w-full px-6 py-12">
        <div className="max-w-2xl"><p className="font-bold uppercase tracking-wider text-primary">We are here to help</p><h1 className="mt-2 text-4xl font-bold">Customer support</h1><p className="mt-4 text-slate-600">Need help with an order, delivery, prescription upload, or account? Contact our team using any option below.</p></div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
            <a href="tel:+918707535798" className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1"><Phone className="text-primary" /><h2 className="mt-4 text-lg font-bold">Call us</h2><p className="mt-1 text-slate-600">+91 8707535798</p><p className="mt-2 text-sm text-slate-500">For urgent order and delivery queries.</p></a>
            <a href="mailto:dawakhana011@gmail.com" className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1"><Mail className="text-primary" /><h2 className="mt-4 text-lg font-bold">Email support</h2><p className="mt-1 text-slate-600">dawakhana011@gmail.com</p><p className="mt-2 text-sm text-slate-500">Include your order number for faster help.</p></a>
            <a href="https://instagram.com/dawakhana.011" target="_blank" rel="noopener noreferrer" className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1"><MessageCircle className="text-primary" /><h2 className="mt-4 text-lg font-bold">Social support</h2><p className="mt-1 text-slate-600">@dawakhana.011</p><p className="mt-2 text-sm text-slate-500">Send us a message on Instagram.</p></a>
            <div className="rounded-2xl bg-white p-6 shadow-sm"><MapPin className="text-primary" /><h2 className="mt-4 text-lg font-bold">Our location</h2><p className="mt-1 text-slate-600">Azad Nagar, Pakri Ka Pul</p><p className="mt-2 text-sm text-slate-500">Support hours and response times may vary.</p></div>
        </div>
    </main><Footer /></div>;
}
