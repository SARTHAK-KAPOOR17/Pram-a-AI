import { useQuery } from '@tanstack/react-query';
import api from '../services/api.js';

export const useHealth = () => {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      return await api.get('/health');
    },
    refetchInterval: 15000,
    retry: 1,
    staleTime: 10000,
  });
};
