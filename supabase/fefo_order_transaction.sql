-- =============================================================================
-- PostgreSQL Atomic FEFO Order Placement Stored Procedure
-- Solves Race Conditions & Overselling with 'SELECT FOR UPDATE' Row Locking
-- =============================================================================

CREATE OR REPLACE FUNCTION public.place_order_fefo(
    p_user_id UUID,
    p_shipping_address_id UUID,
    p_prescription_id UUID,
    p_items JSONB -- Array of {"medicine_id": UUID, "quantity": INT}
)
RETURNS JSONB AS $$
DECLARE
    v_item JSONB;
    v_medicine_id UUID;
    v_req_qty INT;
    v_med_brand TEXT;
    v_requires_rx BOOLEAN;
    v_base_price NUMERIC(10, 2);
    v_rx_status public.prescription_status;
    v_rx_user_id UUID;
    
    v_batch RECORD;
    v_remaining_qty INT;
    v_deduct_qty INT;
    v_total_stock INT;
    v_calc_total_amount NUMERIC(10, 2) := 0.00;
    
    v_order_id UUID;
    v_order_status public.order_status := 'processing';
    v_allocated_items JSONB := '[]'::JSONB;
BEGIN
    -- 1. Validate items payload
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Order payload must contain at least one item.';
    END IF;

    -- 2. Check Prescription requirement for all cart items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_medicine_id := (v_item->>'medicine_id')::UUID;
        v_req_qty := (v_item->>'quantity')::INT;

        IF v_req_qty <= 0 THEN
            RAISE EXCEPTION 'Invalid quantity % for medicine %', v_req_qty, v_medicine_id;
        END IF;

        SELECT brand_name, requires_prescription, base_price
        INTO v_med_brand, v_requires_rx, v_base_price
        FROM public.medicines
        WHERE id = v_medicine_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Medicine ID % not found in catalog.', v_medicine_id;
        END IF;

        IF v_requires_rx THEN
            IF p_prescription_id IS NULL THEN
                RAISE EXCEPTION 'Medicine "%" requires an approved prescription.', v_med_brand;
            END IF;

            SELECT user_id, status INTO v_rx_user_id, v_rx_status
            FROM public.prescriptions
            WHERE id = p_prescription_id;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Prescription ID % not found.', p_prescription_id;
            END IF;

            IF v_rx_user_id <> p_user_id THEN
                RAISE EXCEPTION 'Prescription does not belong to user.';
            END IF;

            IF v_rx_status <> 'approved' THEN
                RAISE EXCEPTION 'Prescription is not approved (Current status: %).', v_rx_status;
            END IF;
        END IF;
    END LOOP;

    -- 3. Create Master Order Record
    INSERT INTO public.orders (
        user_id,
        prescription_id,
        shipping_address_id,
        status,
        total_amount,
        payment_status
    )
    VALUES (
        p_user_id,
        p_prescription_id,
        p_shipping_address_id,
        v_order_status,
        0.00,
        'pending'
    )
    RETURNING id INTO v_order_id;

    -- 4. Process FEFO Inventory Deductions with 'FOR UPDATE' Row Locking
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_medicine_id := (v_item->>'medicine_id')::UUID;
        v_req_qty := (v_item->>'quantity')::INT;
        v_remaining_qty := v_req_qty;

        SELECT brand_name, base_price INTO v_med_brand, v_base_price
        FROM public.medicines WHERE id = v_medicine_id;

        -- Verify total available unexpired stock
        SELECT COALESCE(SUM(stock_quantity), 0) INTO v_total_stock
        FROM public.batches
        WHERE medicine_id = v_medicine_id
          AND expiry_date > CURRENT_DATE
          AND stock_quantity > 0;

        IF v_total_stock < v_req_qty THEN
            RAISE EXCEPTION 'Insufficient stock for "%". Requested: %, Available: %', v_med_brand, v_req_qty, v_total_stock;
        END IF;

        -- Lock batches ordered by FEFO (expiry_date ASC)
        FOR v_batch IN 
            SELECT id, batch_number, stock_quantity, expiry_date, mrp
            FROM public.batches
            WHERE medicine_id = v_medicine_id
              AND expiry_date > CURRENT_DATE
              AND stock_quantity > 0
            ORDER BY expiry_date ASC
            FOR UPDATE -- Row lock to prevent race conditions
        LOOP
            EXIT WHEN v_remaining_qty <= 0;

            v_deduct_qty := LEAST(v_batch.stock_quantity, v_remaining_qty);

            -- Deduct stock on batch
            UPDATE public.batches
            SET stock_quantity = stock_quantity - v_deduct_qty,
                updated_at = NOW()
            WHERE id = v_batch.id;

            -- Create Order Item record
            INSERT INTO public.order_items (
                order_id,
                medicine_id,
                batch_id,
                quantity,
                unit_price
            )
            VALUES (
                v_order_id,
                v_medicine_id,
                v_batch.id,
                v_deduct_qty,
                v_base_price
            );

            v_calc_total_amount := v_calc_total_amount + (v_deduct_qty * v_base_price);
            v_remaining_qty := v_remaining_qty - v_deduct_qty;

            v_allocated_items := v_allocated_items || jsonb_build_object(
                'medicine_id', v_medicine_id,
                'batch_id', v_batch.id,
                'quantity', v_deduct_qty,
                'unit_price', v_base_price
            );
        END LOOP;
    END LOOP;

    -- Update final order total amount
    UPDATE public.orders
    SET total_amount = v_calc_total_amount
    WHERE id = v_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'status', v_order_status,
        'total_amount', v_calc_total_amount,
        'allocated_items', v_allocated_items
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
