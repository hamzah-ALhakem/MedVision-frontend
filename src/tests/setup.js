/**
 * src/tests/setup.js
 *
 * Global test setup — runs before every test file.
 * - Imports jest-dom matchers (toBeInTheDocument, toHaveTextContent, etc.)
 * - Clears localStorage between tests
 * - Mocks i18n initialization to prevent real i18n from running
 */

import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock react-i18next globally so useTranslation() works without a real i18n instance
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
  Trans: ({ children }) => children,
}));

// Mock i18next-browser-languagedetector to avoid DOM detection issues
vi.mock('i18next-browser-languagedetector', () => ({
  default: { type: '3rdParty', init: vi.fn(), detect: vi.fn(() => 'en'), cacheUserLanguage: vi.fn() },
}));

// Automatically cleanup after each test (unmount components)
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});
