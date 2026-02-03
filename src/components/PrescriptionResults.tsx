"use client";

import React, { useState } from "react";
import { Medicine, medicines } from "@/lib/medicines";
import { useCart } from "@/context/CartContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, increment, serverTimestamp } from "firebase/firestore";
import { Check, AlertCircle, ShoppingCart, Plus, Edit2, X } from "lucide-react";
import { motion } from "framer-motion";

interface PrescriptionResultsProps {
    recognizedNames: string[];
    onReset: () => void;
}

// Check if a name looks like a real medicine (simplified - more lenient)
function looksLikeMedicine(name: string): boolean {
    const cleaned = name.toLowerCase().trim();

    // Too short or too long
    if (cleaned.length < 3 || cleaned.length > 50) return false;

    // Must contain at least one letter
    if (!/[a-zA-Z]/.test(cleaned)) return false;

    // Reject obvious non-medicine words
    const nonMedicinePatterns = [
        /^(doctor|patient|name|date|address|hospital|clinic|pharmacy|rx|sig)/i,
        /^(mr|mrs|ms|dr|prof|sir|madam)/i,
        /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
        /^(january|february|march|april|may|june|july|august)/i,
        /^(the|and|or|for|with|take|use|apply|give)$/i,
    ];

    for (const pattern of nonMedicinePatterns) {
        if (pattern.test(cleaned)) return false;
    }

    // Accept most other entries
    return true;
}

// Log missing medicine to Firebase for admin tracking
async function logMissingMedicine(medicineName: string) {
    console.log("logMissingMedicine called with:", medicineName);

    if (!db) {
        console.log("Firebase db not available");
        return;
    }

    // Check if it looks like a medicine
    if (!looksLikeMedicine(medicineName)) {
        console.log(`Skipping "${medicineName}" - doesn't look like a medicine`);
        return;
    }

    try {
        const docId = medicineName.toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 100);
        const docRef = doc(db, "missingMedicineRequests", docId);

        await setDoc(docRef, {
            name: medicineName,
            count: increment(1),
            lastRequested: serverTimestamp(),
        }, { merge: true });

        console.log(`✅ Logged missing medicine: "${medicineName}"`);
    } catch (error) {
        console.error("Failed to log missing medicine:", error);
    }
}

