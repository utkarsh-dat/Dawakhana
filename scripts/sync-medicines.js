const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY before syncing.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
});
const catalogPath = path.join(__dirname, "..", "src", "lib", "medicines.ts");
const catalogSource = fs.readFileSync(catalogPath, "utf8");
const catalogMatch = catalogSource.match(/export const medicines[^=]*=\s*(\[[\s\S]*\]);\s*$/);

if (!catalogMatch) {
    throw new Error(`Could not read the medicine catalog from ${catalogPath}.`);
}

const medicines = Function(`"use strict"; return (${catalogMatch[1]});`)();

async function syncMedicines() {
    const { data: existing, error: fetchError } = await supabase
        .from("medicines")
        .select("id, name");

    if (fetchError) throw fetchError;

    const existingByName = new Map((existing || []).map((medicine) => [medicine.name.trim().toLowerCase(), medicine.id]));
    let inserted = 0;
    let updated = 0;

    for (const medicine of medicines) {
        const payload = {
            name: medicine.name,
            price: medicine.price,
            description: medicine.description,
            stock_quantity: medicine.stock_quantity,
            category: medicine.category,
            image_url: medicine.image_url,
        };
        const existingId = existingByName.get(medicine.name.trim().toLowerCase());
        const request = existingId
            ? supabase.from("medicines").update(payload).eq("id", existingId)
            : supabase.from("medicines").insert(payload);
        const { error } = await request;

        if (error) throw new Error(`${medicine.name}: ${error.message}`);
        if (existingId) updated += 1;
        else inserted += 1;
    }

    console.log(`Synced ${medicines.length} medicines: ${inserted} inserted, ${updated} updated.`);
}

syncMedicines().catch((error) => {
    console.error("Medicine sync failed:", error.message);
    process.exitCode = 1;
});
