"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { QuoteInput, QuoteListQuery } from "@/lib/validations/quote.schema";
import { QuotesListResponse, QuoteDetailResponse, CalculateQuoteResponse } from "./types";
import { ApiResponse } from "./client";
import toast from "react-hot-toast";

// Query keys
export const queryKeys = {
  quotes: ["quotes"] as const,
  quote: (id: string) => ["quotes", id] as const,
  factors: ["factors"] as const,
};

// Fetch all quotes with optimized caching
export function useQuotes(query?: Partial<QuoteListQuery>) {
  return useQuery<ApiResponse<QuotesListResponse>>({
    queryKey: [...queryKeys.quotes, query],
    queryFn: () => apiClient.getQuotes(query as QuoteListQuery),
    staleTime: 1000 * 60 * 2, // 2 minutes - data is fresh for 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes - keep unused data in cache for 5 minutes
    retry: 2, // Retry failed requests twice
    refetchOnWindowFocus: true, // Refetch when user returns to window
  });
}

// Fetch single quote with aggressive caching
export function useQuote(id: string) {
  return useQuery<ApiResponse<QuoteDetailResponse>>({
    queryKey: queryKeys.quote(id),
    queryFn: () => apiClient.getQuote(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes - quote details change less frequently
    gcTime: 1000 * 60 * 10, // 10 minutes - keep in cache longer
    retry: 2,
    refetchOnWindowFocus: false, // Don't refetch on focus to reduce API calls
  });
}

// Fetch lookup factors with long-term caching (rarely change)
export function useFactors() {
  return useQuery({
    queryKey: queryKeys.factors,
    queryFn: () => apiClient.getFactors(),
    staleTime: 1000 * 60 * 30, // 30 minutes - factors change very rarely
    gcTime: 1000 * 60 * 60, // 1 hour - keep in cache for a long time
    retry: 3, // Retry more times as these are critical
  });
}

// Prefetch quote data (useful for hover states and navigation)
export function usePrefetchQuote() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.quote(id),
      queryFn: () => apiClient.getQuote(id),
      staleTime: 1000 * 60 * 5,
    });
  };
}

// Calculate quote (no saving) with optimistic UI support
export function useCalculateQuote() {
  return useMutation<ApiResponse<CalculateQuoteResponse>, Error, any>({
    mutationFn: (input: any) => apiClient.calculateQuote(input),
    retry: 1, // Retry once on failure
  });
}

// Create quote with optimistic updates
export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: QuoteInput) => apiClient.createQuote(input),
    onSuccess: () => {
      // Invalidate and refetch quotes list
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes });
      toast.success("Quote created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create quote");
    },
    retry: 1, // Retry once on network failure
  });
}

// Update quote with optimistic updates
export function useUpdateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<QuoteInput> }) =>
      apiClient.updateQuote(id, input),
    // Optimistically update the cache before mutation completes
    onMutate: async ({ id, input }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.quote(id) });

      // Snapshot previous value
      const previousQuote = queryClient.getQueryData(queryKeys.quote(id));

      // Optimistically update to new value
      if (previousQuote) {
        queryClient.setQueryData(queryKeys.quote(id), (old: any) => ({
          ...old,
          data: {
            ...old.data,
            input: {
              ...old.data.input,
              ...input,
            },
          },
        }));
      }

      return { previousQuote };
    },
    onSuccess: (_, { id }) => {
      // Invalidate both list and detail
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes });
      queryClient.invalidateQueries({ queryKey: queryKeys.quote(id) });
      toast.success("Quote updated successfully!");
    },
    onError: (error: any, { id }, context) => {
      // Rollback on error
      if (context?.previousQuote) {
        queryClient.setQueryData(queryKeys.quote(id), context.previousQuote);
      }
      toast.error(error.message || "Failed to update quote");
    },
    retry: 1,
  });
}

// Delete quote with optimistic removal from list
export function useDeleteQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteQuote(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.quotes });

      // Snapshot previous value
      const previousQuotes = queryClient.getQueryData(queryKeys.quotes);

      // Optimistically remove from list
      queryClient.setQueriesData({ queryKey: queryKeys.quotes }, (old: any) => {
        if (!old?.data?.quotes) return old;
        return {
          ...old,
          data: {
            ...old.data,
            quotes: old.data.quotes.filter((q: any) => q.id !== id),
            stats: {
              ...old.data.stats,
              total: Math.max(0, (old.data.stats.total || 0) - 1),
            },
          },
        };
      });

      return { previousQuotes };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes });
      toast.success("Quote deleted successfully!");
    },
    onError: (error: any, _, context) => {
      // Rollback on error
      if (context?.previousQuotes) {
        queryClient.setQueryData(queryKeys.quotes, context.previousQuotes);
      }
      toast.error(error.message || "Failed to delete quote");
    },
    retry: 1,
  });
}
