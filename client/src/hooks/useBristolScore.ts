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
      const response = await fetch(`/api/sites/${siteId}/update-score`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to update Bristol score');
      return response.json();
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
      const response = await fetch('/api/sites/update-all-scores', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to update all Bristol scores');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all Bristol score queries
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const firstKey = query.queryKey[0]?.toString();
          return Boolean(firstKey?.includes('bristol-score') || firstKey?.includes('portfolio-summary'));
        }
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

// Hook to get Bristol scores for multiple sites at once (for map display)
export function useBulkBristolScores(siteIds: string[]) {
  return useQuery({
    queryKey: ['/api/sites/bulk-bristol-scores', siteIds.sort().join(',')],
    enabled: siteIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    queryFn: async () => {
      // Since we don't have a bulk endpoint yet, we'll fetch the portfolio summary
      // which contains all site scores, then filter for the requested sites
      const response = await fetch('/api/sites/portfolio-summary');
      if (!response.ok) {
        throw new Error('Failed to fetch Bristol scores');
      }
      const data = await response.json();
      
      // If no scores calculated yet, trigger bulk update
      if (data.data?.portfolioMetrics?.scoredProperties === 0) {
        // Trigger bulk score calculation
        await fetch('/api/sites/update-all-scores', { method: 'POST' });
        // Refetch after update
        const updatedResponse = await fetch('/api/sites/portfolio-summary');
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json();
          return updatedData;
        }
      }
      
      return data;
    },
  });
}