export default function PrescriptionResults({ recognizedNames, onReset }: PrescriptionResultsProps) {
    const { addToCart } = useCart();
    const [selectedItems, setSelectedItems] = useState<Medicine[]>([]);
    const [requestedItems, setRequestedItems] = useState<string[]>([]);  // For Not Found medicines
    const [editedNames, setEditedNames] = useState<string[]>(recognizedNames);
    const [isEditing, setIsEditing] = useState(false);
    const [newMedicine, setNewMedicine] = useState("");

    // Match recognized names to catalog with fuzzy search
    const matches = editedNames.map((name) => {
        const normalizedName = name.toLowerCase().trim();

        // Remove common suffixes for better matching
        const cleanName = normalizedName.replace(/\s*(mg|ml|sr|xr|xl|tablet|cap|syrup|injection)\s*/gi, " ").trim();

        // Find best match - try multiple strategies
        let match = medicines.find(m => m.name.toLowerCase() === normalizedName);

        if (!match) {
            match = medicines.find(m => m.name.toLowerCase().includes(cleanName) || cleanName.includes(m.name.toLowerCase()));
        }

        if (!match) {
            // Try matching just the first word (brand name)
            const firstWord = cleanName.split(/\s+/)[0];
            if (firstWord.length > 3) {
                match = medicines.find(m => m.name.toLowerCase().startsWith(firstWord));
            }
        }

        return {
            searchedName: name,
            found: !!match,
            medicine: match
        };
    });

    const toggleSelection = (medicine: Medicine) => {
        if (selectedItems.find(i => i.id === medicine.id)) {
            setSelectedItems(prev => prev.filter(i => i.id !== medicine.id));
        } else {
            setSelectedItems(prev => [...prev, medicine]);
        }
    };

    // Toggle selection for Not Found medicines
    const toggleRequest = (medicineName: string) => {
        if (requestedItems.includes(medicineName)) {
            setRequestedItems(prev => prev.filter(n => n !== medicineName));
        } else {
            setRequestedItems(prev => [...prev, medicineName]);
        }
    };

    const handleAddAllToCart = async () => {
        // Add selected items to cart
        selectedItems.forEach(item => addToCart(item));

        // Log only SELECTED missing medicines to Firebase for admin
        for (const medicineName of requestedItems) {
            await logMissingMedicine(medicineName);
        }

        const message = [];
        if (selectedItems.length > 0) message.push(`Added ${selectedItems.length} items to cart`);
        if (requestedItems.length > 0) message.push(`Requested ${requestedItems.length} medicines`);
        alert(message.join('. ') || 'Done!');
        onReset();
    };

    const handleRemoveName = (index: number) => {
        setEditedNames(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddName = () => {
        if (newMedicine.trim()) {
            setEditedNames(prev => [...prev, newMedicine.trim()]);
            setNewMedicine("");
        }
    };

    const handleEditName = (index: number, newValue: string) => {
        setEditedNames(prev => prev.map((name, i) => i === index ? newValue : name));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-2xl font-bold">Prescription Results</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 transition-colors ${isEditing ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                    >
                        <Edit2 size={14} /> {isEditing ? "Done Editing" : "Edit Names"}
                    </button>
                    <button onClick={onReset} className="text-sm text-muted-foreground hover:text-foreground">
                        Analyze Another
                    </button>
                </div>
            </div>

            {/* Editing Instructions */}
            {isEditing && (
                <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-sm">
                    <p className="font-semibold mb-2">✏️ Edit Mode Active</p>
                    <p>Click on medicine names to edit them. Remove incorrect entries or add missing ones below.</p>
                </div>
            )}

            {/* Add new medicine when editing */}
            {isEditing && (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMedicine}
                        onChange={(e) => setNewMedicine(e.target.value)}
                        placeholder="Add missing medicine name..."
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                        onKeyDown={(e) => e.key === "Enter" && handleAddName()}
                    />
                    <button
                        onClick={handleAddName}
                        className="px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {matches.map((item, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`p-4 rounded-xl border ${item.found ? "border-green-200 bg-green-50/20" : "border-orange-200 bg-orange-50/20"
                            }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            {isEditing ? (
                                <div className="flex items-center gap-2 flex-1">
                                    <input
                                        type="text"
                                        value={item.searchedName}
                                        onChange={(e) => handleEditName(idx, e.target.value)}
                                        className="flex-1 px-2 py-1 text-sm border border-slate-200 rounded focus:border-primary outline-none"
                                    />
                                    <button
                                        onClick={() => handleRemoveName(idx)}
                                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <span className="text-sm font-medium text-muted-foreground">
                                    Detected: <span className="text-foreground font-semibold">{item.searchedName}</span>
                                </span>
                            )}
                            {!isEditing && (
                                item.found ? (
                                    <div className="flex items-center text-green-600 text-xs font-bold gap-1">
                                        <Check size={14} /> Available
                                    </div>
                                ) : (
                                    <div className="flex items-center text-orange-600 text-xs font-bold gap-1">
                                        <AlertCircle size={14} /> Not Found
                                    </div>
                                )
                            )}
                        </div>

                        {item.found && item.medicine && (
                            <div className="mt-3 bg-white p-3 rounded-lg shadow-sm">
                                <div className="flex gap-3">
                                    <img
                                        src={item.medicine.image}
                                        alt={item.medicine.name}
                                        className="w-12 h-12 object-cover rounded-md"
                                    />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm">{item.medicine.name}</h4>
                                        <p className="text-primary font-bold text-sm">₹{item.medicine.price}</p>
                                    </div>
                                    <button
                                        onClick={() => toggleSelection(item.medicine!)}
                                        className={`h-8 w-8 flex items-center justify-center rounded-full transition-colors ${selectedItems.find(i => i.id === item.medicine!.id)
                                            ? "bg-primary text-white"
                                            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                            }`}
                                    >
                                        <Check size={16} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Not Found - Request option */}
                        {!item.found && !isEditing && (
                            <div className="mt-3 bg-orange-50 border border-orange-200 p-3 rounded-lg">
                                <div className="flex gap-3 items-center">
                                    <div className="w-12 h-12 bg-orange-100 rounded-md flex items-center justify-center">
                                        <AlertCircle className="text-orange-500" size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm text-orange-800">{item.searchedName}</h4>
                                        <p className="text-orange-600 text-xs">Not in stock - Request this medicine</p>
                                    </div>
                                    <button
                                        onClick={() => toggleRequest(item.searchedName)}
                                        className={`h-8 w-8 flex items-center justify-center rounded-full transition-colors ${requestedItems.includes(item.searchedName)
                                            ? "bg-orange-500 text-white"
                                            : "bg-orange-100 text-orange-400 hover:bg-orange-200"
                                            }`}
                                    >
                                        <Plus size={16} className={requestedItems.includes(item.searchedName) ? "rotate-45" : ""} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Summary / Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 flex items-center justify-between sm:static sm:bg-transparent sm:border-0 sm:block sm:mt-8">
                <div className="hidden sm:block text-muted-foreground mb-4">
                    {selectedItems.length > 0 && requestedItems.length > 0
                        ? `${selectedItems.length} to cart, ${requestedItems.length} to request`
                        : selectedItems.length > 0
                            ? `${selectedItems.length} items selected`
                            : requestedItems.length > 0
                                ? `${requestedItems.length} medicine(s) selected to request`
                                : "Select items to add to cart or request"
                    }
                </div>

                <button
                    onClick={handleAddAllToCart}
                    disabled={selectedItems.length === 0 && requestedItems.length === 0}
                    className="w-full sm:w-auto px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                >
                    <ShoppingCart size={20} />
                    {requestedItems.length > 0 && selectedItems.length === 0
                        ? "Request Selected Medicines"
                        : requestedItems.length > 0
                            ? "Add to Cart & Request"
                            : "Add Selected to Cart"}
                </button>
            </div>
        </div>
    );
}
