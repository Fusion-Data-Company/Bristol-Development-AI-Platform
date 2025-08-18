import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface BristolScoreComponents {
  demographics: number;
  marketDynamics: number;
  location: number;
  financial: number;
  riskAdjustment: number;
}

export interface BristolScoreResult {
  totalScore: number;
  components: BristolScoreComponents;
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D';
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'AVOID';
  rationale: string;
  lastCalculated: string;
}

export function useBristolScore(siteId: string) {
  return useQuery<{ success: boolean; data: BristolScoreResult }>({
    queryKey: [`/api/sites/${siteId}/bristol-score`],
    enabled: !!siteId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useUpdateBristolScore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (siteId: string) => {
      return apiRequest(`/api/sites/${siteId}/update-score`, {
        method: 'POST',
      });
    },
    onSuccess: (data, siteId) => {
      // Invalidate the specific site score
      queryClient.invalidateQueries({ 
        queryKey: [`/api/sites/${siteId}/bristol-score`] 
      });
      
      // Invalidate portfolio summary
      queryClient.invalidateQueries({ 
        queryKey: ['/api/sites/portfolio-summary'] 
      });
    },
  });
}

export function useUpdateAllBristolScores() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      return apiRequest('/api/sites/update-all-scores', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      // Invalidate all Bristol score queries
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0]?.toString().includes('bristol-score') ||
          query.queryKey[0]?.toString().includes('portfolio-summary')
      });
    },
  });
}

export function useBristolPortfolioSummary() {
  return useQuery({
    queryKey: ['/api/sites/portfolio-summary'],
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}