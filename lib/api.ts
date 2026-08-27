import { QueryClient } from '@tanstack/react-query';
import supabase from './supabase';
import type { Load, DriverProfile } from '@/types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://arktms.runonark.com';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000, gcTime: 5 * 60 * 1000, retry: 1 },
  },
});

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: await authHeaders() });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body.slice(0, 120)}`);
  }
  return res.json();
}

async function apiPost<T>(path: string, body?: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: await authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text.slice(0, 120)}`);
  }
  return res.json();
}

export const apiClient = { get: apiGet, post: apiPost };

export async function fetchProfile(): Promise<DriverProfile> {
  return apiGet<DriverProfile>('/api/public/driver/profile');
}

export async function fetchLoads(scope?: string): Promise<Load[]> {
  const q = scope ? `?scope=${scope}` : '';
  const res = await apiGet<{ loads?: Load[] } | Load[]>(`/api/public/driver/loads${q}`);
  if (Array.isArray(res)) return res;
  return res.loads ?? [];
}
