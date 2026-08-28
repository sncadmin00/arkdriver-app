import { QueryClient } from '@tanstack/react-query';
import supabase from './supabase';
import i18n from '@/i18n';
import type { Load, DriverProfile } from '@/types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://arktms.runonark.com';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000, gcTime: 5 * 60 * 1000, retry: 1 },
  },
});


export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  const text = await res.text();
  try {
    const body = JSON.parse(text);
    return new ApiError(body.error ?? text, res.status, body.code);
  } catch {
    return new ApiError(text.slice(0, 200) || `Request failed (${res.status})`, res.status);
  }
}

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
    'Accept-Language': i18n.language || 'en',
  };
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: await authHeaders() });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

async function apiPost<T>(path: string, body?: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: await authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw await toApiError(res);
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

export async function fetchLoadDetail(id: string): Promise<any> {
  return apiGet<any>(`/api/public/driver/loads/${id}`);
}

export async function checkInLoad(id: string, status: string): Promise<any> {
  return apiPost<any>(`/api/public/driver/loads/${id}/check-in`, { status });
}

export async function uploadDocument(id: string, payload: {
  docKey: string;
  fileName: string;
  mimeType: string;
  contentBase64: string;
  signatureName?: string;
  notes?: string;
  stopIndex?: number;
}): Promise<any> {
  return apiPost<any>(`/api/public/driver/loads/${id}/documents`, payload);
}

export async function checkInStop(
  loadId: string,
  stopIndex: number,
  event: 'arrived' | 'departed'
): Promise<any> {
  return apiPost<any>(`/api/public/driver/loads/${loadId}/stops/${stopIndex}/check-in`, { event });
}

export async function fetchChatMessages(params?: { loadRef?: string; before?: string; limit?: number }) {
  const q = new URLSearchParams();
  q.set('limit', String(params?.limit ?? 50));
  if (params?.loadRef) q.set('loadRef', params.loadRef);
  if (params?.before) q.set('before', params.before);
  return apiGet<{ threadId: string; messages: any[] }>(`/api/public/driver/chat/messages?${q}`);
}

export async function sendChatMessage(payload: {
  body: string;
  loadRef?: string;
  clientKey: string;
}) {
  return apiPost<any>('/api/public/driver/chat/messages', { kind: 'text', ...payload });
}

export async function markChatRead(upTo?: string) {
  return apiPost<any>('/api/public/driver/chat/read', upTo ? { upTo } : {});
}

export async function fetchServices() {
  return apiGet<any>('/api/public/driver/services');
}

export async function fetchAnnouncements() {
  return apiGet<any>('/api/public/driver/announcements');
}

export async function setOffStatus(readyAt: string | null) {
  return apiPost<any>('/api/public/driver/status/set-off', { readyAt });
}

export async function fetchCompliance() {
  return apiGet<any>('/api/public/driver/compliance');
}

export async function fetchTruckDocuments() {
  return apiGet<any>('/api/public/driver/truck-documents');
}

export async function fetchDocumentUrl(documentId: string) {
  return apiGet<{ url: string; fileName?: string; mimeType?: string }>(
    `/api/public/driver/compliance/documents/${documentId}/url`
  );
}

export async function fetchAccounting() {
  return apiGet<{ adjustments: any[]; payments: any[] }>('/api/public/driver/accounting');
}

export async function fetchSettlement(week?: string) {
  const q = week ? `?week=${week}` : '';
  return apiGet<{ settlement: any }>(`/api/public/driver/settlement${q}`);
}

export async function fetchDebts(week?: string) {
  const q = week ? `?week=${week}` : '';
  return apiGet<any>(`/api/public/driver/debts${q}`);
}

export function mondayOf(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x.toISOString().slice(0, 10);
}

export function shiftWeek(iso: string, weeks: number) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

export async function fetchFuel(week) {
  const q = week ? `?week=${week}` : '';
  return apiGet(`/api/public/driver/fuel${q}`);
}

export async function fetchTolls(week) {
  const q = week ? `?week=${week}` : '';
  return apiGet(`/api/public/driver/tolls${q}`);
}

export async function fetchNavigation(loadId) {
  return apiGet(`/api/public/driver/loads/${loadId}/navigation`);
}

export async function setDriverLanguage(language: string) {
  return apiPost<any>('/api/public/driver/profile/language', { language });
}

export async function fetchYtd(year?: number) {
  const q = year ? `?year=${year}` : '';
  return apiGet<any>(`/api/public/driver/ytd${q}`);
}

export async function fetchTaxDocuments() {
  return apiGet<any>('/api/public/driver/tax-documents');
}

export async function fetchTaxDocumentUrl(year: string | number) {
  return apiGet<{ url: string }>(`/api/public/driver/tax-documents/${year}/url`);
}

export async function createBankLink() {
  return apiPost<{ url: string }>('/api/public/driver/profile/bank-link', {});
}

export async function fetchInspectionTemplate() {
  return apiGet<any>('/api/public/driver/inspection/template');
}

export async function submitInspection(payload: any) {
  return apiPost<any>('/api/public/driver/inspection', payload);
}

export async function fetchInspections(limit = 20) {
  return apiGet<any>(`/api/public/driver/inspection?limit=${limit}`);
}

export async function submitIncident(payload: any) {
  return apiPost<any>('/api/public/driver/incidents', payload);
}

export async function fetchIncidents(limit = 20, kind?: string) {
  const q = new URLSearchParams({ limit: String(limit) });
  if (kind) q.set('kind', kind);
  return apiGet<any>(`/api/public/driver/incidents?${q}`);
}

export async function mapRoute(payload: {
  destination: any;
  origin?: any;
  mode: 'truck' | 'bobtail';
}) {
  return apiPost<any>('/api/public/driver/map/route', payload);
}

export async function mapSuggest(q: string, coords?: { lat: number; lng: number }) {
  const p = new URLSearchParams({ q });
  if (coords) { p.set('lat', String(coords.lat)); p.set('lng', String(coords.lng)); }
  return apiGet<any>(`/api/public/driver/map/suggest?${p}`);
}

export async function fetchPlaces() {
  return apiGet<any>('/api/public/driver/map/places');
}

export async function savePlace(payload: { label: string; address: string; mode?: string; lat?: number; lng?: number }) {
  return apiPost<any>('/api/public/driver/map/places', payload);
}
