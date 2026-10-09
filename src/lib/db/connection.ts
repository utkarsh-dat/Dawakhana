import supabase from "../supabaseClient";

export const db = supabase;

type QuerySpec = {
    table: string;
    filters: { column: string; value: unknown }[];
    order?: { column: string; descending: boolean };
    limit?: number;
};

type DocumentReference = { table: string; id: string };
type CollectionReference = { table: string };
type Query = QuerySpec;

const isIncrement = (value: unknown): value is { __increment: number } =>
    typeof value === "object" && value !== null && "__increment" in value;

export function collection(_database: typeof db, table: string): CollectionReference {
    return { table };
}

export function doc(_database: typeof db, table: string, id: string): DocumentReference {
    return { table, id };
}

export function query(source: CollectionReference | Query, ...operations: Query[]): Query {
    const base: QuerySpec = "table" in source && "filters" in source
        ? source
        : { table: source.table, filters: [] };
    return operations.reduce((current, operation) => ({
        ...current,
        filters: [...current.filters, ...operation.filters],
        order: operation.order || current.order,
        limit: operation.limit || current.limit,
    }), base);
}

export function where(column: string, _operator: "==", value: unknown): Query {
    return { table: "", filters: [{ column, value }] };
}

export function orderBy(column: string, direction: "asc" | "desc" = "asc"): Query {
    return { table: "", filters: [], order: { column, descending: direction === "desc" } };
}

export function limit(value: number): Query {
    return { table: "", filters: [], limit: value };
}

export function startAfter(_value: unknown): Query {
    return { table: "", filters: [] };
}

export async function getDoc(reference: DocumentReference) {
    const { data, error } = await db.from(reference.table).select("*").eq("id", reference.id).maybeSingle();
    if (error) throw error;
    return { id: reference.id, exists: () => Boolean(data), data: () => data || {} };
}

export async function getDocs(source: CollectionReference | Query) {
    const specification = "filters" in source ? source : { table: source.table, filters: [] };
    let request = db.from(specification.table).select("*");
    for (const filter of specification.filters) request = request.eq(filter.column, filter.value);
    if (specification.order) request = request.order(specification.order.column, { ascending: !specification.order.descending });
    if (specification.limit) request = request.limit(specification.limit);
    const { data, error } = await request;
    if (error) throw error;
    const rows = data || [];
    return {
        docs: rows.map((row) => ({ id: row.id, data: () => row })),
        empty: rows.length === 0,
        size: rows.length,
    };
}

function normalizePayload(payload: Record<string, unknown>, current: Record<string, unknown> = {}) {
    return Object.fromEntries(Object.entries(payload).map(([key, value]) => [
        key,
        isIncrement(value) ? Number(current[key] || 0) + value.__increment : value,
    ]));
}

export async function setDoc(reference: DocumentReference, payload: Record<string, unknown>, options?: { merge?: boolean }) {
    const values = options?.merge ? normalizePayload(payload) : payload;
    const { error } = await db.from(reference.table).upsert({ id: reference.id, ...values });
    if (error) throw error;
}

export async function updateDoc(reference: DocumentReference, payload: Record<string, unknown>) {
    const existing = await getDoc(reference);
    const values = normalizePayload(payload, existing.data());
    const { error } = await db.from(reference.table).update(values).eq("id", reference.id);
    if (error) throw error;
}

export async function deleteDoc(reference: DocumentReference) {
    const { error } = await db.from(reference.table).delete().eq("id", reference.id);
    if (error) throw error;
}

export function increment(value: number) {
    return { __increment: value };
}

export function serverTimestamp() {
    return new Date().toISOString();
}

export async function runTransaction(_database: typeof db, callback: (transaction: {
    get: typeof getDoc;
    update: typeof updateDoc;
}) => Promise<void>) {
    await callback({ get: getDoc, update: updateDoc });
}

export function writeBatch(_database: typeof db) {
    const operations: Promise<void>[] = [];
    return {
        set(reference: DocumentReference, payload: Record<string, unknown>) {
            operations.push(setDoc(reference, payload));
        },
        update(reference: DocumentReference, payload: Record<string, unknown>) {
            operations.push(updateDoc(reference, payload));
        },
        async commit() {
            await Promise.all(operations);
        },
    };
}

// Collection references
export const COLLECTIONS = {
    MEDICINES: "medicines",
    ORDERS: "orders",
    PRESCRIPTIONS: "prescriptions",
    USERS: "users",
    TRACKING: "tracking",
    MISSING_MEDICINE_REQUESTS: "missingMedicineRequests",
} as const;

// Helper: Get a typed collection reference
export function getCollection(name: string): CollectionReference {
    return collection(db, name);
}

// Helper: Get a typed document reference
export function getDocRef(collectionName: string, docId: string): DocumentReference {
    return doc(db, collectionName, docId);
}
