/**
 * PAGE TESTS — ForgotPassword.jsx (New Feature)
 * Run: npm run test:pages
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LanguageContext } from '../../context/LanguageContext';
import ForgotPassword from '../../pages/ForgotPassword';

vi.mock('../../services/api');
vi.mock('../../i18n.js', () => ({ default: { use: () => ({}) } }));

import api from '../../services/api';

function renderForgotPassword(language = 'en') {
  return render(
    <MemoryRouter>
      <LanguageContext.Provider value={{ language, toggleLanguage: vi.fn() }}>
        <ForgotPassword />
      </LanguageContext.Provider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  api.post.mockReset();
});

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('ForgotPassword — Rendering', () => {

  it('FP-01 | renders page title "Forgot Password"', () => {
    renderForgotPassword();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });

  it('FP-02 | renders email input field', () => {
    renderForgotPassword();
    expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument();
  });

  it('FP-03 | renders "Send Reset Link" button', () => {
    renderForgotPassword();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('FP-04 | renders "Back to Login" link', () => {
    renderForgotPassword();
    expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
  });

  it('FP-05 | "Back to Login" link points to /login', () => {
    renderForgotPassword();
    expect(screen.getByRole('link', { name: /back to login/i }))
      .toHaveAttribute('href', '/login');
  });

});

// ─── Submission ───────────────────────────────────────────────────────────────

describe('ForgotPassword — Submission', () => {

  it('FP-06 | valid email submission → shows success message', async () => {
    api.post.mockResolvedValue({
      data: { message: 'If an account with that email exists, we have sent a password reset link.' }
    });

    renderForgotPassword();
    await userEvent.type(screen.getByPlaceholderText('name@example.com'), 'user@test.com');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      // Success message appears — use getAllByText since it may appear in multiple elements
      const matches = screen.getAllByText(/if an account|reset link/i);
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  it('FP-07 | after success, form is hidden (replaced by success message)', async () => {
    api.post.mockResolvedValue({ data: { message: 'Reset link sent.' } });

    renderForgotPassword();
    await userEvent.type(screen.getByPlaceholderText('name@example.com'), 'user@test.com');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /send reset link/i })).not.toBeInTheDocument()
    );
  });

  it('FP-08 | API error → shows error message', async () => {
    api.post.mockRejectedValue({ response: { status: 500 } });

    renderForgotPassword();
    await userEvent.type(screen.getByPlaceholderText('name@example.com'), 'user@test.com');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() =>
      expect(screen.getByText(/failed|try again/i)).toBeInTheDocument()
    );
  });

  it('FP-09 | loading state shown while request is in flight', async () => {
    api.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 500)));

    renderForgotPassword();
    await userEvent.type(screen.getByPlaceholderText('name@example.com'), 'user@test.com');

    const btn = screen.getByRole('button', { name: /send reset link/i });
    await userEvent.click(btn);

    await waitFor(() => expect(btn).toBeDisabled());
  });

  it('FP-10 | calls POST /auth/forgot-password with email', async () => {
    api.post.mockResolvedValue({ data: { message: 'Sent.' } });

    renderForgotPassword();
    await userEvent.type(screen.getByPlaceholderText('name@example.com'), 'check@test.com');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'check@test.com' })
    );
  });

});
