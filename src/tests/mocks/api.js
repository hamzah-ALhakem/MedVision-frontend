/**
 * src/tests/mocks/api.js
 *
 * Mock for src/services/api.js (the axios instance).
 * Import this in test files with:
 *   vi.mock('../../services/api')
 *
 * Then in each test you can configure responses:
 *   api.get.mockResolvedValue({ data: [...] })
 *   api.post.mockRejectedValue({ response: { status: 400, data: { message: '...' } } })
 */

import { vi } from 'vitest';

const api = {
  get:    vi.fn(),
  post:   vi.fn(),
  put:    vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request:  { use: vi.fn() },
    response: { use: vi.fn() },
  },
};

export default api;
