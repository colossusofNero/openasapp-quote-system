import { QuoteInput, QuoteListQuery } from "@/lib/validations/quote.schema";

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    timestamp: string;
    version: string;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "/api") {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Request failed");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Quote endpoints
  async calculateQuote(input: any) {
    return this.request("/quotes/calculate", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async createQuote(input: QuoteInput) {
    return this.request("/quotes", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async getQuotes(query?: QuoteListQuery) {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    return this.request(`/quotes?${params.toString()}`);
  }

  async getQuote(id: string) {
    return this.request(`/quotes/${id}`);
  }

  async updateQuote(id: string, input: Partial<QuoteInput>) {
    return this.request(`/quotes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  async deleteQuote(id: string) {
    return this.request(`/quotes/${id}`, {
      method: "DELETE",
    });
  }

  async getFactors() {
    return this.request("/quotes/factors");
  }
}

export const apiClient = new ApiClient();
