import type { Metadata } from "next";
import CartState from "@/components/CartState";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
    title: "Medical Disclaimer",
    description: "Important medical and medication-use disclaimer from DawaKhana.",
};

export default function MedicalDisclaimerPage() {
    return <div className="min-h-screen flex flex-col bg-slate-50"><CartState /><main className="flex-grow max-w-4xl mx-auto w-full px-6 py-12">
        <p className="font-bold uppercase tracking-wider text-primary">Important health information</p><h1 className="mt-2 text-4xl font-bold">Medical Disclaimer</h1><p className="mt-3 text-sm text-slate-500">Last updated: October 10, 2026</p>
        <article className="mt-10 space-y-8 rounded-2xl bg-white p-6 leading-7 text-slate-700 shadow-sm md:p-10">
            <section><h2 className="mb-2 text-xl font-bold text-slate-900">Not medical advice</h2><p>Information on this website, including product descriptions, dosage guidance, chatbot responses, and prescription-recognition results, is for general information only. It is not a diagnosis, prescription, or substitute for advice from a qualified healthcare professional.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-slate-900">Use medicines safely</h2><p>Always follow the label and your doctor or pharmacist&apos;s instructions. Do not start, stop, combine, or change medicines based only on website content. Check allergies, interactions, age restrictions, pregnancy considerations, and contraindications with a professional.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-slate-900">Urgent conditions</h2><p>For an emergency, severe reaction, overdose, or rapidly worsening symptoms, contact local emergency services or visit the nearest emergency department immediately.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-slate-900">Prescription review</h2><p>Prescription uploads and automated recognition are support tools. Pharmacist review is required where applicable, and recognition results should never be treated as a confirmed prescription or diagnosis.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-slate-900">Questions</h2><p>For order support, contact +91 8707535798. For medical advice, consult a licensed healthcare professional.</p></section>
        </article>
    </main><Footer /></div>;
}
