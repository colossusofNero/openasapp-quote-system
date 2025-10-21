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

// Fetch all quotes
export function useQuotes(query?: Partial<QuoteListQuery>) {
  return useQuery<ApiResponse<QuotesListResponse>>({
    queryKey: [...queryKeys.quotes, query],
    queryFn: () => apiClient.getQuotes(query as QuoteListQuery),
  });
}

// Fetch single quote
export function useQuote(id: string) {
  return useQuery<ApiResponse<QuoteDetailResponse>>({
    queryKey: queryKeys.quote(id),
    queryFn: () => apiClient.getQuote(id),
    enabled: !!id,
  });
}

// Fetch lookup factors
export function useFactors() {
  return useQuery({
    queryKey: queryKeys.factors,
    queryFn: () => apiClient.getFactors(),
  });
}

// Calculate quote (no saving)
export function useCalculateQuote() {
  return useMutation<ApiResponse<CalculateQuoteResponse>, Error, any>({
    mutationFn: (input: any) => apiClient.calculateQuote(input),
  });
}

// Create quote
export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: QuoteInput) => apiClient.createQuote(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes });
      toast.success("Quote created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create quote");
    },
  });
}

// Update quote
export function useUpdateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<QuoteInput> }) =>
      apiClient.updateQuote(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes });
      queryClient.invalidateQueries({ queryKey: queryKeys.quote(id) });
      toast.success("Quote updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update quote");
    },
  });
}

// Delete quote
export function useDeleteQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteQuote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes });
      toast.success("Quote deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete quote");
    },
  });
}
