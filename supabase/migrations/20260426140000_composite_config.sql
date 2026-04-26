-- =====================================================
-- Configuration avancée pour les bulletins composites
-- Stocke la mise en page par bloc (rendu séparé / fusionné),
-- les colonnes visibles par bloc, et la formule totale/seuil
-- =====================================================

ALTER TABLE public.evaluation_periods
  ADD COLUMN IF NOT EXISTS composite_config jsonb DEFAULT NULL;

COMMENT ON COLUMN public.evaluation_periods.composite_config IS
'JSON: { blocks: [{ period_id, render_mode: "block"|"merged", title, columns: [keys], order_index }], total: { enabled, label, formula, threshold, admitted_label, rejected_label } }';
