import { useUnreadCounters } from './useUnreadCounters';

interface UnreadCounts {
  messagerie: number;
  groupes: number;
  total: number;
}

export const useUnreadMessages = () => {
  const { counters, refetch } = useUnreadCounters();

  const counts: UnreadCounts = {
    messagerie: counters.messagerie,
    groupes: counters.groupes,
    total: counters.messagerie + counters.groupes,
  };

  return {
    counts,
    loading: false,
    refetch,
  };
};
