-- ============================================================================
-- INVENTOR CLIENT — COUNTER TERMINAL ENGINE
-- Migration: 005_counter_terminal
-- ============================================================================
--
-- Creates the counter terminal infrastructure:
--   terminal_sessions  → Admin-controlled open/close state
--   borrower_sessions  → Per-borrower OTP authentication
--   transactions       → Immutable borrow/return ledger
--
-- Constitution §7: Borrowers never receive admin permissions.
-- Counter terminal never exposes administration.
-- ============================================================================

-- Make copy_id nullable and add item_id on qr_codes table for item-level QR codes
ALTER TABLE public.qr_codes ALTER COLUMN copy_id DROP NOT NULL;
ALTER TABLE public.qr_codes ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES public.inventory_items(id) ON DELETE RESTRICT;

-- ============================================================================
-- TERMINAL SESSIONS (admin open/close)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.terminal_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at   TIMESTAMPTZ,
  opened_by   UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  closed_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT terminal_sessions_close_after_open
    CHECK (closed_at IS NULL OR closed_at >= opened_at)
);

CREATE INDEX IF NOT EXISTS idx_terminal_sessions_active
  ON public.terminal_sessions(opened_at)
  WHERE closed_at IS NULL;

COMMENT ON TABLE public.terminal_sessions IS
  'Tracks admin-authorized counter terminal open/close windows. Only one session active at a time.';

-- ============================================================================
-- BORROWER SESSIONS (OTP authentication)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.borrower_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id     UUID NOT NULL REFERENCES public.terminal_sessions(id) ON DELETE RESTRICT,
  email           TEXT NOT NULL,
  otp_hash        TEXT NOT NULL,
  session_token   UUID,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'active', 'expired', 'failed')),
  attempts        INTEGER NOT NULL DEFAULT 0,
  max_attempts    INTEGER NOT NULL DEFAULT 5,
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT borrower_sessions_attempts_non_negative CHECK (attempts >= 0)
);

CREATE INDEX IF NOT EXISTS idx_borrower_sessions_token
  ON public.borrower_sessions(session_token)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_borrower_sessions_email
  ON public.borrower_sessions(email, created_at DESC);

COMMENT ON TABLE public.borrower_sessions IS
  'Temporary OTP-authenticated borrower sessions. Auto-expire after 10 minutes.';

