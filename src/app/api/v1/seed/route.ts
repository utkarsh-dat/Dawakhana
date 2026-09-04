/**
 * GET /api/v1/seed — Seed the medicines collection in Firestore (Public/Developer utility)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { doc, setDoc, writeBatch, collection, getDocs, limit, query } from "firebase/firestore";
import { medicines as staticMedicines } from "@/lib/medicines";
import { COLLECTIONS } from "@/lib/db/connection";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export async function GET(request: NextRequest) {
    let authStatus = "Not attempted";
    let authError: any = null;

    try {
        if (!db) {
            return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
        }

        // Try to authenticate the server-side connection using Email/Password auth
        if (auth) {
            const email = "seeder-admin@dawakhana.com";
            const password = "TemporarySeederPassword123!";
            try {
                console.log("Attempting server-side sign-in with seeder account...");
                const cred = await signInWithEmailAndPassword(auth, email, password);
                console.log("Seeder sign-in successful. UID:", cred.user.uid);
                authStatus = `Success (Signed In): UID = ${cred.user.uid}`;
            } catch (signInErr: any) {
                if (signInErr.code === "auth/user-not-found" || signInErr.code === "auth/invalid-credential") {
                    try {
                        console.log("Seeder account not found. Attempting to create seeder account...");
                        const cred = await createUserWithEmailAndPassword(auth, email, password);
                        console.log("Seeder account creation successful. UID:", cred.user.uid);
                        authStatus = `Success (Created): UID = ${cred.user.uid}`;
                    } catch (createErr: any) {
                        console.warn("Seeder account creation failed:", createErr.message);
                        authStatus = "Failed (Sign-in & Creation)";
                        authError = { message: createErr.message, code: createErr.code };
                    }
                } else {
                    console.warn("Seeder sign-in failed:", signInErr.message);
                    authStatus = "Failed (Sign-in)";
                    authError = { message: signInErr.message, code: signInErr.code };
                }
            }
        }

        // Quick check to see if database already has medicines to prevent accidental overwrite
        const checkQuery = query(collection(db, COLLECTIONS.MEDICINES), limit(1));
        const checkSnap = await getDocs(checkQuery);

        // Allow force seeding if query param `force=true` is set
        const { searchParams } = new URL(request.url);


        const force = searchParams.get("force") === "true";

        if (!checkSnap.empty && !force) {
            return NextResponse.json({
                success: true,
                message: "Database already contains medicine listings. Seeding skipped. Use ?force=true to overwrite.",
                count: checkSnap.size
            });
        }

        console.log(`Starting seeding process for ${staticMedicines.length} medicines...`);

        // Batch writes can handle up to 500 documents per batch
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
                console.log(`Committing batch ${batchCount}...`);
                await batch.commit();
                batch = writeBatch(db);
                batchCount++;
            }
        }

        // Commit any remaining writes
        if (count % 400 !== 0) {
            console.log(`Committing final batch...`);
            await batch.commit();
        }

        return NextResponse.json({
            success: true,
            message: `Successfully seeded ${count} medicines into Firestore collection '${COLLECTIONS.MEDICINES}'.`,
            details: {
                totalSeeded: count,
                categoriesSeeded: Array.from(new Set(staticMedicines.map(m => m.category)))
            }
        });

    } catch (error: any) {
        console.error("Seeding API error:", error);
        return NextResponse.json(
            { 
                success: false, 
                error: error.message,
                authStatus,
                authError
            },
            { status: 500 }
        );
    }
}
