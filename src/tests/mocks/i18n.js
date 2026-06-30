/**
 * src/tests/mocks/i18n.js
 *
 * Mock for react-i18next — used in components that call useTranslation().
 * Returns translation keys as-is so tests can query by key or value.
 */

import { vi } from 'vitest';

const useMock = ((k) => k);
useMock.t = (k) => k;
useMock.i18n = {
  language: 'en',
  changeLanguage: vi.fn().mockResolvedValue(undefined),
};

export const useTranslation = () => useMock;
export const Trans = ({ children }) => children;

// Must export a valid i18next plugin object
export const initReactI18next = {
  type: '3rdParty',
  init: vi.fn(),
};
