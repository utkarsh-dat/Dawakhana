const fs = require("node:fs");
const path = require("node:path");

const sourcePath = path.join(__dirname, "..", "src", "lib", "parsed_medicines.json");
const outputPath = path.join(__dirname, "..", "supabase", "medicines.seed.json");
const imageDirectory = path.join(__dirname, "..", "public", "images", "medicines");

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

function imageUrlFor(code, name) {
    for (const extension of [".png", ".jpg", ".jpeg"]) {
        if (fs.existsSync(path.join(imageDirectory, `${code}${extension}`))) {
            return `/images/medicines/${code}${extension}`;
        }
    }

    return `https://placehold.co/100x100?text=${encodeURIComponent(name)}`;
}

const medicines = source.map((medicine) => {
    const category = medicine.category || "OTC";
    const description = medicine.composition || `${medicine.name} medicine`;

    return {
        brand_name: medicine.name,
        generic_name: medicine.composition || medicine.name,
        manufacturer: "DawaKhana Catalog",
        requires_prescription: category === "Prescriptions",
        schedule_category: category,
        base_price: Number(medicine.new_mrp ?? medicine.old_mrp ?? 0),
        description,
        image_url: imageUrlFor(medicine.code, medicine.name),
        stock_quantity: 0,
        source_code: medicine.code,
        name: medicine.name,
        price: Number(medicine.new_mrp ?? medicine.old_mrp ?? 0),
        category,
    };
});

fs.writeFileSync(outputPath, `${JSON.stringify(medicines, null, 2)}\n`);
console.log(`Formatted ${medicines.length} medicines into ${outputPath}`);
