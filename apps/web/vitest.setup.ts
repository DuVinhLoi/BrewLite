import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

const navigation = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
export const router = navigation;

vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState(null, '', '/');
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Unexpected network request'))));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
