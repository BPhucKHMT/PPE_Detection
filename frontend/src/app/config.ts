const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '');

export function toWebSocketBaseUrl(httpBaseUrl: string): string {
  if (httpBaseUrl.startsWith('wss://') || httpBaseUrl.startsWith('ws://')) {
    return httpBaseUrl;
  }
  if (httpBaseUrl.startsWith('https://')) {
    return httpBaseUrl.replace('https://', 'wss://');
  }
  return httpBaseUrl.replace('http://', 'ws://');
}

const rawWsBaseUrl = import.meta.env.VITE_WS_BASE_URL;
export const WS_BASE_URL = rawWsBaseUrl ? rawWsBaseUrl.replace(/\/+$/, '') : toWebSocketBaseUrl(API_BASE_URL);
