import React from "react";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
    return (
        <footer className="bg-slate-900 text-slate-300 pt-12 sm:pt-16 pb-6 sm:pb-8 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 mb-8 sm:mb-12">
                {/* Brand */}
                <div className="space-y-4 text-center sm:text-left">
                    <Link href="/" className="flex items-center gap-2 justify-center sm:justify-start">
                        <img
                            src="/images/logo.png"
                            alt="DawaKhana"
                            className="w-10 h-10 rounded-xl object-cover"
                        />
                        <span className="text-lg font-bold tracking-tight text-white">
                            Dawa<span className="text-primary">Khana</span>
                        </span>
                    </Link>
                    <p className="text-sm leading-relaxed max-w-xs mx-auto sm:mx-0">
                        Your trusted partner in health. Providing authentic medicines and wellness products delivered to your doorstep.
                    </p>
                    <div className="flex gap-4 justify-center sm:justify-start">
                        <Link href="https://facebook.com/dawakhana" target="_blank" rel="noopener noreferrer" className="p-2 hover:text-primary hover:bg-slate-800 rounded-lg transition-colors"><Facebook size={20} /></Link>
                        <Link href="https://x.com/Dawakhana011" target="_blank" rel="noopener noreferrer" className="p-2 hover:text-primary hover:bg-slate-800 rounded-lg transition-colors"><Twitter size={20} /></Link>
                        <Link href="https://instagram.com/dawakhana.011" target="_blank" rel="noopener noreferrer" className="p-2 hover:text-primary hover:bg-slate-800 rounded-lg transition-colors"><Instagram size={20} /></Link>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="text-center sm:text-left">
                    <h4 className="text-white font-semibold mb-4 sm:mb-6">Quick Links</h4>
                    <ul className="space-y-3 sm:space-y-4 text-sm">
                        <li><Link href="/#catalog" className="hover:text-primary transition-colors">Medicine Catalog</Link></li>
                        <li><Link href="/orders" className="hover:text-primary transition-colors">My Orders</Link></li>
                        <li><Link href="/checkout" className="hover:text-primary transition-colors">Cart & Checkout</Link></li>
                        <li><Link href="/how-it-works" className="hover:text-primary transition-colors">How It Works</Link></li>
                        <li><Link href="/support" className="hover:text-primary transition-colors">Customer Support</Link></li>
                        <li><Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                        <li><Link href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
                        <li><Link href="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</Link></li>
                        <li><Link href="/medical-disclaimer" className="hover:text-primary transition-colors">Medical Disclaimer</Link></li>
                    </ul>
                </div>

                {/* Contact */}
                <div className="space-y-3 sm:space-y-4 text-center sm:text-left sm:col-span-2 lg:col-span-1">
                    <h4 className="text-white font-semibold mb-4 sm:mb-6">Contact Us</h4>
                    <div className="flex items-center gap-3 text-sm justify-center sm:justify-start">
                        <Phone size={18} className="text-primary flex-shrink-0" />
                        <span>+91 8707535798</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm justify-center sm:justify-start">
                        <Mail size={18} className="text-primary flex-shrink-0" />
                        <span>dawakhana011@gmail.com</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm justify-center sm:justify-start">
                        <MapPin size={18} className="text-primary flex-shrink-0" />
                        <span>Azad Nagar, Pakri Ka Pul</span>
                    </div>
                    <a 
                        href="https://instagram.com/dawakhana.011" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-3 text-sm justify-center sm:justify-start hover:text-primary transition-colors group"
                    >
                        <Instagram size={18} className="text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
                        <span>@dawakhana.011</span>
                    </a>
                </div>
            </div>

            <div className="max-w-7xl mx-auto pt-6 sm:pt-8 border-t border-slate-800 text-center text-xs">
                <p>© {new Date().getFullYear()} DawaKhana Online Pharmacy. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
