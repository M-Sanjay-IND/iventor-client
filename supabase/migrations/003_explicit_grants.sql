-- ============================================================================
-- MIGRATION 003: Explicit Role Grants
-- ============================================================================
-- Depending on how tables are created in the Supabase SQL editor, the default
-- privileges for the 'authenticated' and 'anon' roles might not automatically 
-- apply, resulting in "permission denied for table" errors from the API.
-- 
-- This migration explicitly grants the necessary table permissions to the 
-- PostgREST web roles. (Row Level Security will still correctly prevent 
-- unauthorized data access).
-- ============================================================================

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant table access
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant sequence access (for any serial columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant routine/function access
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO service_role;
