// localStorage helpers for API keys

import { ModelConfig } from './types';

const KEYS = {
  OPENROUTER_API_KEY: 'openrouter_api_key',
  TAVILY_API_KEY: 'tavily_api_key',
  CUSTOM_MODELS: 'council_custom_models',
} as const;

export function getOpenRouterKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEYS.OPENROUTER_API_KEY);
}

export function setOpenRouterKey(key: string): void {
  localStorage.setItem(KEYS.OPENROUTER_API_KEY, key);
}

export function getTavilyKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEYS.TAVILY_API_KEY);
}

export function setTavilyKey(key: string): void {
  localStorage.setItem(KEYS.TAVILY_API_KEY, key);
}

export function hasOpenRouterKey(): boolean {
  const key = getOpenRouterKey();
  return !!key && key.length > 0;
}

export function hasTavilyKey(): boolean {
  const key = getTavilyKey();
  return !!key && key.length > 0;
}

export function clearAllKeys(): void {
  localStorage.removeItem(KEYS.OPENROUTER_API_KEY);
  localStorage.removeItem(KEYS.TAVILY_API_KEY);
}

// Custom models storage
export function getCustomModels(): ModelConfig[] | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(KEYS.CUSTOM_MODELS);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function setCustomModels(models: ModelConfig[]): void {
  localStorage.setItem(KEYS.CUSTOM_MODELS, JSON.stringify(models));
}

export function clearCustomModels(): void {
  localStorage.removeItem(KEYS.CUSTOM_MODELS);
}