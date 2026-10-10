/**
 * GET /api/v1/medicines — Search medicine inventory (Public)
 * 
 * Query params: ?search=<term>&category=<cat>&rxOnly=<bool>&inStock=<bool>
 */

import { NextRequest, NextResponse } from "next/server";
import { searchMedicines } from "@/lib/db/medicines.service";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || undefined;
        const category = searchParams.get("category") || undefined;
        const rxOnly = searchParams.get("rxOnly");
        const inStock = searchParams.get("inStock");
        const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);

        const medicines = await searchMedicines({
            search,
            category,
            requiresPrescription: rxOnly === "true" ? true : rxOnly === "false" ? false : undefined,
            inStockOnly: inStock === "true",
            pageSize: Math.min(pageSize, 200), // Cap at 200
        });

        return NextResponse.json({
            success: true,
            count: medicines.length,
            data: medicines,
        });
    } catch (error: any) {
        console.error("API /v1/medicines error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
