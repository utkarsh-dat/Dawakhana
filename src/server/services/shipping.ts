import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : new Proxy({}, { get: () => { throw new Error("Supabase shipping is not configured."); } }) as ReturnType<typeof createClient>;

export interface AWBGenerationResult {
  orderId: string;
  awbNumber: string;
  courierName: string;
  shippingLabelUrl: string;
  status: string;
}

/**
 * Calls Courier API (Shiprocket / Delhivery) to generate an AWB Tracking Number & Shipping Label.
 * Updates order record to status 'shipped' with AWB tracking data.
 */
export async function createShippingOrderAndGenerateAWB(orderId: string): Promise<AWBGenerationResult> {
  // 1. Fetch Order Details with Items and Address
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select(`
      id,
      user_id,
      status,
      total_amount,
      shipping_address_id,
      addresses:shipping_address_id (
        street,
        city,
        state,
        postal_code
      ),
      users:user_id (
        full_name,
        phone
      )
    `)
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new Error(`Order #${orderId} not found: ${orderError?.message}`);
  }

  if (order.status === "cancelled") {
    throw new Error(`Cannot ship cancelled order #${orderId}.`);
  }

  const courierApiUrl = process.env.COURIER_API_URL;
  const courierApiKey = process.env.COURIER_API_KEY;
  const courierName = process.env.PREFERRED_COURIER;

  if (!courierApiUrl || !courierApiKey || !courierName) {
    throw new Error("Courier integration is not configured. Refusing to create a demo AWB.");
  }

  // The configured courier adapter must return an AWB and label URL. No fake
  // tracking numbers are generated when the provider is unavailable.
  const courierResponse = await fetch(courierApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${courierApiKey}`,
    },
    body: JSON.stringify({ orderId, order }),
  });

  if (!courierResponse.ok) {
    throw new Error(`Courier API failed with status ${courierResponse.status}.`);
  }

  const courierData = await courierResponse.json() as {
    awbNumber?: string;
    shippingLabelUrl?: string;
  };
  if (!courierData.awbNumber || !courierData.shippingLabelUrl) {
    throw new Error("Courier API response is missing awbNumber or shippingLabelUrl.");
  }

  const awbNumber = courierData.awbNumber;
  const shippingLabelUrl = courierData.shippingLabelUrl;

  const initialTrackingEvent = {
    status: "shipped",
    location: "Warehouse Hub - Central Facility",
    timestamp: new Date().toISOString(),
    remarks: "Shipment picked up by courier and AWB assigned.",
  };

  // 3. Update Order Database Record
  const { error: updateError } = await supabaseAdmin
    .from("orders")
    .update({
      status: "shipped",
      awb_number: awbNumber,
      courier_name: courierName,
      shipping_label_url: shippingLabelUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (updateError) {
    throw new Error(`Failed to update order shipping status: ${updateError.message}`);
  }

  console.log(`[SHIPPING ENGINE] AWB ${awbNumber} generated for Order #${orderId}`);

  return {
    orderId,
    awbNumber,
    courierName,
    shippingLabelUrl,
    status: "shipped",
  };
}

/**
 * Handles incoming webhook status updates from Courier API (e.g., 'in_transit', 'out_for_delivery', 'delivered')
 * and syncs status back to the database.
 */
export async function processShippingWebhookUpdate(payload: {
  awbNumber: string;
  currentStatus: string; // 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned'
  location?: string;
  remarks?: string;
}) {
  const { awbNumber, currentStatus, location, remarks } = payload;

  // Map courier status to order_status ENUM
  let targetOrderStatus: string = "shipped";
  const normalizedStatus = currentStatus.toLowerCase().replace(/[\s-]+/g, "_");
  if (normalizedStatus === "delivered") {
    targetOrderStatus = "delivered";
  } else if (normalizedStatus === "failed_delivery") {
    targetOrderStatus = "failed_delivery";
  } else if (normalizedStatus === "rto" || normalizedStatus === "returned" || normalizedStatus === "return_to_origin") {
    targetOrderStatus = "rto";
  } else if (normalizedStatus === "cancelled" || normalizedStatus === "canceled") {
    targetOrderStatus = "cancelled";
  } else if (normalizedStatus === "out_for_delivery") {
    targetOrderStatus = "out_for_delivery";
  } else if (normalizedStatus === "in_transit" || normalizedStatus === "shipped") {
    targetOrderStatus = "shipped";
  }

  // 1. Fetch Order by AWB
  const { data: order, error: fetchErr } = await supabaseAdmin
    .from("orders")
    .select("id, status, tracking_history")
    .eq("awb_number", awbNumber)
    .single();

  if (fetchErr || !order) {
    throw new Error(`No order found for AWB Number '${awbNumber}'.`);
  }

  // 2. Append to Tracking History Array
  const currentHistory = Array.isArray(order.tracking_history) ? order.tracking_history : [];
  const newTrackingEvent = {
    status: currentStatus,
    location: location || "In Transit",
    remarks: remarks || "Status update received from courier.",
    timestamp: new Date().toISOString(),
  };

  const updatedHistory = [...currentHistory, newTrackingEvent];

  // 3. Update Order Database
  const { error: updateErr } = await supabaseAdmin
    .from("orders")
    .update({
      status: targetOrderStatus,
      tracking_history: updatedHistory,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (updateErr) {
    throw new Error(`Failed to sync courier tracking update: ${updateErr.message}`);
  }

  console.log(`[SHIPPING WEBHOOK] Order #${order.id} updated to '${targetOrderStatus}' via AWB ${awbNumber}`);

  return {
    orderId: order.id,
    awbNumber,
    newStatus: targetOrderStatus,
    trackingEvent: newTrackingEvent,
  };
}
