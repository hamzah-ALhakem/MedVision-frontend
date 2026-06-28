/**
 * src/tests/setup.js
 *
 * Global test setup — runs before every test file.
 * - Imports jest-dom matchers (toBeInTheDocument, toHaveTextContent, etc.)
 * - Clears localStorage between tests
 * - Silences noisy console.error from React (prop-type warnings etc.)
 */

import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Automatically cleanup after each test (unmount components)
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});
