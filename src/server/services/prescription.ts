import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : new Proxy({}, { get: () => { throw new Error("Supabase prescriptions are not configured."); } }) as ReturnType<typeof createClient>;

export interface CreatePrescriptionParams {
  userId: string;
  imageUrl: string; // Storage path or signed URL reference
  notes?: string;
}

export interface PrescriptionRecord {
  id: string;
  user_id: string;
  image_url: string;
  status: "pending" | "approved" | "rejected";
  verified_by_pharmacist_id?: string | null;
  notes?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export async function getCustomerPrescriptionRecords(userId: string): Promise<PrescriptionRecord[]> {
  const { data, error } = await supabaseAdmin
    .from("prescriptions")
    .select("id, user_id, status, notes, expires_at, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Database query error:", error);
    throw new Error(`Database error loading prescriptions: ${error.message}`);
  }

  return (data || []) as PrescriptionRecord[];
}

/**
 * Inserts a new prescription into PostgreSQL database with status 'pending'
 * and broadcasts an event to the pharmacist review queue.
 */
export async function createPrescriptionRecord(
  params: CreatePrescriptionParams
): Promise<PrescriptionRecord> {
  const { userId, imageUrl, notes } = params;

  // 1. Insert into prescriptions table with status 'pending'
  const { data, error } = await supabaseAdmin
    .from("prescriptions")
    .insert([
      {
        user_id: userId,
        image_url: imageUrl,
        status: "pending",
        notes: notes || "Awaiting pharmacist verification.",
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Database insert error:", error);
    throw new Error(`Database error saving prescription record: ${error.message}`);
  }

  const prescription = data as PrescriptionRecord;

  // 2. Notify / Mark for Pharmacist Review Queue
  await notifyPharmacistReviewQueue(prescription);

  return prescription;
}

/**
 * Real-time notification mechanism for Pharmacist Review Queue.
 * Emits a Supabase Realtime broadcast event and logs audit metadata.
 */
export async function notifyPharmacistReviewQueue(prescription: PrescriptionRecord): Promise<void> {
  try {
    // Broadcast via Supabase Realtime channel for live pharmacist dashboard updates
    const channel = supabaseAdmin.channel("pharmacist_review_queue");
    await channel.send({
      type: "broadcast",
      event: "NEW_PRESCRIPTION_UPLOADED",
      payload: {
        prescriptionId: prescription.id,
        userId: prescription.user_id,
        status: prescription.status,
        createdAt: prescription.created_at,
        message: "New prescription pending review.",
      },
    });

    console.log(`[QUEUE NOTIFICATION] Prescription ${prescription.id} queued for pharmacist review.`);
  } catch (err: any) {
    console.warn("Failed to dispatch real-time pharmacist notification:", err.message);
    // Non-blocking error: record is safely created in DB regardless
  }
}
