"use client";

import React, { useState } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, writeBatch, setDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { medicines as staticMedicines } from "@/lib/medicines";
import { COLLECTIONS } from "@/lib/db/connection";
import { Play, Database, ShieldCheck, Key, LogOut, Terminal } from "lucide-react";
import Link from "next/link";

export default function SeedPage() {
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    const log = (msg: string) => {
        setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    const handleAuth = async () => {
        setLoading(true);
        const email = "seeder-admin@dawakhana.com";
        const password = "TemporarySeederPassword123!";
        log(`Attempting to sign in as ${email}...`);

        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            log(`Successfully signed in. UID: ${cred.user.uid}`);
            
            // Set role to admin in Firestore
            log("Configuring administrator privileges in users collection...");
            const userRef = doc(db, COLLECTIONS.USERS, cred.user.uid);
            await setDoc(userRef, {
                email: cred.user.email || "",
                displayName: "Seeder Admin",
                role: "admin",
                isActive: true,
                updatedAt: new Date().toISOString()
            });
            log("Admin role successfully written to user profile!");
            
            setUserEmail(cred.user.email);
        } catch (signInErr: any) {
            log(`Sign-in failed: ${signInErr.message}`);
            if (signInErr.code === "auth/user-not-found" || signInErr.code === "auth/invalid-credential") {
                try {
                    log("Creating new seeder account...");
                    const cred = await createUserWithEmailAndPassword(auth, email, password);
                    log(`Successfully registered and signed in. UID: ${cred.user.uid}`);
                    
                    // Set role to admin in Firestore
                    log("Configuring administrator privileges in users collection...");
                    const userRef = doc(db, COLLECTIONS.USERS, cred.user.uid);
                    await setDoc(userRef, {
                        email: cred.user.email || "",
                        displayName: "Seeder Admin",
                        role: "admin",
                        isActive: true,
                        updatedAt: new Date().toISOString()
                    });
                    log("Admin role successfully written to user profile!");

                    setUserEmail(cred.user.email);
                } catch (createErr: any) {
                    log(`Account creation failed: ${createErr.message}`);
                    alert(`Auth Error: ${createErr.message}`);
                }
            } else {
                alert(`Auth Error: ${signInErr.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        try {
            await signOut(auth);
            log("Signed out successfully.");
            setUserEmail(null);
        } catch (err: any) {
            log(`Sign out error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSeed = async () => {
        if (!db) {
            log("Error: Database not initialized!");
            return;
        }

        setLoading(true);
        log("Testing authenticated read query on 'medicines' collection...");
        try {
            const { getDocs, collection, limit, query } = await import("firebase/firestore");
            const testQuery = query(collection(db, COLLECTIONS.MEDICINES), limit(1));
            const testSnap = await getDocs(testQuery);
            log(`Read test successful! Collection contains ${testSnap.empty ? "0" : "some"} documents.`);
        } catch (readErr: any) {
            log(`Read test failed: ${readErr.message}`);
        }

        log(`Starting client-side database seeding for ${staticMedicines.length} items...`);

        try {
            let batch = writeBatch(db);
            let count = 0;
            let batchCount = 1;

            for (const med of staticMedicines) {
                const medRef = doc(db, COLLECTIONS.MEDICINES, med.id);

                // Determine prescription requirement based on category
                const requiresPrescription = [
                    "Prescriptions",
                    "Psychiatric",
                    "Cardiac",
                    "Diabetic"
                ].includes(med.category);

                // Generate realistic stock, batch, and expiry
                const stock = Math.floor(Math.random() * 45) + 5; // 5 to 50 items
                const batchNo = `BCH-${Math.random().toString(36).substring(3, 9).toUpperCase()}`;
                
                const expiry = new Date();
                expiry.setMonth(expiry.getMonth() + Math.floor(Math.random() * 18) + 6); // 6 to 24 months from now

                const seedDoc = {
                    name: med.name,
                    brand: "DawaKhana Premium",
                    category: med.category,
                    price: med.price,
                    stock,
                    requiresPrescription,
                    expiryDate: expiry.toISOString().split("T")[0],
                    batchNumber: batchNo,
                    description: med.description,
                    image: med.image,
                    rating: med.rating || 4.5,
                    reviews: med.reviews || 0,
                    inStock: stock > 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                batch.set(medRef, seedDoc);
                count++;

                // Commit batch if we hit 400 documents (limit is 500)
                if (count % 400 === 0) {
                    log(`Committing batch ${batchCount} (items ${count - 399} - ${count})...`);
                    await batch.commit();
                    log(`Batch ${batchCount} committed successfully.`);
                    batch = writeBatch(db);
                    batchCount++;
                }
            }

            // Commit any remaining writes
            if (count % 400 !== 0) {
                log(`Committing final batch (items ${Math.floor(count / 400) * 400 + 1} - ${count})...`);
                await batch.commit();
                log("Final batch committed successfully.");
            }

            log(`Seeding complete! Successfully uploaded ${count} medicines to Firestore.`);
            alert(`Seeding completed successfully! ${count} items added.`);
        } catch (error: any) {
            log(`Seeding failed: ${error.message}`);
            console.error("Seeding error:", error);
            alert(`Seeding Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950">
            <div className="max-w-3xl w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                            <Database size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-white">Database Seeder</h1>
                            <p className="text-sm text-slate-400">Initialize Dawakhana Firestore Collection</p>
                        </div>
                    </div>
                    <Link href="/admin" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold border border-indigo-500/20 hover:border-indigo-500/40 bg-indigo-500/5 px-4 py-2 rounded-xl transition-all">
                        Go to Dashboard
                    </Link>
                </div>

                {/* Control Panel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Step 1: Authentication */}
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                                <ShieldCheck size={16} />
                                <span>Step 1: Auth Status</span>
                            </div>
                            <h2 className="text-lg font-bold text-white">Authentication</h2>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Firestore security rules require an authenticated session to execute write queries.
                            </p>
                        </div>

                        {userEmail ? (
                            <div className="space-y-3">
                                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl flex items-center justify-between">
                                    <span className="text-xs font-semibold truncate max-w-[180px]">{userEmail}</span>
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    disabled={loading}
                                    className="w-full h-11 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-700/50 transition-all disabled:opacity-50"
                                >
                                    <LogOut size={14} />
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleAuth}
                                disabled={loading}
                                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                <Key size={16} />
                                Register & Sign In
                            </button>
                        )}
                    </div>

                    {/* Step 2: Write Seeding */}
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                                <Database size={16} />
                                <span>Step 2: Seed Database</span>
                            </div>
                            <h2 className="text-lg font-bold text-white">Execute Seeding</h2>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Uploads medicine catalog items to Firestore. Make sure to authenticate first.
                            </p>
                        </div>

                        <button
                            onClick={handleSeed}
                            disabled={loading || !userEmail}
                            className="w-full h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Play size={16} />
                            Seed Medicines Collection
                        </button>
                    </div>
                </div>

                {/* Console Log terminal */}
                <div className="bg-black/40 border border-slate-800/80 rounded-2xl p-6 space-y-3 font-mono">
                    <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-900 pb-2">
                        <div className="flex items-center gap-2">
                            <Terminal size={14} />
                            <span>System Console Output</span>
                        </div>
                        <button
                            onClick={() => setLogs([])}
                            className="hover:text-white transition-colors"
                        >
                            Clear Logs
                        </button>
                    </div>

                    <div className="h-48 overflow-y-auto space-y-1.5 text-xs text-slate-300 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                        {logs.length === 0 ? (
                            <p className="text-slate-600 italic">Waiting for operations to start...</p>
                        ) : (
                            logs.map((item, idx) => (
                                <p key={idx} className="leading-relaxed whitespace-pre-wrap">{item}</p>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
