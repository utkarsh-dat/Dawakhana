import supabase from "../supabaseClient";

export interface MedicineDoc {
    id: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    requiresPrescription: boolean;
    expiryDate: string | null;
    batchNumber: string | null;
    description: string;
    image: string;
    rating: number;
    reviews: number;
    inStock: boolean;
    createdAt: string;
    updatedAt: string;
}

type MedicineRow = {
    id: string;
    name: string;
    price: number;
    description: string | null;
    stock_quantity: number | null;
    category: string | null;
    image_url: string | null;
    created_at?: string;
    updated_at?: string;
};

function toMedicine(row: MedicineRow): MedicineDoc {
    const stock = Number(row.stock_quantity || 0);
    const category = row.category || "OTC";

    return {
        id: row.id,
        name: row.name,
        category,
        price: Number(row.price),
        stock,
        requiresPrescription: category.toLowerCase() === "prescriptions",
        expiryDate: null,
        batchNumber: null,
        description: row.description || "",
        image: row.image_url || "",
        rating: 0,
        reviews: 0,
        inStock: stock > 0,
        createdAt: row.created_at || "",
        updatedAt: row.updated_at || "",
    };
}

export async function searchMedicines(params: {
    search?: string;
    category?: string;
    requiresPrescription?: boolean;
    inStockOnly?: boolean;
    pageSize?: number;
}): Promise<MedicineDoc[]> {
    const { search, category, requiresPrescription, inStockOnly, pageSize = 50 } = params;
    let request = supabase
        .from("medicines")
        .select("id, name, price, description, stock_quantity, category, image_url, created_at")
        .limit(Math.min(pageSize, 200));

    if (category && category !== "All") request = request.eq("category", category);
    if (inStockOnly) request = request.gt("stock_quantity", 0);

    const { data, error } = await request;
    if (error) throw new Error(`Failed to fetch medicines: ${error.message}`);

    let medicines = (data as MedicineRow[]).map(toMedicine);
    if (requiresPrescription !== undefined) {
        medicines = medicines.filter((medicine) => medicine.requiresPrescription === requiresPrescription);
    }
    if (search) {
        const normalizedSearch = search.toLowerCase();
        medicines = medicines.filter((medicine) =>
            medicine.name.toLowerCase().includes(normalizedSearch) ||
            medicine.category.toLowerCase().includes(normalizedSearch) ||
            medicine.description.toLowerCase().includes(normalizedSearch)
        );
    }

    return medicines;
}

export async function getMedicineById(id: string): Promise<MedicineDoc | null> {
    const { data, error } = await supabase
        .from("medicines")
        .select("id, name, price, description, stock_quantity, category, image_url, created_at")
        .eq("id", id)
        .maybeSingle();

    if (error) throw new Error(`Failed to fetch medicine: ${error.message}`);
    return data ? toMedicine(data as MedicineRow) : null;
}

export async function reserveStock(
    items: { medicineId: string; quantity: number }[]
): Promise<{ success: boolean; failedItems: string[] }> {
    const failedItems: string[] = [];

    for (const item of items) {
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
            failedItems.push(item.medicineId);
            continue;
        }

        const medicine = await getMedicineById(item.medicineId);
        if (!medicine || medicine.stock < item.quantity) {
            failedItems.push(item.medicineId);
            continue;
        }

        const { data, error } = await supabase
            .from("medicines")
            .update({
                stock_quantity: medicine.stock - item.quantity,
            })
            .eq("id", item.medicineId)
            .gte("stock_quantity", item.quantity)
            .select("id")
            .maybeSingle();

        if (error || !data) failedItems.push(item.medicineId);
    }

    return { success: failedItems.length === 0, failedItems };
}

export async function releaseStock(
    items: { medicineId: string; quantity: number }[]
): Promise<void> {
    for (const item of items) {
        const medicine = await getMedicineById(item.medicineId);
        if (!medicine) continue;

        const { error } = await supabase
            .from("medicines")
            .update({
                stock_quantity: medicine.stock + item.quantity,
            })
            .eq("id", item.medicineId);

        if (error) throw new Error(`Failed to release stock: ${error.message}`);
    }
}

export async function checkPrescriptionRequired(
    medicineIds: string[]
): Promise<{ required: boolean; rxItems: string[] }> {
    const medicines = await Promise.all(medicineIds.map((id) => getMedicineById(id)));
    const rxItems = medicines
        .filter((medicine): medicine is MedicineDoc => Boolean(medicine?.requiresPrescription))
        .map((medicine) => medicine.name);

    return { required: rxItems.length > 0, rxItems };
}