-- ============================================================================
-- TRANSACTIONS (immutable borrow/return ledger)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
    CREATE TYPE public.transaction_type AS ENUM (
      'borrow', 'return', 'lost', 'damaged'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type                public.transaction_type NOT NULL,
  copy_id             UUID NOT NULL REFERENCES public.inventory_copies(id) ON DELETE RESTRICT,
  borrower_email      TEXT NOT NULL,
  borrower_session_id UUID REFERENCES public.borrower_sessions(id) ON DELETE SET NULL,
  terminal_session_id UUID REFERENCES public.terminal_sessions(id) ON DELETE SET NULL,
  borrowed_at         TIMESTAMPTZ,
  returned_at         TIMESTAMPTZ,
  due_date            TIMESTAMPTZ,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_copy ON public.transactions(copy_id);
CREATE INDEX IF NOT EXISTS idx_transactions_email ON public.transactions(borrower_email);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_terminal ON public.transactions(terminal_session_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON public.transactions(created_at DESC);

COMMENT ON TABLE public.transactions IS
  'Immutable transaction ledger. Every borrow/return creates a new row. Never updated or deleted.';

-- ============================================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS trg_terminal_sessions_updated_at ON public.terminal_sessions;
CREATE TRIGGER trg_terminal_sessions_updated_at
  BEFORE UPDATE ON public.terminal_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_borrower_sessions_updated_at ON public.borrower_sessions;
CREATE TRIGGER trg_borrower_sessions_updated_at
  BEFORE UPDATE ON public.borrower_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON public.transactions;
CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- RPC: get_active_terminal()
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_active_terminal();

CREATE OR REPLACE FUNCTION public.get_active_terminal()
RETURNS SETOF public.terminal_sessions
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT *
  FROM public.terminal_sessions
  WHERE closed_at IS NULL
  ORDER BY opened_at DESC
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_active_terminal IS
  'Returns the currently open terminal session, or empty if none active.';

-- ============================================================================
-- RPC: open_terminal()
-- ============================================================================

DROP FUNCTION IF EXISTS public.open_terminal(TEXT);

CREATE OR REPLACE FUNCTION public.open_terminal(p_notes TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing UUID;
  v_session_id UUID;
BEGIN
  -- Verify caller is an active admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Unauthorized: only active admins can open the terminal';
  END IF;

  -- Check if a terminal is already open
  SELECT id INTO v_existing
  FROM public.terminal_sessions
  WHERE closed_at IS NULL
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RAISE EXCEPTION 'A terminal session is already open. Close it first.';
  END IF;

  -- Create the terminal session
  INSERT INTO public.terminal_sessions (opened_by, notes)
  VALUES (auth.uid(), p_notes)
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;

-- ============================================================================
-- RPC: close_terminal(session_id)
-- ============================================================================

DROP FUNCTION IF EXISTS public.close_terminal(UUID);

CREATE OR REPLACE FUNCTION public.close_terminal(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify caller is an active admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Unauthorized: only active admins can close the terminal';
  END IF;

  -- Close the session
  UPDATE public.terminal_sessions
  SET closed_at = now(),
      closed_by = auth.uid()
  WHERE id = p_session_id
    AND closed_at IS NULL;

  -- Expire all active borrower sessions for this terminal
  UPDATE public.borrower_sessions
  SET status = 'expired'
  WHERE terminal_id = p_session_id
    AND status = 'active';
END;
$$;

-- ============================================================================
-- RPC: create_borrower_otp(email, terminal_session_id)
-- ============================================================================

DROP FUNCTION IF EXISTS public.create_borrower_otp(TEXT, UUID);

CREATE OR REPLACE FUNCTION public.create_borrower_otp(
  p_email TEXT,
  p_terminal_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_otp TEXT;
  v_session_id UUID;
BEGIN
  -- Verify terminal is open
  IF NOT EXISTS (
    SELECT 1 FROM public.terminal_sessions
    WHERE id = p_terminal_id AND closed_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Terminal is not open';
  END IF;

  -- Generate a 6-digit OTP
  v_otp := lpad(floor(random() * 1000000)::TEXT, 6, '0');

  -- Create borrower session with hashed OTP
  INSERT INTO public.borrower_sessions (
    terminal_id, email, otp_hash
  ) VALUES (
    p_terminal_id,
    lower(trim(p_email)),
    md5(v_otp || p_terminal_id::TEXT)
  )
  RETURNING id INTO v_session_id;

  RETURN json_build_object(
    'session_id', v_session_id,
    'otp', v_otp
  );
END;
$$;

-- ============================================================================
-- RPC: verify_borrower_otp(session_id, otp)
-- ============================================================================

DROP FUNCTION IF EXISTS public.verify_borrower_otp(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.verify_borrower_otp(
  p_session_id UUID,
  p_otp TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session public.borrower_sessions%ROWTYPE;
  v_token UUID;
BEGIN
  -- Fetch the session
  SELECT * INTO v_session
  FROM public.borrower_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  -- Check if expired
  IF v_session.status = 'expired' OR v_session.expires_at < now() THEN
    UPDATE public.borrower_sessions SET status = 'expired' WHERE id = p_session_id;
    RAISE EXCEPTION 'Session has expired';
  END IF;

  -- Check if already active
  IF v_session.status = 'active' THEN
    RETURN v_session.session_token;
  END IF;

  -- Check max attempts
  IF v_session.attempts >= v_session.max_attempts THEN
    UPDATE public.borrower_sessions SET status = 'failed' WHERE id = p_session_id;
    RAISE EXCEPTION 'Maximum OTP attempts exceeded';
  END IF;

  -- Increment attempt counter
  UPDATE public.borrower_sessions
  SET attempts = attempts + 1
  WHERE id = p_session_id;

  -- Verify OTP hash
  IF md5(p_otp || v_session.terminal_id::TEXT) != v_session.otp_hash THEN
    RAISE EXCEPTION 'Invalid OTP';
  END IF;

  -- Activate the session
  v_token := gen_random_uuid();

  UPDATE public.borrower_sessions
  SET status = 'active',
      session_token = v_token,
      expires_at = now() + interval '10 minutes'
  WHERE id = p_session_id;

  RETURN v_token;
END;
$$;

-- ============================================================================
-- RPC: lookup_qr_for_counter(qr_uid)
-- ============================================================================

DROP FUNCTION IF EXISTS public.lookup_qr_for_counter(TEXT);

CREATE OR REPLACE FUNCTION public.lookup_qr_for_counter(p_qr_uid TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_result JSON;
  v_qr_record RECORD;
  v_item_id UUID;
  v_copy_id UUID;
  v_total_copies INT;
  v_available_copies INT;
  v_borrowed_copies INT;
BEGIN
  -- 1. Try lookup in qr_codes table (by qr_uid)
  SELECT q.item_id, q.copy_id
  INTO v_qr_record
  FROM public.qr_codes q
  WHERE q.qr_uid = p_qr_uid
    AND q.is_active = true
    AND q.deleted_at IS NULL;

  IF FOUND THEN
    v_item_id := v_qr_record.item_id;
    v_copy_id := v_qr_record.copy_id;

    -- If copy_id is set but item_id wasn't on QR row, resolve item_id from copy
    IF v_item_id IS NULL AND v_copy_id IS NOT NULL THEN
      SELECT item_id INTO v_item_id
      FROM public.inventory_copies
      WHERE id = v_copy_id AND deleted_at IS NULL;
    END IF;
  ELSE
    -- 2. Fallback: check if qr_uid matches an item ID directly or item name
    SELECT id INTO v_item_id
    FROM public.inventory_items
    WHERE (id::TEXT = p_qr_uid OR name ILIKE p_qr_uid)
      AND deleted_at IS NULL;
  END IF;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'QR code not found or inactive: %', p_qr_uid;
  END IF;

  -- Calculate stock metrics for this item
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'available'),
    COUNT(*) FILTER (WHERE status = 'borrowed')
  INTO v_total_copies, v_available_copies, v_borrowed_copies
  FROM public.inventory_copies
  WHERE item_id = v_item_id AND deleted_at IS NULL;

  -- Build result JSON for counter UI display
  SELECT json_build_object(
    'qr_uid', p_qr_uid,
    'item_id', i.id,
    'copy_id', v_copy_id,
    'item_name', i.name,
    'item_description', i.description,
    'category_name', cat.name,
    'status', CASE WHEN v_available_copies > 0 THEN 'available' ELSE 'borrowed' END,
    'total_copies', v_total_copies,
    'available_copies', v_available_copies,
    'borrowed_copies', v_borrowed_copies
  ) INTO v_result
  FROM public.inventory_items i
  LEFT JOIN public.categories cat ON cat.id = i.category_id
  WHERE i.id = v_item_id;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.lookup_qr_for_counter IS
  'Looks up an item-level or copy-level QR UID and returns inventory stock details.';

-- ============================================================================
-- RPC: get_borrower_active_loans(session_token)
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_borrower_active_loans(UUID);

CREATE OR REPLACE FUNCTION public.get_borrower_active_loans(p_session_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_session public.borrower_sessions%ROWTYPE;
  v_result JSON;
BEGIN
  -- Validate session
  SELECT * INTO v_session
  FROM public.borrower_sessions
  WHERE session_token = p_session_token
    AND status = 'active'
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired session';
  END IF;

  -- Select active borrowed items for this borrower (case-insensitive email)
  -- where the physical copy is currently 'borrowed'
  SELECT json_agg(
    json_build_object(
      'transaction_id', sub.tx_id,
      'copy_id', sub.copy_id,
      'copy_number', sub.copy_number,
      'borrowed_at', sub.borrowed_at,
      'due_date', sub.due_date,
      'item_id', sub.item_id,
      'item_name', sub.item_name,
      'item_description', sub.item_description,
      'category_name', sub.category_name,
      'location_name', sub.location_name,
      'qr_uid', sub.qr_uid
    )
  ) INTO v_result
  FROM (
    SELECT DISTINCT ON (c.id)
      t.id AS tx_id,
      c.id AS copy_id,
      c.copy_number,
      t.borrowed_at,
      t.due_date,
      i.id AS item_id,
      i.name AS item_name,
      i.description AS item_description,
      cat.name AS category_name,
      loc.name AS location_name,
      COALESCE(
        (SELECT q.qr_uid FROM public.qr_codes q WHERE q.item_id = i.id AND q.is_active = true AND q.deleted_at IS NULL LIMIT 1),
        (SELECT q.qr_uid FROM public.qr_codes q WHERE q.copy_id = c.id AND q.is_active = true AND q.deleted_at IS NULL LIMIT 1),
        i.name
      ) AS qr_uid
    FROM public.inventory_copies c
    JOIN public.inventory_items i ON i.id = c.item_id
    JOIN public.transactions t ON t.copy_id = c.id
    LEFT JOIN public.categories cat ON cat.id = i.category_id
    LEFT JOIN public.locations loc ON loc.id = c.location_id
    WHERE c.status = 'borrowed'
      AND c.deleted_at IS NULL
      AND i.deleted_at IS NULL
      AND LOWER(t.borrower_email) = LOWER(v_session.email)
      AND t.type = 'borrow'
    ORDER BY c.id, t.created_at DESC
  ) sub;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$;

-- ============================================================================
-- RPC: borrow_copy(session_token, copy_id, due_days, qr_uid)
-- ============================================================================

DROP FUNCTION IF EXISTS public.borrow_copy(UUID, UUID, INTEGER);
DROP FUNCTION IF EXISTS public.borrow_copy(UUID, UUID, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION public.borrow_copy(
  p_session_token UUID,
  p_copy_id UUID DEFAULT NULL,
  p_due_days INTEGER DEFAULT NULL,
  p_qr_uid TEXT DEFAULT NULL
)
RETURNS public.transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session public.borrower_sessions%ROWTYPE;
  v_target_copy_id UUID;
  v_item_id UUID;
  v_due_date TIMESTAMPTZ;
  v_transaction public.transactions%ROWTYPE;
BEGIN
  -- Validate session
  SELECT * INTO v_session
  FROM public.borrower_sessions
  WHERE session_token = p_session_token
    AND status = 'active'
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired session';
  END IF;

  IF p_copy_id IS NOT NULL THEN
    v_target_copy_id := p_copy_id;
  ELSIF p_qr_uid IS NOT NULL THEN
    -- Resolve QR UID to item_id
    SELECT item_id, copy_id INTO v_item_id, v_target_copy_id
    FROM public.qr_codes
    WHERE qr_uid = p_qr_uid AND is_active = true AND deleted_at IS NULL;

    IF v_target_copy_id IS NULL AND v_item_id IS NULL THEN
      SELECT id INTO v_item_id
      FROM public.inventory_items
      WHERE (id::TEXT = p_qr_uid OR name ILIKE p_qr_uid) AND deleted_at IS NULL;
    END IF;

    IF v_target_copy_id IS NULL THEN
      IF v_item_id IS NULL THEN
        RAISE EXCEPTION 'Item not found for QR UID: %', p_qr_uid;
      END IF;

      -- Pick first available copy of this item
      SELECT id INTO v_target_copy_id
      FROM public.inventory_copies
      WHERE item_id = v_item_id
        AND status = 'available'
        AND deleted_at IS NULL
      ORDER BY copy_number ASC
      LIMIT 1;

      IF v_target_copy_id IS NULL THEN
        RAISE EXCEPTION 'No available copies remaining for item %', p_qr_uid;
      END IF;
    END IF;
  ELSE
    RAISE EXCEPTION 'Either copy_id or qr_uid must be provided';
  END IF;

  -- Calculate due date if configured
  IF p_due_days IS NOT NULL AND p_due_days > 0 THEN
    v_due_date := now() + (p_due_days || ' days')::INTERVAL;
  END IF;

  -- Create borrow transaction
  INSERT INTO public.transactions (
    type, copy_id, borrower_email, borrower_session_id,
    terminal_session_id, borrowed_at, due_date
  ) VALUES (
    'borrow', v_target_copy_id, v_session.email, v_session.id,
    v_session.terminal_id, now(), v_due_date
  )
  RETURNING * INTO v_transaction;

  -- Update copy status to borrowed
  UPDATE public.inventory_copies
  SET status = 'borrowed'
  WHERE id = v_target_copy_id;

  -- Refresh session expiry
  UPDATE public.borrower_sessions
  SET expires_at = now() + interval '10 minutes'
  WHERE id = v_session.id;

  RETURN v_transaction;
END;
$$;

-- ============================================================================
-- RPC: return_copy(session_token, copy_id, qr_uid)
-- ============================================================================

DROP FUNCTION IF EXISTS public.return_copy(UUID, UUID);
DROP FUNCTION IF EXISTS public.return_copy(UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION public.return_copy(
  p_session_token UUID,
  p_copy_id UUID DEFAULT NULL,
  p_qr_uid TEXT DEFAULT NULL
)
RETURNS public.transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session public.borrower_sessions%ROWTYPE;
  v_target_copy_id UUID;
  v_item_id UUID;
  v_transaction public.transactions%ROWTYPE;
BEGIN
  -- Validate session
  SELECT * INTO v_session
  FROM public.borrower_sessions
  WHERE session_token = p_session_token
    AND status = 'active'
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired session';
  END IF;

  IF p_copy_id IS NOT NULL THEN
    v_target_copy_id := p_copy_id;
  ELSIF p_qr_uid IS NOT NULL THEN
    -- Resolve QR UID to item_id or copy_id
    SELECT item_id, copy_id INTO v_item_id, v_target_copy_id
    FROM public.qr_codes
    WHERE qr_uid = p_qr_uid AND is_active = true AND deleted_at IS NULL;

    IF v_target_copy_id IS NULL AND v_item_id IS NULL THEN
      SELECT id INTO v_item_id
      FROM public.inventory_items
      WHERE (id::TEXT = p_qr_uid OR name ILIKE p_qr_uid) AND deleted_at IS NULL;
    END IF;

    IF v_target_copy_id IS NULL THEN
      IF v_item_id IS NULL THEN
        RAISE EXCEPTION 'Item not found for QR UID: %', p_qr_uid;
      END IF;

      -- Pick first borrowed copy of this item
      SELECT c.id INTO v_target_copy_id
      FROM public.inventory_copies c
      LEFT JOIN public.transactions t ON t.copy_id = c.id AND t.type = 'borrow' AND t.borrower_email = v_session.email
      WHERE c.item_id = v_item_id
        AND c.status = 'borrowed'
        AND c.deleted_at IS NULL
      ORDER BY t.created_at DESC NULLS LAST, c.updated_at DESC
      LIMIT 1;

      IF v_target_copy_id IS NULL THEN
        RAISE EXCEPTION 'No borrowed copies found to return for item %', p_qr_uid;
      END IF;
    END IF;
  ELSE
    RAISE EXCEPTION 'Either copy_id or qr_uid must be provided';
  END IF;

  -- Create return transaction
  INSERT INTO public.transactions (
    type, copy_id, borrower_email, borrower_session_id,
    terminal_session_id, returned_at
  ) VALUES (
    'return', v_target_copy_id, v_session.email, v_session.id,
    v_session.terminal_id, now()
  )
  RETURNING * INTO v_transaction;

  -- Update copy status back to available
  UPDATE public.inventory_copies
  SET status = 'available'
  WHERE id = v_target_copy_id;

  -- Refresh session expiry
  UPDATE public.borrower_sessions
  SET expires_at = now() + interval '10 minutes'
  WHERE id = v_session.id;

  RETURN v_transaction;
END;
$$;

-- ============================================================================
-- RPC: bulk_borrow_copies(session_token, copy_ids, due_days, qr_uids)
-- ============================================================================

DROP FUNCTION IF EXISTS public.bulk_borrow_copies(UUID, UUID[], INTEGER);
DROP FUNCTION IF EXISTS public.bulk_borrow_copies(UUID, UUID[], INTEGER, TEXT[]);

CREATE OR REPLACE FUNCTION public.bulk_borrow_copies(
  p_session_token UUID,
  p_copy_ids UUID[] DEFAULT NULL,
  p_due_days INTEGER DEFAULT NULL,
  p_qr_uids TEXT[] DEFAULT NULL
)
RETURNS SETOF public.transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_copy_id UUID;
  v_qr_uid TEXT;
  v_tx public.transactions%ROWTYPE;
BEGIN
  IF p_copy_ids IS NOT NULL AND array_length(p_copy_ids, 1) > 0 THEN
    FOREACH v_copy_id IN ARRAY p_copy_ids LOOP
      v_tx := public.borrow_copy(p_session_token, v_copy_id, p_due_days);
      RETURN NEXT v_tx;
    END LOOP;
  ELSIF p_qr_uids IS NOT NULL AND array_length(p_qr_uids, 1) > 0 THEN
    FOREACH v_qr_uid IN ARRAY p_qr_uids LOOP
      v_tx := public.borrow_copy(p_session_token, NULL, p_due_days, v_qr_uid);
      RETURN NEXT v_tx;
    END LOOP;
  END IF;
END;
$$;

-- ============================================================================
-- RPC: bulk_return_copies(session_token, copy_ids, qr_uids)
-- ============================================================================

DROP FUNCTION IF EXISTS public.bulk_return_copies(UUID, UUID[]);
DROP FUNCTION IF EXISTS public.bulk_return_copies(UUID, UUID[], TEXT[]);

CREATE OR REPLACE FUNCTION public.bulk_return_copies(
  p_session_token UUID,
  p_copy_ids UUID[] DEFAULT NULL,
  p_qr_uids TEXT[] DEFAULT NULL
)
RETURNS SETOF public.transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_copy_id UUID;
  v_qr_uid TEXT;
  v_tx public.transactions%ROWTYPE;
BEGIN
  IF p_copy_ids IS NOT NULL AND array_length(p_copy_ids, 1) > 0 THEN
    FOREACH v_copy_id IN ARRAY p_copy_ids LOOP
      v_tx := public.return_copy(p_session_token, v_copy_id);
      RETURN NEXT v_tx;
    END LOOP;
  ELSIF p_qr_uids IS NOT NULL AND array_length(p_qr_uids, 1) > 0 THEN
    FOREACH v_qr_uid IN ARRAY p_qr_uids LOOP
      v_tx := public.return_copy(p_session_token, NULL, v_qr_uid);
      RETURN NEXT v_tx;
    END LOOP;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.lookup_qr_for_counter IS
  'Looks up a QR UID and returns the associated copy + item details for counter display.';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.terminal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrower_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Drop policies if existing to allow idempotent re-runs
DROP POLICY IF EXISTS "admins_all_terminal_sessions" ON public.terminal_sessions;
DROP POLICY IF EXISTS "anon_select_terminal_sessions" ON public.terminal_sessions;
DROP POLICY IF EXISTS "admins_all_borrower_sessions" ON public.borrower_sessions;
DROP POLICY IF EXISTS "anon_select_borrower_sessions" ON public.borrower_sessions;
DROP POLICY IF EXISTS "anon_insert_borrower_sessions" ON public.borrower_sessions;
DROP POLICY IF EXISTS "admins_select_transactions" ON public.transactions;
DROP POLICY IF EXISTS "anon_select_transactions" ON public.transactions;
DROP POLICY IF EXISTS "anon_insert_transactions" ON public.transactions;
DROP POLICY IF EXISTS "anon_select_qr_codes" ON public.qr_codes;
DROP POLICY IF EXISTS "anon_select_inventory_copies" ON public.inventory_copies;
DROP POLICY IF EXISTS "anon_select_inventory_items" ON public.inventory_items;

-- Terminal Sessions: admins full access, anon read-only (check if open)
CREATE POLICY "admins_all_terminal_sessions" ON public.terminal_sessions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.user_id = auth.uid()
        AND ap.status = 'active'
        AND ap.deleted_at IS NULL
    )
  );

CREATE POLICY "anon_select_terminal_sessions" ON public.terminal_sessions
  FOR SELECT TO anon
  USING (true);

-- Borrower Sessions: anon can insert/select (through RPCs), admins full
CREATE POLICY "admins_all_borrower_sessions" ON public.borrower_sessions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.user_id = auth.uid()
        AND ap.status = 'active'
        AND ap.deleted_at IS NULL
    )
  );

CREATE POLICY "anon_select_borrower_sessions" ON public.borrower_sessions
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "anon_insert_borrower_sessions" ON public.borrower_sessions
  FOR INSERT TO anon
  WITH CHECK (true);

-- Transactions: admins can read all, anon can read own session
CREATE POLICY "admins_select_transactions" ON public.transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.user_id = auth.uid()
        AND ap.status = 'active'
        AND ap.deleted_at IS NULL
    )
  );

CREATE POLICY "anon_select_transactions" ON public.transactions
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "anon_insert_transactions" ON public.transactions
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow anon to read QR codes for counter lookup
CREATE POLICY "anon_select_qr_codes" ON public.qr_codes
  FOR SELECT TO anon
  USING (is_active = true AND deleted_at IS NULL);

-- Allow anon to read inventory copies for counter display
CREATE POLICY "anon_select_inventory_copies" ON public.inventory_copies
  FOR SELECT TO anon
  USING (deleted_at IS NULL);

-- Allow anon to read inventory items for counter display
CREATE POLICY "anon_select_inventory_items" ON public.inventory_items
  FOR SELECT TO anon
  USING (deleted_at IS NULL);

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.terminal_sessions TO authenticated;
GRANT SELECT ON public.terminal_sessions TO anon;

GRANT SELECT, INSERT, UPDATE ON public.borrower_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.borrower_sessions TO anon;

GRANT SELECT, INSERT ON public.transactions TO authenticated;
GRANT SELECT, INSERT ON public.transactions TO anon;

GRANT EXECUTE ON FUNCTION public.get_active_terminal TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_terminal TO anon;
GRANT EXECUTE ON FUNCTION public.open_terminal TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_terminal TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_borrower_otp TO anon;
GRANT EXECUTE ON FUNCTION public.verify_borrower_otp TO anon;
GRANT EXECUTE ON FUNCTION public.borrow_copy TO anon;
GRANT EXECUTE ON FUNCTION public.return_copy TO anon;
GRANT EXECUTE ON FUNCTION public.bulk_borrow_copies TO anon;
GRANT EXECUTE ON FUNCTION public.bulk_return_copies TO anon;
GRANT EXECUTE ON FUNCTION public.lookup_qr_for_counter TO anon;
GRANT EXECUTE ON FUNCTION public.get_borrower_active_loans TO anon;

-- Allow anon to update inventory_copies status (via RPCs only)
GRANT UPDATE ON public.inventory_copies TO anon;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
