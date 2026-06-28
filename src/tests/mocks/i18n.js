/**
 * src/tests/mocks/i18n.js
 *
 * Mock for react-i18next — used in components that call useTranslation().
 * Returns translation keys as-is so tests can query by key or value.
 *
 * Usage: add to vite.config.js or import at top of test that uses useTranslation.
 * Vitest automatically picks up __mocks__ directories adjacent to node_modules.
 */

// This file is used via vi.mock('react-i18next') in test files
import { vi } from 'vitest';

const useMock = ((k) => k);
useMock.t = (k) => k;
useMock.i18n = {
  language: 'en',
  changeLanguage: vi.fn().mockResolvedValue(undefined),
};

export const useTranslation = () => useMock;
export const Trans = ({ children }) => children;
export const initReactI18next = { type: '3rdParty', init: vi.fn() };
