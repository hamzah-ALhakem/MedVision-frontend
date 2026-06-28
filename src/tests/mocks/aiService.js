/**
 * src/tests/mocks/aiService.js
 *
 * Mock for src/services/aiService.js (the ML model API call).
 * Used in Screening tests to avoid real network calls.
 *
 * Usage in test file:
 *   vi.mock('../../services/aiService')
 *   import { predictTumor } from '../../services/aiService'
 *   predictTumor.mockResolvedValue({ diagnosis: 'malignant', confidence: 0.95 })
 */

import { vi } from 'vitest';

export const predictTumor = vi.fn();
