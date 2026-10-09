import { createClient } from "@supabase/supabase-js";
import { getPrescriptionSignedUrl } from "./storage";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : new Proxy({}, { get: () => { throw new Error("Supabase pharmacist review is not configured."); } }) as ReturnType<typeof createClient>;

export interface ReviewQueueItem {
  id: string;
  user_id: string;
  image_url: string;
  signedUrl: string;
  status: string;
  notes?: string;
  created_at: string;
  customer: {
    full_name: string;
    phone: string | null;
  };
}

export interface ReviewQueueResponse {
  data: ReviewQueueItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PrescriptionReviewParams {
  prescriptionId: string;
  pharmacistId: string;
  status: "approved" | "rejected";
  pharmacistNotes: string;
  approvedMedicineIds?: string[];
}

/**
 * Fetches pending prescriptions for the Pharmacist Review Queue.
 * Joins customer user details and generates time-limited signed URLs for viewing private files.
 */
export async function getPharmacistReviewQueue(
  page: number = 1,
  limit: number = 10,
  statusFilter: string = "pending"
): Promise<ReviewQueueResponse> {
  const pageNum = Math.max(1, page);
  const limitNum = Math.max(1, Math.min(100, limit));
  const offset = (pageNum - 1) * limitNum;

  // 1. Fetch total count of items in queue
  const { count, error: countError } = await supabaseAdmin
    .from("prescriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", statusFilter);

  if (countError) {
    throw new Error(`Failed to count queue items: ${countError.message}`);
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limitNum);

  // 2. Fetch paginated records joined with customer details
  const { data: prescriptions, error: fetchError } = await supabaseAdmin
    .from("prescriptions")
    .select(`
      id,
      user_id,
      image_url,
      status,
      notes,
      created_at,
      users:user_id (
        full_name,
        phone
      )
    `)
    .eq("status", statusFilter)
    .order("created_at", { ascending: true }) // Oldest pending first (FIFO)
    .range(offset, offset + limitNum - 1);

  if (fetchError) {
    throw new Error(`Failed to fetch review queue: ${fetchError.message}`);
  }

  // 3. Generate signed URLs for private file viewing for each prescription
  const formattedItems: ReviewQueueItem[] = await Promise.all(
    (prescriptions || []).map(async (item: any) => {
      let signedUrl = "";
      try {
        if (item.image_url.startsWith("private/")) {
          signedUrl = await getPrescriptionSignedUrl(item.image_url, 3600);
        } else {
          // If stored as full URL / data URL fallback
          signedUrl = item.image_url;
        }
      } catch (err) {
        console.warn(`Could not generate signed URL for prescription ${item.id}:`, err);
        signedUrl = item.image_url;
      }

      return {
        id: item.id,
        user_id: item.user_id,
        image_url: item.image_url,
        signedUrl,
        status: item.status,
        notes: item.notes,
        created_at: item.created_at,
        customer: {
          full_name: item.users?.full_name || "Customer",
          phone: item.users?.phone || null,
        },
      };
    })
  );

  return {
    data: formattedItems,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    },
  };
}

/**
 * Process a prescription review transactionally:
 * 1. Updates prescription record with status, pharmacist ID, notes, and timestamp.
 * 2. If attached to pending order(s) in 'rx_review', transitions order status to 'approved' or 'cancelled'.
 * 3. Triggers customer notification event.
 */
export async function processPrescriptionReview(params: PrescriptionReviewParams) {
  const { prescriptionId, pharmacistId, status, pharmacistNotes, approvedMedicineIds } = params;

  const now = new Date().toISOString();

  // 1. Transactionally Update Prescriptions Record
  const { data: updatedPrescription, error: rxError } = await supabaseAdmin
    .from("prescriptions")
    .update({
      status,
      verified_by_pharmacist_id: pharmacistId,
      notes: pharmacistNotes,
      updated_at: now,
    })
    .eq("id", prescriptionId)
    .select()
    .single();

  if (rxError || !updatedPrescription) {
    throw new Error(`Failed to update prescription review status: ${rxError?.message}`);
  }

  // 2. Transition linked orders in 'rx_review' status
  const targetOrderStatus = status === "approved" ? "approved" : "cancelled";

  const { data: linkedOrders, error: orderFetchError } = await supabaseAdmin
    .from("orders")
    .select("id, user_id, status")
    .eq("prescription_id", prescriptionId)
    .eq("status", "rx_review");

  let updatedOrderIds: string[] = [];

  if (!orderFetchError && linkedOrders && linkedOrders.length > 0) {
    const orderIds = linkedOrders.map((o) => o.id);

    const { error: orderUpdateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: targetOrderStatus,
        updated_at: now,
      })
      .in("id", orderIds);

    if (orderUpdateError) {
      console.error(`Failed to auto-transition orders for prescription ${prescriptionId}:`, orderUpdateError);
    } else {
      updatedOrderIds = orderIds;
    }
  }

  // 3. Trigger Customer Notification Event
  const customerId = updatedPrescription.user_id;
  await sendCustomerNotification({
    customerId,
    prescriptionId,
    status,
    pharmacistNotes,
    affectedOrderIds: updatedOrderIds,
    approvedMedicineIds,
  });

  return {
    prescription: updatedPrescription,
    transitionedOrders: {
      targetStatus: targetOrderStatus,
      orderIds: updatedOrderIds,
    },
  };
}

/**
 * Triggers customer notification event via Supabase Realtime channel
 */
export async function sendCustomerNotification(payload: {
  customerId: string;
  prescriptionId: string;
  status: "approved" | "rejected";
  pharmacistNotes: string;
  affectedOrderIds: string[];
  approvedMedicineIds?: string[];
}) {
  try {
    const channel = supabaseAdmin.channel(`customer_notifications_${payload.customerId}`);
    
    const notificationMessage = payload.status === "approved"
      ? `Good news! Your prescription #${payload.prescriptionId.substring(0, 8)} was APPROVED by our pharmacist.`
      : `Action required: Your prescription #${payload.prescriptionId.substring(0, 8)} was REJECTED. Note: ${payload.pharmacistNotes}`;

    await channel.send({
      type: "broadcast",
      event: "PRESCRIPTION_REVIEW_UPDATE",
      payload: {
        ...payload,
        message: notificationMessage,
        timestamp: new Date().toISOString(),
      },
    });

    console.log(`[CUSTOMER NOTIFICATION SENT] User ${payload.customerId}: ${notificationMessage}`);
  } catch (err: any) {
    console.warn("Failed to dispatch customer notification:", err.message);
  }
}
