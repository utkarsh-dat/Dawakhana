ALTER TABLE public.medicines
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE OR REPLACE FUNCTION public.set_medicines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_medicines_updated_at ON public.medicines;

CREATE TRIGGER trg_medicines_updated_at
BEFORE UPDATE ON public.medicines
FOR EACH ROW
EXECUTE FUNCTION public.set_medicines_updated_at();
