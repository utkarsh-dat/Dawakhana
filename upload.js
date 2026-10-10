const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

const localEnvPath = path.join(__dirname, ".env.local");
if (typeof process.loadEnvFile === "function" && fs.existsSync(localEnvPath)) {
    process.loadEnvFile(localEnvPath);
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const inputPath = path.join(__dirname, "supabase", "medicines.seed.json");
const batchSize = 100;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
}

if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const source = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const records = source.map((medicine) => ({
    name: medicine.name,
    price: medicine.price,
    description: medicine.description,
    stock_quantity: medicine.stock_quantity,
    category: medicine.category,
    image_url: medicine.image_url,
}));

async function upload() {
    for (let start = 0; start < records.length; start += batchSize) {
        const batch = records.slice(start, start + batchSize);
        const { error } = await supabase.from("medicines").insert(batch);

        if (error) {
            throw new Error(`Upload failed for records ${start + 1}-${start + batch.length}: ${error.message}`);
        }

        console.log(`Uploaded ${start + batch.length}/${records.length} medicines`);
    }

    console.log("Medicine upload completed successfully.");
}

upload().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
