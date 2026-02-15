-- Prevent duplicate establishment groups per establishment
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_establishment_group 
ON public.chat_groups (establishment_id) 
WHERE group_type = 'establishment';