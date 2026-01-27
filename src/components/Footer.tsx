import React from "react";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
    return (
        <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                {/* Brand */}
                <div className="space-y-4">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">D</span>
                        </div>
                        <span className="text-lg font-bold tracking-tight text-white">
                            Dawa<span className="text-primary">Khana</span>
                        </span>
                    </Link>
                    <p className="text-sm leading-relaxed">
                        Your trusted partner in health. Providing authentic medicines and wellness products delivered to your doorstep.
                    </p>
                    <div className="flex gap-4">
                        <Link href="#" className="hover:text-primary transition-colors"><Facebook size={20} /></Link>
                        <Link href="#" className="hover:text-primary transition-colors"><Twitter size={20} /></Link>
                        <Link href="#" className="hover:text-primary transition-colors"><Instagram size={20} /></Link>
                    </div>
                </div>

                {/* Quick Links */}
                <div>
                    <h4 className="text-white font-semibold mb-6">Quick Links</h4>
                    <ul className="space-y-4 text-sm">
                        <li><Link href="/#catalog" className="hover:text-primary transition-colors">Medicine Catalog</Link></li>
                        <li><Link href="/orders" className="hover:text-primary transition-colors">My Orders</Link></li>
                        <li><Link href="/checkout" className="hover:text-primary transition-colors">Cart & Checkout</Link></li>
                    </ul>
                </div>

                {/* Contact */}
                <div className="space-y-4">
                    <h4 className="text-white font-semibold mb-6">Contact Us</h4>
                    <div className="flex items-start gap-3 text-sm">
                        <Phone size={18} className="text-primary flex-shrink-0" />
                        <span>+91 6394664907</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                        <Mail size={18} className="text-primary flex-shrink-0" />
                        <span>Dawakhana011@gmail.com</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                        <MapPin size={18} className="text-primary flex-shrink-0" />
                        <span>Azad Nagar, Pakri Ka Pul</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 text-center text-xs">
                <p>© {new Date().getFullYear()} DawaKhana Online Pharmacy. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
