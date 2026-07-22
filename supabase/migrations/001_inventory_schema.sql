-- ============================================================================
-- INVENTOR CLIENT — CORE INVENTORY SCHEMA
-- Migration: 001_inventory_schema
-- ============================================================================
--
-- Creates the normalized inventory data model:
--   categories       → Hierarchical item classification
--   locations        → Hierarchical physical locations
--   inventory_items  → Abstract product definitions
--   inventory_copies → Physical instances of items
--
-- Follows CONSTITUTION: fully normalized, soft deletes, audit metadata,
-- RLS policies, indexes, constraints, triggers.
-- ============================================================================

-- ============================================================================
-- CATEGORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  parent_id   UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT categories_name_unique UNIQUE (name)
);

CREATE INDEX idx_categories_parent ON public.categories(parent_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_categories_deleted ON public.categories(deleted_at)
  WHERE deleted_at IS NOT NULL;

COMMENT ON TABLE public.categories IS 'Hierarchical inventory classification (e.g., Electronics > Laptops).';

-- ============================================================================
-- LOCATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  parent_id   UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT locations_name_unique UNIQUE (name)
);

CREATE INDEX idx_locations_parent ON public.locations(parent_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_locations_deleted ON public.locations(deleted_at)
  WHERE deleted_at IS NOT NULL;

COMMENT ON TABLE public.locations IS 'Hierarchical physical locations (e.g., Building A > Floor 2 > Room 201).';

-- ============================================================================
-- INVENTORY ITEMS (abstract product definitions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT DEFAULT '',
  category_id  UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  manufacturer TEXT,
  brand        TEXT,
  model        TEXT,
  sku          TEXT,
  unit_value   NUMERIC(12, 2),
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT inventory_items_sku_unique UNIQUE (sku)
);

CREATE INDEX idx_inventory_items_category ON public.inventory_items(category_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_inventory_items_name ON public.inventory_items(name)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_inventory_items_deleted ON public.inventory_items(deleted_at)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_inventory_items_metadata ON public.inventory_items
  USING GIN (metadata);

COMMENT ON TABLE public.inventory_items IS 'Abstract inventory item definitions. Each row is a product type, not a physical object.';

-- ============================================================================
-- INVENTORY COPIES (physical instances)
-- ============================================================================

CREATE TYPE public.copy_condition AS ENUM (
  'new', 'good', 'fair', 'poor', 'damaged', 'lost'
);

CREATE TYPE public.copy_status AS ENUM (
  'available', 'borrowed', 'reserved', 'maintenance', 'retired'
);

CREATE TABLE IF NOT EXISTS public.inventory_copies (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id          UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  copy_number      INTEGER NOT NULL,
  asset_tag        TEXT,
  location_id      UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  condition        public.copy_condition NOT NULL DEFAULT 'new',
  status           public.copy_status NOT NULL DEFAULT 'available',
  acquisition_date DATE,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ,
  created_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT inventory_copies_item_number_unique UNIQUE (item_id, copy_number),
  CONSTRAINT inventory_copies_asset_tag_unique UNIQUE (asset_tag)
);

CREATE INDEX idx_copies_item ON public.inventory_copies(item_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_copies_location ON public.inventory_copies(location_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_copies_status ON public.inventory_copies(status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_copies_condition ON public.inventory_copies(condition)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_copies_deleted ON public.inventory_copies(deleted_at)
  WHERE deleted_at IS NOT NULL;

COMMENT ON TABLE public.inventory_copies IS 'Physical instances of inventory items. Each row is one tangible object.';

-- ============================================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_inventory_copies_updated_at
  BEFORE UPDATE ON public.inventory_copies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_copies ENABLE ROW LEVEL SECURITY;

-- Admin-only policies: authenticated users with an admin_profiles record
-- can perform all operations on inventory tables.

CREATE POLICY "admins_select_categories" ON public.categories
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.user_id = auth.uid()
        AND ap.status = 'active'
        AND ap.deleted_at IS NULL
    )
  );

CREATE POLICY "admins_insert_categories" ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.user_id = auth.uid()
        AND ap.status = 'active'
        AND ap.deleted_at IS NULL
    )
  );

CREATE POLICY "admins_update_categories" ON public.categories
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.user_id = auth.uid()
        AND ap.status = 'active'
        AND ap.deleted_at IS NULL
    )
  );

-- Locations

CREATE POLICY "admins_select_locations" ON public.locations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.user_id = auth.uid()
        AND ap.status = 'active'
        AND ap.deleted_at IS NULL
    )
  );

CREATE POLICY "admins_insert_locations" ON public.locations
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.user_id = auth.uid()
        AND ap.status = 'active'
        AND ap.deleted_at IS NULL
    )
  );

CREATE POLICY "admins_update_locations" ON public.locations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.user_id = auth.uid()
        AND ap.status = 'active'
        AND ap.deleted_at IS NULL
    )
  );

-- Inventory Items

CREATE POLICY "admins_select_inventory_items" ON public.inventory_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.user_id = auth.uid()
        AND ap.status = 'active'
        AND ap.deleted_at IS NULL
    )
  );

CREATE POLICY "admins_insert_inventory_items" ON public.inventory_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.user_id = auth.uid()
        AND ap.status = 'active'
        AND ap.deleted_at IS NULL
    )
  );

CREATE POLICY "admins_update_inventory_items" ON public.inventory_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.user_id = auth.uid()
        AND ap.status = 'active'
        AND ap.deleted_at IS NULL
    )
  );

-- Inventory Copies

CREATE POLICY "admins_select_inventory_copies" ON public.inventory_copies
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.user_id = auth.uid()
        AND ap.status = 'active'
        AND ap.deleted_at IS NULL
    )
  );

CREATE POLICY "admins_insert_inventory_copies" ON public.inventory_copies
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.user_id = auth.uid()
        AND ap.status = 'active'
        AND ap.deleted_at IS NULL
    )
  );

CREATE POLICY "admins_update_inventory_copies" ON public.inventory_copies
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.user_id = auth.uid()
        AND ap.status = 'active'
        AND ap.deleted_at IS NULL
    )
  );

-- ============================================================================
-- RPCs: Aggregation Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_inventory_summary()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_items', (
      SELECT COUNT(*) FROM public.inventory_items WHERE deleted_at IS NULL
    ),
    'total_copies', (
      SELECT COUNT(*) FROM public.inventory_copies WHERE deleted_at IS NULL
    ),
    'copies_by_status', (
      SELECT json_object_agg(status, cnt)
      FROM (
        SELECT status, COUNT(*) AS cnt
        FROM public.inventory_copies
        WHERE deleted_at IS NULL
        GROUP BY status
      ) s
    ),
    'copies_by_condition', (
      SELECT json_object_agg(condition, cnt)
      FROM (
        SELECT condition, COUNT(*) AS cnt
        FROM public.inventory_copies
        WHERE deleted_at IS NULL
        GROUP BY condition
      ) c
    )
  ) INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_category_counts()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'category_id', c.id,
      'category_name', c.name,
      'item_count', COALESCE(counts.cnt, 0)
    )
  ) INTO result
  FROM public.categories c
  LEFT JOIN (
    SELECT category_id, COUNT(*) AS cnt
    FROM public.inventory_items
    WHERE deleted_at IS NULL
    GROUP BY category_id
  ) counts ON counts.category_id = c.id
  WHERE c.deleted_at IS NULL
  ORDER BY c.name;

  RETURN result;
END;
$$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
