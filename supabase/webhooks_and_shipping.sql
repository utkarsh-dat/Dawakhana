-- =============================================================================
-- Webhook Idempotency Log & Shipping Integration Database Extensions
-- =============================================================================

-- 1. Idempotent Webhook Events Log
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT UNIQUE NOT NULL, -- Event ID or Payment/Shipment ID from Gateway
    gateway TEXT NOT NULL, -- e.g. 'razorpay', 'stripe', 'shiprocket'
    event_type TEXT NOT NULL, -- e.g. 'payment.captured', 'shipment.delivered'
    payload JSONB,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.processed_webhook_events(event_id);

-- 2. Add Shipping Tracking Columns to Orders Table (if not exists)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS awb_number TEXT,
ADD COLUMN IF NOT EXISTS courier_name TEXT,
ADD COLUMN IF NOT EXISTS shipping_label_url TEXT,
ADD COLUMN IF NOT EXISTS tracking_history JSONB DEFAULT '[]'::JSONB;

CREATE INDEX IF NOT EXISTS idx_orders_awb_number ON public.orders(awb_number);

-- 3. Stored Procedure for Idempotent Payment Capture
CREATE OR REPLACE FUNCTION public.process_payment_captured_idempotent(
    p_event_id TEXT,
    p_order_id UUID,
    p_payment_id TEXT,
    p_gateway TEXT,
    p_payload JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_already_processed BOOLEAN;
    v_order_status public.order_status;
BEGIN
    -- Check if event was already processed
    SELECT EXISTS (
        SELECT 1 FROM public.processed_webhook_events WHERE event_id = p_event_id
    ) INTO v_already_processed;

    IF v_already_processed THEN
        RETURN jsonb_build_object(
            'success', true,
            'idempotent', true,
            'message', 'Webhook event already processed.'
        );
    END IF;

    -- Update Order Payment & Order Status
    UPDATE public.orders
    SET payment_status = 'paid',
        status = CASE WHEN status = 'rx_review' THEN 'rx_review' ELSE 'processing'::public.order_status END,
        updated_at = NOW()
    WHERE id = p_order_id
    RETURNING status INTO v_order_status;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order ID % not found.', p_order_id;
    END IF;

    -- Log Event into Idempotency Table
    INSERT INTO public.processed_webhook_events (
        event_id,
        gateway,
        event_type,
        payload
    )
    VALUES (
        p_event_id,
        p_gateway,
        'payment.captured',
        p_payload
    );

    RETURN jsonb_build_object(
        'success', true,
        'idempotent', false,
        'order_id', p_order_id,
        'order_status', v_order_status,
        'payment_status', 'paid'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
