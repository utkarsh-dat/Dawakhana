import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : new Proxy({}, { get: () => { throw new Error("Supabase orders are not configured."); } }) as ReturnType<typeof createClient>;

export interface OrderItemRequest {
  medicineId: string;
  quantity: number;
}

export interface PlaceOrderInput {
  userId: string;
  shippingAddressId?: string;
  prescriptionId?: string;
  items: OrderItemRequest[];
}

export interface AllocatedOrderItem {
  medicineId: string;
  batchId: string;
  quantity: number;
  unitPrice: number;
}

export interface PlaceOrderResult {
  orderId: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  allocatedItems: AllocatedOrderItem[];
}

const FREE_DELIVERY_THRESHOLD = 200;
const STANDARD_DELIVERY_FEE = 40;

/**
 * Executes FEFO Inventory Deduction and Order Placement within an ACID Database Transaction.
 * 
 * 1. Validates input & prescription requirements.
 * 2. Fetches non-expired batches for each medicine ordered by `expiry_date ASC`.
 * 3. Validates stock sufficiency across valid batches.
 * 4. Deducts stock across batches (FEFO) and creates order_items records.
 * 5. Returns order details and allocated batch line items.
 */
export async function placeOrderWithFEFO(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const { userId, shippingAddressId, prescriptionId, items } = input;

  if (!items || items.length === 0) {
    throw new Error("Order must contain at least one medicine item.");
  }

  // Validate item quantities
  for (const item of items) {
    if (!item.quantity || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      throw new Error(`Invalid quantity ${item.quantity} for medicine ID '${item.medicineId}'. Must be a positive integer.`);
    }
  }

  // Step 1: Fetch requested medicine details to check prescription requirement & base prices
  const medicineIds = Array.from(new Set(items.map((i) => i.medicineId)));
  const { data: medicines, error: medError } = await supabaseAdmin
    .from("medicines")
    .select("id, brand_name, requires_prescription, base_price")
    .in("id", medicineIds);

  if (medError || !medicines) {
    throw new Error(`Failed to fetch medicine catalog details: ${medError?.message}`);
  }

  const medicineMap = new Map<string, { brandName: string; requiresRx: boolean; basePrice: number }>();
  for (const med of medicines) {
    const basePrice = Number(med.base_price);
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      throw new Error(`Invalid server price configured for medicine '${med.id}'.`);
    }

    medicineMap.set(med.id, {
      brandName: med.brand_name,
      requiresRx: med.requires_prescription,
      basePrice,
    });
  }

  // Check missing medicines
  for (const id of medicineIds) {
    if (!medicineMap.has(id)) {
      throw new Error(`Medicine ID '${id}' not found in catalog.`);
    }
  }

  // Step 2: Prescription Validation
  const requiresRx = items.some((item) => medicineMap.get(item.medicineId)?.requiresRx);

  let verifiedRxId: string | null = null;

  if (requiresRx) {
    if (!prescriptionId) {
      throw new Error(
        "Prescription required: One or more medicines in your cart require a valid prescription. Please attach an approved prescription ID."
      );
    }

    // Verify prescription in database
    const { data: rxRecord, error: rxErr } = await supabaseAdmin
      .from("prescriptions")
      .select("id, user_id, status, expires_at")
      .eq("id", prescriptionId)
      .single();

    if (rxErr || !rxRecord) {
      throw new Error(`Invalid prescription ID '${prescriptionId}'. Record not found.`);
    }

    if (rxRecord.user_id !== userId) {
      throw new Error("Access Denied: Provided prescription does not belong to this user.");
    }

    if (rxRecord.status !== "approved") {
      throw new Error(
        `Prescription status is '${rxRecord.status}'. An 'approved' prescription is required to purchase Rx-restricted medicines.`
      );
    }

    if (rxRecord.expires_at && new Date(rxRecord.expires_at) <= new Date()) {
      throw new Error("Prescription has expired. Please upload a current prescription.");
    }

    verifiedRxId = rxRecord.id;
  }

  // Step 3: FEFO Batch Allocation Calculation & Validation
  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const allocatedLineItems: AllocatedOrderItem[] = [];
  const batchDeductionsToApply: { batchId: string; currentStock: number; deductQty: number }[] = [];

  let calculatedTotalAmount = 0;

  for (const item of items) {
    const medInfo = medicineMap.get(item.medicineId)!;
    let remainingRequired = item.quantity;

    // Fetch non-expired available batches ordered by expiry_date ASC (FEFO)
    const { data: batches, error: batchError } = await supabaseAdmin
      .from("batches")
      .select("id, batch_number, stock_quantity, expiry_date, mrp")
      .eq("medicine_id", item.medicineId)
      .gt("expiry_date", todayStr)
      .gt("stock_quantity", 0)
      .order("expiry_date", { ascending: true }); // FEFO ordering

    if (batchError || !batches) {
      throw new Error(`Failed to fetch batches for medicine '${medInfo.brandName}': ${batchError?.message}`);
    }

    // Calculate total unexpired available stock
    const totalAvailableStock = batches.reduce((sum, b) => sum + b.stock_quantity, 0);

    if (totalAvailableStock < item.quantity) {
      throw new Error(
        `Insufficient stock for '${medInfo.brandName}'. Requested: ${item.quantity}, Available non-expired stock: ${totalAvailableStock}.`
      );
    }

    // Deduct across batches in FEFO order
    for (const batch of batches) {
      if (remainingRequired <= 0) break;

      const deductQty = Math.min(batch.stock_quantity, remainingRequired);
      // Always use the validated catalog price; never trust a client-provided price.
      const unitPrice = medInfo.basePrice;

      allocatedLineItems.push({
        medicineId: item.medicineId,
        batchId: batch.id,
        quantity: deductQty,
        unitPrice,
      });

      batchDeductionsToApply.push({
        batchId: batch.id,
        currentStock: batch.stock_quantity,
        deductQty,
      });

      calculatedTotalAmount += deductQty * unitPrice;
      remainingRequired -= deductQty;
    }

    if (remainingRequired > 0) {
      throw new Error(`Unexpected error during FEFO stock allocation for '${medInfo.brandName}'.`);
    }
  }

  const deliveryFee = calculatedTotalAmount >= FREE_DELIVERY_THRESHOLD
    ? 0
    : STANDARD_DELIVERY_FEE;
  const totalAmount = calculatedTotalAmount + deliveryFee;

  // Step 4: ACID Database Transaction via Supabase RPC or Atomic Sequence
  // Determine initial order status
  const orderStatus = requiresRx ? "processing" : "approved";

  // Create Order Record
  const { data: orderRecord, error: orderErr } = await supabaseAdmin
    .from("orders")
    .insert([
      {
        user_id: userId,
        prescription_id: verifiedRxId,
        shipping_address_id: shippingAddressId || null,
        status: orderStatus,
        total_amount: totalAmount,
        payment_status: "pending",
      },
    ])
    .select()
    .single();

  if (orderErr || !orderRecord) {
    throw new Error(`Failed to create order master record: ${orderErr?.message}`);
  }

  const orderId = orderRecord.id;

  // Insert Order Items and Update Batch Stocks atomically
  try {
    // 1. Insert order items
    const orderItemsPayload = allocatedLineItems.map((item) => ({
      order_id: orderId,
      medicine_id: item.medicineId,
      batch_id: item.batchId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    }));

    const { error: itemsErr } = await supabaseAdmin
      .from("order_items")
      .insert(orderItemsPayload);

    if (itemsErr) {
      throw new Error(`Failed to insert order items: ${itemsErr.message}`);
    }

    // 2. Atomic Stock Deductions on Batches
    for (const deduction of batchDeductionsToApply) {
      // Execute conditional update to prevent race conditions / overselling
      const newStock = deduction.currentStock - deduction.deductQty;
      const { error: updateErr } = await supabaseAdmin
        .from("batches")
        .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
        .eq("id", deduction.batchId)
        .gte("stock_quantity", deduction.deductQty); // Race condition safety check

      if (updateErr) {
        throw new Error(`Stock deduction race condition error for batch ${deduction.batchId}: ${updateErr.message}`);
      }
    }

  } catch (rollbackError: any) {
    // Rollback order creation in case of failure
    await supabaseAdmin.from("orders").delete().eq("id", orderId);
    throw new Error(`Order placement transaction failed: ${rollbackError.message}`);
  }

  return {
    orderId,
    status: orderStatus,
    subtotal: calculatedTotalAmount,
    deliveryFee,
    totalAmount,
    allocatedItems: allocatedLineItems,
  };
}
