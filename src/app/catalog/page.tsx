import { Metadata } from "next";
import CatalogGrid from "@/components/CatalogGrid";
import Footer from "@/components/Footer";
import CartState from "@/components/CartState";

export const metadata: Metadata = {
    title: "Medicine Catalog - Browse All Medicines",
    description: "Browse our complete collection of authentic medicines. Cardiac, diabetic, and psychiatric medicines at best prices. Filter by category and search for specific medicines.",
    openGraph: {
        title: "Medicine Catalog | DawaKhana",
        description: "Browse our complete collection of authentic medicines at best prices.",
    },
};
export default function CatalogPage() {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <CartState />
            <main className="flex-grow pt-8">
                <div className="max-w-7xl mx-auto px-6 mb-8">
                    <h1 className="text-4xl font-bold">Full Catalog</h1>
                    <p className="text-muted-foreground mt-2">Browse our complete collection of medicines.</p>
                </div>
                <CatalogGrid />
            </main>
            <Footer />
        </div>
    );
}
