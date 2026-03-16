
import { useState, useEffect, useCallback } from 'react';
import { promotionService, Promotion } from '@/services/promotionService';

export const usePromotions = (formationId?: string) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (formationId) {
        const data = await promotionService.getPromotionsByFormation(formationId);
        setPromotions(data || []);
      } else {
        const data = await promotionService.getAllPromotions();
        setPromotions(data || []);
      }
    } catch (err) {
      console.error('Erreur usePromotions:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des promotions');
    } finally {
      setLoading(false);
    }
  }, [formationId]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  return {
    promotions,
    loading,
    error,
    refetch: fetchPromotions
  };
};
