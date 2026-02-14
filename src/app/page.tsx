import Link from "next/link";
import CartState from "@/components/CartState";
import HeroSection from "@/components/HeroSection";
import CatalogGrid from "@/components/CatalogGrid";
import Footer from "@/components/Footer";
import { ShieldCheck, Truck, Clock, Award } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <CartState />

      <main className="flex-grow">
        <HeroSection />

        {/* Features Section */}
        <section className="py-12 bg-white border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-primary">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h4 className="font-bold">100% Authentic</h4>
                  <p className="text-xs text-muted-foreground">Original Medicines</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                  <Truck size={28} />
                </div>
                <div>
                  <h4 className="font-bold">Free Delivery</h4>
                  <p className="text-xs text-muted-foreground">Orders over ₹200</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                  <Award size={28} />
                </div>
                <div>
                  <h4 className="font-bold">Top Rated</h4>
                  <p className="text-xs text-muted-foreground">500k+ Reviews</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                    <Clock size={28} />
                  </div>
                  <div>
                    <h4 className="font-bold">Fast Service</h4>
                    <p className="text-xs text-muted-foreground">Express Delivery</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <CatalogGrid limit={12} />

        {/* Prescription Banner */}
        <section className="max-w-7xl mx-auto px-6 mb-20">
          <div className="relative rounded-[2.5rem] bg-slate-900 overflow-hidden p-8 md:p-16">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />
            <div className="relative z-10 max-w-2xl space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                Upload Prescription & <br /> Get Your Medicines
              </h2>
              <p className="text-slate-400 text-lg">
                Our expert pharmacists will review your prescription and prepare your order within minutes.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/upload-prescription" className="px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20">
                  Upload Now
                </Link>
                <button className="px-8 py-4 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition-colors backdrop-blur-md">
                  How it Works
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
