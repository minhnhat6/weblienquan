import '@testing-library/jest-dom/vitest';
import { beforeAll, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock localStorage for API route tests
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

beforeAll(() => {
  if (typeof localStorage === 'undefined') {
    global.localStorage = localStorageMock as any;
  }
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  if (localStorage) localStorage.clear();
});

// Mock fetch globally for tests
beforeAll(() => {
  global.fetch = vi.fn();
});

// Helper to mock successful API responses
export function mockFetchSuccess(data: any) {
  (global.fetch as any).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, data })
  });
}

// Helper to mock API errors
export function mockFetchError(error: string, status = 400) {
  (global.fetch as any).mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ success: false, error })
  });
}

// Reset fetch mock
export function resetFetchMock() {
  (global.fetch as any).mockReset();
}
