-- =============================================================================
-- Dawakhana E-Commerce Pharmacy Platform Database Schema
-- Production PostgreSQL / Supabase Schema Definition
-- =============================================================================

-- 1. EXTENSIONS & CUSTOM ENUM TYPES
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define custom ENUM types for rigid state management and performance
CREATE TYPE public.user_role AS ENUM ('customer', 'pharmacist', 'admin');

CREATE TYPE public.prescription_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE public.order_status AS ENUM (
    'rx_review',
    'approved',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
);

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'paid',
    'failed',
    'refunded'
);

-- =============================================================================
-- 2. TABLE DEFINITIONS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- USERS TABLE (Extends Supabase auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT UNIQUE,
    role public.user_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'Profile table linking Supabase auth.users with app application roles.';

-- -----------------------------------------------------------------------------
-- ADDRESSES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.addresses IS 'User delivery and billing addresses.';

-- -----------------------------------------------------------------------------
-- MEDICINES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE public.medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_name TEXT NOT NULL,
    generic_name TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    requires_prescription BOOLEAN NOT NULL DEFAULT FALSE,
    schedule_category TEXT NOT NULL DEFAULT 'OTC', -- e.g. OTC, Schedule H, Schedule H1, Schedule X
    base_price NUMERIC(10, 2) NOT NULL CHECK (base_price >= 0),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.medicines IS 'Master inventory item catalog with regulatory classification.';

-- -----------------------------------------------------------------------------
-- BATCHES TABLE (FEFO Inventory Management)
-- -----------------------------------------------------------------------------
CREATE TABLE public.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
    batch_number TEXT NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    manufacturing_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    mrp NUMERIC(10, 2) NOT NULL CHECK (mrp >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_batch_dates CHECK (expiry_date > manufacturing_date),
    CONSTRAINT uq_medicine_batch UNIQUE (medicine_id, batch_number)
);

COMMENT ON TABLE public.batches IS 'Batch-level inventory tracking for expiry monitoring and FEFO compliance.';

-- -----------------------------------------------------------------------------
-- PRESCRIPTIONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    status public.prescription_status NOT NULL DEFAULT 'pending',
    verified_by_pharmacist_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.prescriptions IS 'Customer uploaded prescription images and pharmacist audit log.';

-- -----------------------------------------------------------------------------
-- ORDERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE SET NULL,
    shipping_address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
    status public.order_status NOT NULL DEFAULT 'rx_review',
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    payment_status public.payment_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.orders IS 'Master order transactions with prescription linkage.';

-- -----------------------------------------------------------------------------
-- ORDER ITEMS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE RESTRICT,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.order_items IS 'Line items linking ordered medicines and allocated batches.';


-- =============================================================================
-- 3. INDEXES FOR HIGH-FREQUENCY QUERIES
-- =============================================================================

-- Users
CREATE INDEX idx_users_phone ON public.users(phone);
CREATE INDEX idx_users_role ON public.users(role);

-- Addresses
CREATE INDEX idx_addresses_user_id ON public.addresses(user_id);

-- Medicines (Search & Filtering)
CREATE INDEX idx_medicines_brand_name ON public.medicines(brand_name);
CREATE INDEX idx_medicines_generic_name ON public.medicines(generic_name);
CREATE INDEX idx_medicines_requires_rx ON public.medicines(requires_prescription);

-- Batches (FEFO & Expiry Checks)
CREATE INDEX idx_batches_expiry_date ON public.batches(expiry_date);
CREATE INDEX idx_batches_medicine_id ON public.batches(medicine_id);
CREATE INDEX idx_batches_medicine_expiry ON public.batches(medicine_id, expiry_date ASC);

-- Prescriptions (Review Queue & User Filter)
CREATE INDEX idx_prescriptions_user_id ON public.prescriptions(user_id);
CREATE INDEX idx_prescriptions_status ON public.prescriptions(status);
CREATE INDEX idx_prescriptions_pharmacist ON public.prescriptions(verified_by_pharmacist_id);
-- Composite index for pharmacist pending review queue
CREATE INDEX idx_prescriptions_pending_queue ON public.prescriptions(created_at ASC) WHERE status = 'pending';

-- Orders (Customer Dashboard & Queue Management)
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_prescription_id ON public.orders(prescription_id);
-- Composite index for active rx review queue
CREATE INDEX idx_orders_rx_review_queue ON public.orders(created_at ASC) WHERE status = 'rx_review';

-- Order Items
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_medicine_id ON public.order_items(medicine_id);
CREATE INDEX idx_order_items_batch_id ON public.order_items(batch_id);


-- =============================================================================
-- 4. AUTOMATIC TIMESTAMPS & HELPER FUNCTIONS
-- =============================================================================

-- Generic function to update `updated_at` column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers to all tables with updated_at
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_addresses_updated_at BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_medicines_updated_at BEFORE UPDATE ON public.medicines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_batches_updated_at BEFORE UPDATE ON public.batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Security Definer helper functions to check user roles without triggering RLS infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS public.user_role AS $$
    SELECT role FROM public.users WHERE id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_pharmacist_or_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('pharmacist', 'admin')
    );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Automatic user creation trigger on auth.users SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, full_name, phone, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Pharmacy Customer'),
        NEW.phone,
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'customer')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================================================
-- 5. SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- USERS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can read own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id OR public.is_pharmacist_or_admin());

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND (role = (SELECT role FROM public.users WHERE id = auth.uid()) OR public.is_admin()));

