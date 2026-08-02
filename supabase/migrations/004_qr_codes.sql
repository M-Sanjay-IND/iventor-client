-- ============================================================================
-- INVENTOR CLIENT — QR CODE MANAGEMENT ENGINE
-- Migration: 004_qr_codes
-- ============================================================================
--
-- Creates the immutable QR identity system:
--   qr_uid_sequence  → Monotonic UID counter (INV-000000001, INV-000000002, …)
--   qr_codes         → QR metadata linked to inventory_copies
--
-- Constitution §4: QR Identity is permanent. Never regenerate.
-- Only encode the QR UID — never business data.
-- ============================================================================

-- ============================================================================
-- QR UID SEQUENCE TABLE
-- ============================================================================
-- Single-row counter for atomic, gap-free UID generation.
-- Uses SELECT ... FOR UPDATE to prevent duplicate UIDs under concurrency.

CREATE TABLE IF NOT EXISTS public.qr_uid_sequence (
  id            BOOLEAN PRIMARY KEY DEFAULT true,
  last_value    BIGINT NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT qr_uid_sequence_singleton CHECK (id = true)
);

INSERT INTO public.qr_uid_sequence (id, last_value)
VALUES (true, 0)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.qr_uid_sequence IS
  'Single-row counter for monotonically incrementing QR UIDs. Locked during generation.';

-- ============================================================================
-- QR CODES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.qr_codes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_uid            TEXT NOT NULL,
  copy_id           UUID NOT NULL REFERENCES public.inventory_copies(id) ON DELETE RESTRICT,
  png_storage_path  TEXT NOT NULL,
  svg_storage_path  TEXT NOT NULL,
  checksum          TEXT NOT NULL,
  version           INTEGER NOT NULL DEFAULT 1,
  print_count       INTEGER NOT NULL DEFAULT 0,
  last_printed_at   TIMESTAMPTZ,
  generated_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ,
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT qr_codes_uid_unique UNIQUE (qr_uid),
  CONSTRAINT qr_codes_version_positive CHECK (version >= 1),
  CONSTRAINT qr_codes_print_count_non_negative CHECK (print_count >= 0)
);

CREATE INDEX idx_qr_codes_copy ON public.qr_codes(copy_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_qr_codes_active ON public.qr_codes(is_active)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_qr_codes_uid ON public.qr_codes(qr_uid);

CREATE INDEX idx_qr_codes_deleted ON public.qr_codes(deleted_at)
  WHERE deleted_at IS NOT NULL;

COMMENT ON TABLE public.qr_codes IS
  'Immutable QR code identities. Each row maps a unique UID to an inventory copy. Images stored in Supabase Storage.';

-- ============================================================================
-- TRIGGER: auto-update updated_at
-- ============================================================================

CREATE TRIGGER trg_qr_codes_updated_at
  BEFORE UPDATE ON public.qr_codes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- RPC: next_qr_uid(count)
-- ============================================================================
-- Atomically reserves `count` sequential UIDs and returns them as TEXT[].
-- Format: INV-000000001, INV-000000002, …
-- Uses row-level lock to prevent duplicates under concurrent calls.

CREATE OR REPLACE FUNCTION public.next_qr_uid(p_count INTEGER DEFAULT 1)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current BIGINT;
  v_new     BIGINT;
  v_result  TEXT[];
  v_i       BIGINT;
BEGIN
  IF p_count < 1 OR p_count > 1000 THEN
    RAISE EXCEPTION 'count must be between 1 and 1000';
  END IF;

  SELECT last_value INTO v_current
  FROM public.qr_uid_sequence
  WHERE id = true
  FOR UPDATE;

  v_new := v_current + p_count;

  UPDATE public.qr_uid_sequence
  SET last_value = v_new, updated_at = now()
  WHERE id = true;

  v_result := ARRAY[]::TEXT[];
  FOR v_i IN (v_current + 1)..v_new LOOP
    v_result := v_result || ('INV-' || lpad(v_i::TEXT, 9, '0'));
  END LOOP;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.next_qr_uid IS
  'Atomically reserves sequential QR UIDs. Returns array of formatted UIDs (INV-000000001).';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_uid_sequence ENABLE ROW LEVEL SECURITY;

-- Admins can read all QR codes
CREATE POLICY "admins_select_qr_codes" ON public.qr_codes
  FOR SELECT TO authenticated
  USING (public.has_role('super_admin') OR public.has_role('admin'));

-- Admins can insert QR codes
CREATE POLICY "admins_insert_qr_codes" ON public.qr_codes
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role('super_admin') OR public.has_role('admin'));

-- Admins can update QR codes (reprint, replace)
CREATE POLICY "admins_update_qr_codes" ON public.qr_codes
  FOR UPDATE TO authenticated
  USING (public.has_role('super_admin') OR public.has_role('admin'))
  WITH CHECK (public.has_role('super_admin') OR public.has_role('admin'));

-- Sequence table: admins only
CREATE POLICY "admins_select_qr_sequence" ON public.qr_uid_sequence
  FOR SELECT TO authenticated
  USING (public.has_role('super_admin') OR public.has_role('admin'));

CREATE POLICY "admins_update_qr_sequence" ON public.qr_uid_sequence
  FOR UPDATE TO authenticated
  USING (public.has_role('super_admin') OR public.has_role('admin'))
  WITH CHECK (public.has_role('super_admin') OR public.has_role('admin'));

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.qr_codes TO authenticated;
GRANT SELECT, UPDATE ON public.qr_uid_sequence TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_qr_uid TO authenticated;
