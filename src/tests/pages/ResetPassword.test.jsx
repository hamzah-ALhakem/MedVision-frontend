/**
 * PAGE TESTS — ResetPassword.jsx (New Feature)
 * Run: npm run test:pages
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LanguageContext } from '../../context/LanguageContext';
import ResetPassword from '../../pages/ResetPassword';

vi.mock('../../services/api');
vi.mock('../../i18n.js', () => ({ default: { use: () => ({}) } }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import api from '../../services/api';
const mockNavigate = vi.fn();

function renderResetPassword(token = 'valid-token-abc123', language = 'en') {
  return render(
    <MemoryRouter initialEntries={[`/reset-password/${token}`]}>
      <LanguageContext.Provider value={{ language, toggleLanguage: vi.fn() }}>
        <Routes>
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Routes>
      </LanguageContext.Provider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  mockNavigate.mockClear();
  api.post.mockReset();
});

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('ResetPassword — Rendering', () => {

  it('RP-01 | renders "Reset Password" title', () => {
    renderResetPassword();
    expect(screen.getByText(/reset password/i)).toBeInTheDocument();
  });

  it('RP-02 | renders New Password and Confirm Password fields', () => {
    renderResetPassword();
    // Use label elements specifically — subtitle text also contains "new"
    expect(screen.getByText('New Password')).toBeInTheDocument();
    expect(screen.getByText('Confirm Password')).toBeInTheDocument();
  });

  it('RP-03 | renders "Save Password" button', () => {
    renderResetPassword();
    expect(screen.getByRole('button', { name: /save password/i })).toBeInTheDocument();
  });

});

// ─── Validation ───────────────────────────────────────────────────────────────

describe('ResetPassword — Validation', () => {

  it('RP-04 | mismatched passwords → error shown', async () => {
    renderResetPassword();
    const [newPass, confirmPass] = screen.getAllByPlaceholderText('••••••••');
    await userEvent.type(newPass, 'Password123');
    await userEvent.type(confirmPass, 'DifferentPass');
    await userEvent.click(screen.getByRole('button', { name: /save password/i }));

    await waitFor(() =>
      expect(screen.getByText(/do not match/i)).toBeInTheDocument()
    );
  });

  it('RP-05 | password less than 8 chars → error shown', async () => {
    renderResetPassword();
    const [newPass, confirmPass] = screen.getAllByPlaceholderText('••••••••');
    await userEvent.type(newPass, 'short1');
    await userEvent.type(confirmPass, 'short1');
    await userEvent.click(screen.getByRole('button', { name: /save password/i }));

    await waitFor(() =>
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    );
  });

  it('RP-06 | API called only with valid matching passwords', async () => {
    api.post.mockResolvedValue({ data: { message: 'Password has been reset successfully.' } });

    renderResetPassword('my-reset-token');
    const [newPass, confirmPass] = screen.getAllByPlaceholderText('••••••••');
    await userEvent.type(newPass, 'NewPassword123');
    await userEvent.type(confirmPass, 'NewPassword123');
    await userEvent.click(screen.getByRole('button', { name: /save password/i }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/auth/reset-password/my-reset-token',
        { newPassword: 'NewPassword123' }
      )
    );
  });

});

// ─── Submission ───────────────────────────────────────────────────────────────

describe('ResetPassword — Submission', () => {

  it('RP-07 | successful reset → success message shown', async () => {
    api.post.mockResolvedValue({ data: { message: 'Password has been reset successfully.' } });

    renderResetPassword();
    const [newPass, confirmPass] = screen.getAllByPlaceholderText('••••••••');
    await userEvent.type(newPass, 'NewPassword123');
    await userEvent.type(confirmPass, 'NewPassword123');
    await userEvent.click(screen.getByRole('button', { name: /save password/i }));

    await waitFor(() =>
      expect(screen.getByText(/reset successfully/i)).toBeInTheDocument()
    );
  });

  it('RP-08 | after success, "Go to Login" button appears', async () => {
    api.post.mockResolvedValue({ data: { message: 'Password has been reset successfully.' } });

    renderResetPassword();
    const [newPass, confirmPass] = screen.getAllByPlaceholderText('••••••••');
    await userEvent.type(newPass, 'NewPassword123');
    await userEvent.type(confirmPass, 'NewPassword123');
    await userEvent.click(screen.getByRole('button', { name: /save password/i }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /go to login/i })).toBeInTheDocument()
    );
  });

  it('RP-09 | clicking "Go to Login" navigates to /login', async () => {
    api.post.mockResolvedValue({ data: { message: 'Password has been reset successfully.' } });

    renderResetPassword();
    const [newPass, confirmPass] = screen.getAllByPlaceholderText('••••••••');
    await userEvent.type(newPass, 'NewPassword123');
    await userEvent.type(confirmPass, 'NewPassword123');
    await userEvent.click(screen.getByRole('button', { name: /save password/i }));

    await waitFor(() => screen.getByRole('button', { name: /go to login/i }));
    await userEvent.click(screen.getByRole('button', { name: /go to login/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('RP-10 | invalid/expired token → error message shown', async () => {
    api.post.mockRejectedValue({
      response: { status: 400, data: { message: 'Invalid or expired reset token' } }
    });

    renderResetPassword('expired-token');
    const [newPass, confirmPass] = screen.getAllByPlaceholderText('••••••••');
    await userEvent.type(newPass, 'NewPassword123');
    await userEvent.type(confirmPass, 'NewPassword123');
    await userEvent.click(screen.getByRole('button', { name: /save password/i }));

    await waitFor(() =>
      expect(screen.getByText(/invalid|expired/i)).toBeInTheDocument()
    );
  });

  it('RP-11 | loading state shown while request is in flight', async () => {
    api.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 500)));

    renderResetPassword();
    const [newPass, confirmPass] = screen.getAllByPlaceholderText('••••••••');
    await userEvent.type(newPass, 'NewPassword123');
    await userEvent.type(confirmPass, 'NewPassword123');

    const btn = screen.getByRole('button', { name: /save password/i });
    await userEvent.click(btn);

    await waitFor(() => expect(btn).toBeDisabled());
  });

});