-- -----------------------------------------------------------------------------
-- ADDRESSES POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own addresses"
    ON public.addresses FOR SELECT
    USING (auth.uid() = user_id OR public.is_pharmacist_or_admin());

CREATE POLICY "Users can insert own addresses"
    ON public.addresses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
    ON public.addresses FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
    ON public.addresses FOR DELETE
    USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- MEDICINES POLICIES (Public read, Staff edit)
-- -----------------------------------------------------------------------------
CREATE POLICY "Anyone can view medicines catalog"
    ON public.medicines FOR SELECT
    USING (TRUE);

CREATE POLICY "Staff can manage medicines catalog"
    ON public.medicines FOR ALL
    USING (public.is_pharmacist_or_admin())
    WITH CHECK (public.is_pharmacist_or_admin());

-- -----------------------------------------------------------------------------
-- BATCHES POLICIES (Public/Authenticated read stock, Staff edit)
-- -----------------------------------------------------------------------------
CREATE POLICY "Authenticated users can view active medicine batches"
    ON public.batches FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage inventory batches"
    ON public.batches FOR ALL
    USING (public.is_pharmacist_or_admin())
    WITH CHECK (public.is_pharmacist_or_admin());

-- -----------------------------------------------------------------------------
-- PRESCRIPTIONS POLICIES
-- -----------------------------------------------------------------------------
-- Customers read their own; Pharmacists/Admins read all (Queue Review)
CREATE POLICY "Customers and Staff can view prescriptions"
    ON public.prescriptions FOR SELECT
    USING (auth.uid() = user_id OR public.is_pharmacist_or_admin());

-- Customers can upload their own prescriptions
CREATE POLICY "Customers can upload prescriptions"
    ON public.prescriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Only Pharmacists and Admins can verify/reject/update prescriptions
CREATE POLICY "Staff can review and update prescriptions"
    ON public.prescriptions FOR UPDATE
    USING (public.is_pharmacist_or_admin())
    WITH CHECK (public.is_pharmacist_or_admin());

-- -----------------------------------------------------------------------------
-- ORDERS POLICIES
-- -----------------------------------------------------------------------------
-- Customers view their own orders; Pharmacists/Admins view all orders
CREATE POLICY "Customers and Staff can view orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id OR public.is_pharmacist_or_admin());

-- Customers can insert their own orders
CREATE POLICY "Customers can place orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Customers can cancel their pending orders; Staff can update any order status
CREATE POLICY "Customers can cancel own draft orders & Staff update any order"
    ON public.orders FOR UPDATE
    USING (
        (auth.uid() = user_id AND status IN ('rx_review', 'approved'))
        OR public.is_pharmacist_or_admin()
    )
    WITH CHECK (
        (auth.uid() = user_id AND status = 'cancelled')
        OR public.is_pharmacist_or_admin()
    );

-- -----------------------------------------------------------------------------
-- ORDER ITEMS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Customers and Staff can view order items"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
              AND (orders.user_id = auth.uid() OR public.is_pharmacist_or_admin())
        )
    );

CREATE POLICY "Customers can insert order items to own orders"
    ON public.order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
              AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can manage order items"
    ON public.order_items FOR ALL
    USING (public.is_pharmacist_or_admin())
    WITH CHECK (public.is_pharmacist_or_admin());
