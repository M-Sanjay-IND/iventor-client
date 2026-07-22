-- ============================================================================
-- MIGRATION 002: Fix RLS Recursion on Admin Profiles
-- ============================================================================
-- Fixes an infinite recursion issue caused by the admin_profiles policies
-- querying the admin_profiles table itself.
-- We solve this by using a SECURITY DEFINER function to bypass RLS during
-- the role check.
-- ============================================================================

-- 1. Create a SECURITY DEFINER function to safely check roles without triggering RLS
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER -- Bypasses RLS
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_profiles ap
    JOIN roles r ON r.id = ap.role_id
    WHERE ap.user_id = auth.uid()
      AND r.name = required_role
      AND ap.deleted_at IS NULL
      AND ap.status = 'active'
  );
$$;

-- 2. Drop the recursive policies from auth tables
DROP POLICY IF EXISTS admin_profiles_select_all ON public.admin_profiles;
DROP POLICY IF EXISTS admin_profiles_update_all ON public.admin_profiles;

-- 3. Recreate them using the safe function
CREATE POLICY admin_profiles_select_all ON public.admin_profiles
  FOR SELECT TO authenticated
  USING ( public.has_role('super_admin') );

CREATE POLICY admin_profiles_update_all ON public.admin_profiles
  FOR UPDATE TO authenticated
  USING ( public.has_role('super_admin') );

-- 4. Update audit_logs and login_attempts to use the safe function
DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
CREATE POLICY audit_logs_select ON public.audit_logs
  FOR SELECT TO authenticated
  USING ( public.has_role('super_admin') OR public.has_role('admin') );

DROP POLICY IF EXISTS login_attempts_select ON public.login_attempts;
CREATE POLICY login_attempts_select ON public.login_attempts
  FOR SELECT TO authenticated
  USING ( public.has_role('super_admin') );

-- 5. Update inventory table policies to also use the safe function (breaking their recursion)
-- Categories
DROP POLICY IF EXISTS "admins_select_categories" ON public.categories;
CREATE POLICY "admins_select_categories" ON public.categories FOR SELECT TO authenticated USING ( public.has_role('super_admin') OR public.has_role('admin') OR public.has_role('viewer') );

DROP POLICY IF EXISTS "admins_insert_categories" ON public.categories;
CREATE POLICY "admins_insert_categories" ON public.categories FOR INSERT TO authenticated WITH CHECK ( public.has_role('super_admin') OR public.has_role('admin') );

DROP POLICY IF EXISTS "admins_update_categories" ON public.categories;
CREATE POLICY "admins_update_categories" ON public.categories FOR UPDATE TO authenticated USING ( public.has_role('super_admin') OR public.has_role('admin') );

-- Locations
DROP POLICY IF EXISTS "admins_select_locations" ON public.locations;
CREATE POLICY "admins_select_locations" ON public.locations FOR SELECT TO authenticated USING ( public.has_role('super_admin') OR public.has_role('admin') OR public.has_role('viewer') );

DROP POLICY IF EXISTS "admins_insert_locations" ON public.locations;
CREATE POLICY "admins_insert_locations" ON public.locations FOR INSERT TO authenticated WITH CHECK ( public.has_role('super_admin') OR public.has_role('admin') );

DROP POLICY IF EXISTS "admins_update_locations" ON public.locations;
CREATE POLICY "admins_update_locations" ON public.locations FOR UPDATE TO authenticated USING ( public.has_role('super_admin') OR public.has_role('admin') );

-- Inventory Items
DROP POLICY IF EXISTS "admins_select_inventory_items" ON public.inventory_items;
CREATE POLICY "admins_select_inventory_items" ON public.inventory_items FOR SELECT TO authenticated USING ( public.has_role('super_admin') OR public.has_role('admin') OR public.has_role('viewer') );

DROP POLICY IF EXISTS "admins_insert_inventory_items" ON public.inventory_items;
CREATE POLICY "admins_insert_inventory_items" ON public.inventory_items FOR INSERT TO authenticated WITH CHECK ( public.has_role('super_admin') OR public.has_role('admin') );

DROP POLICY IF EXISTS "admins_update_inventory_items" ON public.inventory_items;
CREATE POLICY "admins_update_inventory_items" ON public.inventory_items FOR UPDATE TO authenticated USING ( public.has_role('super_admin') OR public.has_role('admin') );

-- Inventory Copies
DROP POLICY IF EXISTS "admins_select_inventory_copies" ON public.inventory_copies;
CREATE POLICY "admins_select_inventory_copies" ON public.inventory_copies FOR SELECT TO authenticated USING ( public.has_role('super_admin') OR public.has_role('admin') OR public.has_role('viewer') );

DROP POLICY IF EXISTS "admins_insert_inventory_copies" ON public.inventory_copies;
CREATE POLICY "admins_insert_inventory_copies" ON public.inventory_copies FOR INSERT TO authenticated WITH CHECK ( public.has_role('super_admin') OR public.has_role('admin') );

DROP POLICY IF EXISTS "admins_update_inventory_copies" ON public.inventory_copies;
CREATE POLICY "admins_update_inventory_copies" ON public.inventory_copies FOR UPDATE TO authenticated USING ( public.has_role('super_admin') OR public.has_role('admin') );
