import { apiRequest } from './client';

export async function fetchMagazinStatus() {
  return apiRequest('/api/v1/platform/magazin-status');
}
