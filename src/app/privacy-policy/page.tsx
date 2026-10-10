import type { Metadata } from "next";
import Footer from "@/components/Footer";
import CartState from "@/components/CartState";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "DawaKhana privacy policy and information handling practices.",
};

export default function PrivacyPolicyPage() {
    return <div className="min-h-screen flex flex-col bg-slate-50"><CartState /><main className="flex-grow max-w-4xl mx-auto w-full px-6 py-12">
        <p className="font-bold uppercase tracking-wider text-primary">DawaKhana</p><h1 className="mt-2 text-4xl font-bold">Privacy Policy</h1><p className="mt-3 text-sm text-slate-500">Last updated: October 10, 2026</p>
        <article className="mt-10 space-y-8 rounded-2xl bg-white p-6 leading-7 text-slate-700 shadow-sm md:p-10">
            <section><h2 className="mb-2 text-xl font-bold text-slate-900">Information we collect</h2><p>We may collect account details, delivery addresses, contact information, order details, payment references, and prescription documents needed to provide pharmacy services.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-slate-900">How we use information</h2><p>We use this information to process orders, verify prescriptions, deliver medicines, provide support, prevent fraud, and communicate important order updates.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-slate-900">Prescription and health information</h2><p>Prescription documents are treated as private and are restricted to the customer and authorized pharmacy staff. They are stored using protected access controls and time-limited viewing links where applicable.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-slate-900">Sharing and security</h2><p>We share only the information required with delivery, payment, and technology service providers. We use access controls and reasonable security measures, but no internet transmission can be guaranteed to be completely secure.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-slate-900">Your choices</h2><p>You may request access, correction, or deletion of eligible account information by contacting support. Some records may need to be retained for legal, safety, accounting, or transaction purposes.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-slate-900">Contact us</h2><p>For privacy questions, email <a className="font-semibold text-primary" href="mailto:utkarshparmar2367@gmail.com">utkarshparmar2367@gmail.com</a> or call +91 8707535798.</p></section>
        </article>
    </main><Footer /></div>;
}
