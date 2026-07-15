-- ============================================================================
-- MIGRATION 001: Authentication Foundation
-- ============================================================================
-- Creates the foundational schema for admin authentication:
--   • roles           — Predefined role definitions
--   • admin_profiles  — Admin user metadata linked to auth.users
--   • audit_logs      — Immutable action log for compliance
--   • login_attempts  — Rate limiting and account lockout tracking
--
-- All tables include:
--   • Primary keys, foreign keys, indexes
--   • created_at / updated_at timestamps
--   • Soft delete (deleted_at) where appropriate
--   • Row Level Security (RLS) policies
-- ============================================================================

-- ============================================================================
-- UTILITY: updated_at trigger function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TABLE: roles
-- ============================================================================
-- Predefined, immutable role definitions.
-- Roles are NOT user-editable — they are seeded once.
-- ============================================================================
CREATE TABLE public.roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: auto-update updated_at
CREATE TRIGGER roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Seed predefined roles
INSERT INTO public.roles (name, description) VALUES
  ('super_admin', 'Full system access. Can manage all settings, users, and data.'),
  ('admin',       'Standard administrator. Can manage inventory, QR, and transactions.'),
  ('viewer',      'Read-only access to inventory and reports.');

-- RLS: roles are readable by authenticated users, not modifiable
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY roles_select ON public.roles
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- TABLE: admin_profiles
-- ============================================================================
-- Extended profile for admin users, linked 1:1 to auth.users.
-- Stores role assignment, display info, and account status.
-- ============================================================================
CREATE TABLE public.admin_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id     UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  first_name  TEXT NOT NULL DEFAULT '',
  last_name   TEXT NOT NULL DEFAULT '',
  avatar_url  TEXT,
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'suspended', 'deactivated')),
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ,
  created_by  UUID REFERENCES auth.users(id),
  updated_by  UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_admin_profiles_user_id ON public.admin_profiles(user_id);
CREATE INDEX idx_admin_profiles_role_id ON public.admin_profiles(role_id);
CREATE INDEX idx_admin_profiles_status  ON public.admin_profiles(status)
  WHERE deleted_at IS NULL;

-- Trigger: auto-update updated_at
CREATE TRIGGER admin_profiles_updated_at
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS: admins can read their own profile; super_admins can read all
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_profiles_select_own ON public.admin_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY admin_profiles_select_all ON public.admin_profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      JOIN public.roles r ON r.id = ap.role_id
      WHERE ap.user_id = auth.uid()
        AND r.name = 'super_admin'
        AND ap.deleted_at IS NULL
    )
  );

CREATE POLICY admin_profiles_update_own ON public.admin_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY admin_profiles_update_all ON public.admin_profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      JOIN public.roles r ON r.id = ap.role_id
      WHERE ap.user_id = auth.uid()
        AND r.name = 'super_admin'
        AND ap.deleted_at IS NULL
    )
  );

-- ============================================================================
-- TABLE: audit_logs
-- ============================================================================
-- Immutable log of every privileged action in the system.
-- Records are NEVER updated or deleted.
-- ============================================================================
CREATE TABLE public.audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id),
  action          TEXT NOT NULL,
  resource_type   TEXT,
  resource_id     UUID,
  details         JSONB DEFAULT '{}',
  ip_address      INET,
  user_agent      TEXT,
  result          TEXT NOT NULL DEFAULT 'success'
                    CHECK (result IN ('success', 'failure', 'error')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX idx_audit_logs_user_id    ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action     ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource   ON public.audit_logs(resource_type, resource_id)
  WHERE resource_type IS NOT NULL;

-- RLS: only super_admins and admins can read audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_select ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      JOIN public.roles r ON r.id = ap.role_id
      WHERE ap.user_id = auth.uid()
        AND r.name IN ('super_admin', 'admin')
        AND ap.deleted_at IS NULL
    )
  );

CREATE POLICY audit_logs_insert ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- TABLE: login_attempts
-- ============================================================================
-- Tracks login attempts for rate limiting and account lockout.
-- Used by the auth service to enforce MAX_FAILED_LOGIN_ATTEMPTS.
-- ============================================================================
CREATE TABLE public.login_attempts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  ip_address  INET,
  user_agent  TEXT,
  success     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying recent attempts by email
CREATE INDEX idx_login_attempts_email      ON public.login_attempts(email, created_at DESC);
CREATE INDEX idx_login_attempts_ip         ON public.login_attempts(ip_address, created_at DESC);

-- RLS: login_attempts are insert-only for authenticated, readable by admins
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY login_attempts_insert ON public.login_attempts
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY login_attempts_select ON public.login_attempts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      JOIN public.roles r ON r.id = ap.role_id
      WHERE ap.user_id = auth.uid()
        AND r.name = 'super_admin'
        AND ap.deleted_at IS NULL
    )
  );

-- ============================================================================
-- FUNCTION: Record audit log (callable from frontend via RPC)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.record_audit_log(
  p_action        TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id   UUID DEFAULT NULL,
  p_details       JSONB DEFAULT '{}',
  p_result        TEXT DEFAULT 'success'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details, result)
  VALUES (auth.uid(), p_action, p_resource_type, p_resource_id, p_details, p_result)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- END OF MIGRATION 001
-- ============================================================================
