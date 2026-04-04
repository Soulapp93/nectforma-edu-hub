-- Extensions pg_cron et pg_net: activer depuis Supabase Dashboard > Database > Extensions
-- Le cron job manage-attendance-timing sera configuré après migration
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
