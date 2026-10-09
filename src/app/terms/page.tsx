import type { Metadata } from "next";
import CartState from "@/components/CartState";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
    title: "Terms and Conditions",
    description: "Terms and conditions for using DawaKhana online pharmacy services.",
};

export default function TermsPage() {
    return <div className="min-h-screen flex flex-col bg-slate-50"><CartState /><main className="flex-grow max-w-4xl mx-auto w-full px-6 py-12">
        <p className="font-bold uppercase tracking-wider text-primary">DawaKhana</p><h1 className="mt-2 text-4xl font-bold">Terms and Conditions</h1><p className="mt-3 text-sm text-slate-500">Last updated: October 10, 2026</p>
        <article className="mt-10 space-y-8 rounded-2xl bg-white p-6 leading-7 text-slate-700 shadow-sm md:p-10">
            <section><h2 className="mb-2 text-xl font-bold text-slate-900">Use of the service</h2><p>By using DawaKhana, you agree to provide accurate account, delivery, and prescription information and to use the service only for lawful purposes.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-slate-900">Orders and prescriptions</h2><p>Orders are subject to product availability, prescription review where required, address validation, and confirmation by DawaKhana. A prescription medicine must not be purchased or used without appropriate professional guidance.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-slate-900">Pricing and payment</h2><p>Prices, delivery charges, and availability may change. You agree to provide valid payment information and authorize us to process the selected payment method for confirmed orders.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-slate-900">Delivery and cancellation</h2><p>Delivery estimates are indicative and may be affected by courier or location conditions. Cancellation, return, and refund requests are handled under the applicable policies shown on this website.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-slate-900">Account responsibility</h2><p>You are responsible for maintaining the security of your account and for activity performed through it. Contact support promptly if you notice unauthorized activity.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-slate-900">Contact</h2><p>Questions about these terms can be sent to <a className="font-semibold text-primary" href="mailto:utkarshparmar2367@gmail.com">utkarshparmar2367@gmail.com</a>.</p></section>
        </article>
    </main><Footer /></div>;
}
