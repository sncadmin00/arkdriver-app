import { QueryClient } from '@tanstack/react-query';
import supabase from './supabase';
import type { Load, Driver } from '@/types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://arktms.runonark.com';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAuthHeader() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');
    return {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  async get<T>(path: string): Promise<T> {
    const headers = await this.getAuthHeader();
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers,
    });
    if (!response.ok) throw new Error('API error');
    return response.json();
  }

  async post<T>(path: string, body?: any): Promise<T> {
    const headers = await this.getAuthHeader();
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error('API error');
    return response.json();
  }
}

export const apiClient = new ApiClient(API_BASE);

export async function fetchLoads() {
  return apiClient.get<Load[]>('/api/public/driver/loads');
}

export async function fetchProfile() {
  return apiClient.get<Driver>('/api/public/driver/profile');
}
