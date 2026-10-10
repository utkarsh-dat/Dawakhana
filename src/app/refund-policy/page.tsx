import type { Metadata } from "next";
import CartState from "@/components/CartState";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
    title: "Refund Policy",
    description: "DawaKhana cancellation, return, and refund policy.",
};

export default function RefundPolicyPage() {
    return <div className="min-h-screen flex flex-col bg-slate-50"><CartState /><main className="flex-grow max-w-4xl mx-auto w-full px-6 py-12">
        <p className="font-bold uppercase tracking-wider text-primary">DawaKhana</p><h1 className="mt-2 text-4xl font-bold">Refund Policy</h1><p className="mt-3 text-sm text-slate-500">Last updated: October 10, 2026</p>
        <article className="mt-10 space-y-8 rounded-2xl bg-white p-6 leading-7 text-slate-700 shadow-sm md:p-10">
            <section><h2 className="mb-2 text-xl font-bold text-slate-900">Cancellation</h2><p>Customers may cancel eligible orders before shipment through the My Orders page. Once an order has shipped, cancellation may no longer be available.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-slate-900">Returns</h2><p>Return requests may be submitted for eligible delivered orders. Include the order number and a clear reason. Medicines that have been opened, used, damaged after delivery, or stored improperly may not qualify for return.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-slate-900">Refund review</h2><p>Each request is reviewed by our support or pharmacy team. Approved refunds are issued to the original payment method where possible. Cash-on-delivery refunds may require additional payment details.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-slate-900">Damaged or incorrect items</h2><p>Contact support as soon as possible with your order number and photographs of the package or item. Do not use a damaged or incorrect medicine.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-slate-900">Contact support</h2><p>Call +91 8707535798 or email <a className="font-semibold text-primary" href="mailto:dawakhana011@gmail.com">dawakhana011@gmail.com</a> for assistance.</p></section>
        </article>
    </main><Footer /></div>;
}
