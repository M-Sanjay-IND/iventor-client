-- ============================================================================
-- INVENTOR CLIENT — DATABASE WIPE & RESET SCRIPT
-- ============================================================================
-- WARNING: Running this script will completely delete all existing inventory,
-- copies, transactions, borrower sessions, terminal sessions, and QR codes.
--
-- Execute this query in your Supabase SQL Editor to wipe out all data.
-- ============================================================================

-- 1. Wipe dependent transactional data
TRUNCATE TABLE public.transactions CASCADE;
TRUNCATE TABLE public.borrower_sessions CASCADE;
TRUNCATE TABLE public.terminal_sessions CASCADE;

-- 2. Wipe QR codes & inventory copies
TRUNCATE TABLE public.qr_codes CASCADE;
TRUNCATE TABLE public.inventory_copies CASCADE;

-- 3. Wipe inventory items, categories, and locations
TRUNCATE TABLE public.inventory_items CASCADE;
TRUNCATE TABLE public.categories CASCADE;
TRUNCATE TABLE public.locations CASCADE;

-- Optional: Reset sequence counters for clean IDs if using auto-increment
-- (UUID tables do not require sequence resets)

-- ============================================================================
-- END OF WIPE SCRIPT
-- ============================================================================
