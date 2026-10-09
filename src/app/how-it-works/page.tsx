import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle, ClipboardList, FileText, ShieldCheck, Truck, UserRoundCheck } from "lucide-react";
import CartState from "@/components/CartState";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
    title: "How It Works",
    description: "Learn how DawaKhana prescription upload, pharmacist review, and delivery work.",
};

const steps = [
    {
        icon: FileText,
        number: "01",
        title: "Upload your prescription",
        description: "Upload a clear prescription image or enter the medicine details. Your prescription is handled through protected access controls.",
        href: "/upload-prescription",
        action: "Upload prescription",
    },
    {
        icon: UserRoundCheck,
        number: "02",
        title: "Pharmacist review",
        description: "Our pharmacy team reviews prescription medicines, confirms the order details, and contacts you if clarification is needed.",
        href: "/prescriptions",
        action: "View prescription status",
    },
    {
        icon: Truck,
        number: "03",
        title: "Secure delivery",
        description: "Once approved and packed, your order is handed to delivery and you can follow its progress from your orders page.",
        href: "/orders",
        action: "Track my orders",
    },
];

export default function HowItWorksPage() {
    return <div className="min-h-screen flex flex-col bg-slate-50">
        <CartState />
        <main className="flex-grow">
            <section className="bg-slate-900 px-6 py-16 text-center text-white md:py-24">
                <p className="font-bold uppercase tracking-wider text-primary">Simple, safe, and transparent</p>
                <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-bold md:text-6xl">How DawaKhana works</h1>
                <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">From prescription upload to doorstep delivery, our process keeps your order clear and your health information protected.</p>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
                <div className="grid gap-6 md:grid-cols-3">
                    {steps.map(({ icon: Icon, number, title, description, href, action }) => (
                        <article key={number} className="relative rounded-3xl bg-white p-7 shadow-sm">
                            <span className="text-sm font-bold text-primary">{number}</span>
                            <div className="mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon size={28} /></div>
                            <h2 className="mt-6 text-2xl font-bold text-slate-900">{title}</h2>
                            <p className="mt-3 leading-7 text-slate-600">{description}</p>
                            <Link href={href} className="mt-6 inline-flex items-center gap-2 font-semibold text-primary hover:text-primary-hover">{action}<ArrowRight size={18} /></Link>
                        </article>
                    ))}
                </div>

                <div className="mt-12 grid gap-5 rounded-3xl bg-white p-7 shadow-sm md:grid-cols-3 md:p-10">
                    <div className="flex gap-4"><ShieldCheck className="shrink-0 text-primary" /><div><h3 className="font-bold text-slate-900">Private prescriptions</h3><p className="mt-1 text-sm leading-6 text-slate-600">Prescription documents are available only to you and authorized pharmacy staff.</p></div></div>
                    <div className="flex gap-4"><ClipboardList className="shrink-0 text-primary" /><div><h3 className="font-bold text-slate-900">Clear order updates</h3><p className="mt-1 text-sm leading-6 text-slate-600">See review, preparation, shipping, and delivery updates in your order history.</p></div></div>
                    <div className="flex gap-4"><CheckCircle className="shrink-0 text-primary" /><div><h3 className="font-bold text-slate-900">Pharmacist guidance</h3><p className="mt-1 text-sm leading-6 text-slate-600">Prescription medicines are reviewed before the order is prepared.</p></div></div>
                </div>

                <div className="mt-12 rounded-3xl bg-primary px-6 py-10 text-center text-white md:px-10">
                    <h2 className="text-2xl font-bold md:text-3xl">Ready to get started?</h2>
                    <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">Upload your prescription and let our pharmacy team help prepare your order.</p>
                    <Link href="/upload-prescription" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-primary hover:bg-slate-100">Upload prescription <ArrowRight size={18} /></Link>
                </div>
            </section>
        </main>
        <Footer />
    </div>;
}
