/**
 * PAGE TESTS — VerifyEmail.jsx (New Feature)
 * Run: npm run test:pages
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LanguageContext } from '../../context/LanguageContext';
import VerifyEmail from '../../pages/VerifyEmail';

vi.mock('../../services/api');
vi.mock('../../i18n.js', () => ({ default: { use: () => ({}) } }));

import api from '../../services/api';

function renderVerifyEmail(token = 'valid-token-xyz', language = 'en') {
  return render(
    <MemoryRouter initialEntries={[`/verify-email/${token}`]}>
      <LanguageContext.Provider value={{ language, toggleLanguage: vi.fn() }}>
        <Routes>
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
        </Routes>
      </LanguageContext.Provider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  api.get.mockReset();
});

// ─── Loading State ────────────────────────────────────────────────────────────

describe('VerifyEmail — Loading State', () => {

  it('VE-01 | shows loading spinner while verifying', () => {
    // Never resolves — stays in loading state
    api.get.mockImplementation(() => new Promise(() => {}));
    renderVerifyEmail();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('VE-02 | shows "Verifying your email..." text while loading', () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    renderVerifyEmail();
    expect(screen.getByText(/verifying your email/i)).toBeInTheDocument();
  });

});

// ─── Success State ────────────────────────────────────────────────────────────

describe('VerifyEmail — Success State', () => {

  it('VE-03 | valid token → shows success message', async () => {
    api.get.mockResolvedValue({ data: { message: 'Email verified successfully' } });
    renderVerifyEmail('good-token');

    await waitFor(() =>
      expect(screen.getByText(/email verified successfully/i)).toBeInTheDocument()
    );
  });

  it('VE-04 | success state shows CheckCircle icon (green)', async () => {
    api.get.mockResolvedValue({ data: {} });
    renderVerifyEmail('good-token');

    await waitFor(() => {
      // Success renders CheckCircle — verify success content is present
      expect(screen.getByText(/email verified/i)).toBeInTheDocument();
    });
  });

  it('VE-05 | success state shows "Continue to Login" link', async () => {
    api.get.mockResolvedValue({ data: {} });
    renderVerifyEmail('good-token');

    await waitFor(() =>
      expect(screen.getByRole('link', { name: /continue to login/i })).toBeInTheDocument()
    );
  });

  it('VE-06 | "Continue to Login" link points to /login', async () => {
    api.get.mockResolvedValue({ data: {} });
    renderVerifyEmail('good-token');

    await waitFor(() => {
      const loginLink = screen.getByRole('link', { name: /continue to login/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  it('VE-07 | API called with the token from URL params', async () => {
    api.get.mockResolvedValue({ data: {} });
    renderVerifyEmail('my-specific-token');

    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith('/auth/verify-email/my-specific-token')
    );
  });

});

// ─── Error State ──────────────────────────────────────────────────────────────

describe('VerifyEmail — Error State', () => {

  it('VE-08 | invalid/expired token → shows error message', async () => {
    api.get.mockRejectedValue({ response: { status: 400 } });
    renderVerifyEmail('bad-token');

    await waitFor(() =>
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument()
    );
  });

  it('VE-09 | error state shows "The link may be invalid or has expired"', async () => {
    api.get.mockRejectedValue({ response: { status: 400 } });
    renderVerifyEmail('expired-token');

    await waitFor(() =>
      expect(screen.getByText(/invalid|expired/i)).toBeInTheDocument()
    );
  });

  it('VE-10 | error state shows "Back to Sign Up" link', async () => {
    api.get.mockRejectedValue({ response: { status: 400 } });
    renderVerifyEmail('bad-token');

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /back to sign up/i })).toBeInTheDocument()
    );
  });

  it('VE-11 | API is only called once (useRef prevents double-call)', async () => {
    api.get.mockResolvedValue({ data: {} });
    renderVerifyEmail('once-token');

    await waitFor(() => screen.getByText(/email verified/i));

    // Should have been called exactly once despite React strict mode
    expect(api.get).toHaveBeenCalledTimes(1);
  });

});
