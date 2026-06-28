/**
 * PAGE TESTS — Login.jsx
 * Run: npm run test:pages
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';
import Login from '../../pages/Login';

// Mock api and navigation
vi.mock('../../services/api');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import api from '../../services/api';
const mockNavigate = vi.fn();
const mockLogin = vi.fn();

function renderLogin(language = 'en') {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={{
        user: null, token: null, isAuthenticated: false,
        loading: false, login: mockLogin, logout: vi.fn(),
      }}>
        <LanguageContext.Provider value={{ language, toggleLanguage: vi.fn() }}>
          <Login />
        </LanguageContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  mockNavigate.mockClear();
  mockLogin.mockClear();
  api.post.mockReset();
});

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('Login — Rendering', () => {

  it('LG-01 | renders email and password fields', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('LG-02 | renders sign in button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('LG-03 | renders link to signup page', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: /sign up for free/i })).toBeInTheDocument();
  });

  it('LG-04 | FE-BUG-003: "Forgot Password?" link points to /forgot-password (non-existent route)', () => {
    renderLogin();
    const forgotLink = screen.getByRole('link', { name: /forgot password/i });
    // This route does not exist in App.jsx — documents BUG-003
    expect(forgotLink).toHaveAttribute('href', '/forgot-password');
  });

});

// ─── Successful Login ─────────────────────────────────────────────────────────

describe('Login — Successful Authentication', () => {

  it('LG-05 | patient login → navigates to /patient-dashboard', async () => {
    api.post.mockResolvedValue({
      data: { token: 'fake-token', user: { id: 1, role: 'patient', firstName: 'Ahmed' } }
    });

    renderLogin();
    await userEvent.type(screen.getByPlaceholderText('name@example.com'), 'ahmed@test.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('fake-token', expect.objectContaining({ role: 'patient' }));
      expect(mockNavigate).toHaveBeenCalledWith('/patient-dashboard');
    });
  });

  it('LG-06 | doctor login → navigates to /doctor-dashboard', async () => {
    api.post.mockResolvedValue({
      data: { token: 'fake-token', user: { id: 2, role: 'doctor', firstName: 'Sara' } }
    });

    renderLogin();
    await userEvent.type(screen.getByPlaceholderText('name@example.com'), 'sara@test.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/doctor-dashboard'));
  });

  it('LG-07 | admin login → navigates to /admin-dashboard', async () => {
    api.post.mockResolvedValue({
      data: { token: 'fake-token', user: { id: 3, role: 'admin', firstName: 'Admin' } }
    });

    renderLogin();
    await userEvent.type(screen.getByPlaceholderText('name@example.com'), 'admin@test.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin-dashboard'));
  });

  it('LG-08 | successful login calls login() with token and user', async () => {
    const fakeUser = { id: 1, role: 'patient', firstName: 'Ahmed' };
    api.post.mockResolvedValue({ data: { token: 'tok-123', user: fakeUser } });

    renderLogin();
    await userEvent.type(screen.getByPlaceholderText('name@example.com'), 'a@test.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'pass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('tok-123', fakeUser));
  });

});

// ─── Error States ─────────────────────────────────────────────────────────────

describe('Login — Error Handling', () => {

  it('LG-09 | wrong credentials (400) → error message shown in UI', async () => {
    api.post.mockRejectedValue({ response: { status: 400, data: { message: 'Invalid credentials' } } });

    renderLogin();
    await userEvent.type(screen.getByPlaceholderText('name@example.com'), 'bad@test.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument());
  });

  it('LG-10 | pending doctor (403) → FE-BUG-002: error detection broken for English backend messages', async () => {
    // Backend returns English: 'Account is under review'
    // But Login.jsx only matches Arabic strings → falls back to generic "Invalid credentials"
    api.post.mockRejectedValue({
      response: { status: 403, data: { message: 'Account is under review' } }
    });

    renderLogin();
    await userEvent.type(screen.getByPlaceholderText('name@example.com'), 'pending@test.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'pass123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      // BUG-002: Arabic matching fails — shows wrong generic error instead of pending message
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument(); // ← BUG-002
      // After fix: expect(screen.getByText(/under review|pending/i)).toBeInTheDocument()
    });
  });

  it('LG-11 | rejected doctor (403) → FE-BUG-002: error detection broken for English backend messages', async () => {
    // Backend returns English: 'Account has been rejected'
    // But Login.jsx only matches Arabic strings → shows wrong generic error
    api.post.mockRejectedValue({
      response: { status: 403, data: { message: 'Account has been rejected' } }
    });

    renderLogin();
    await userEvent.type(screen.getByPlaceholderText('name@example.com'), 'rej@test.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'pass123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      // BUG-002: should show "rejected" message but shows generic invalid error
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument(); // ← BUG-002
      // After fix: expect(screen.getByText(/rejected/i)).toBeInTheDocument()
    });
  });

  it('LG-12 | error message is NOT shown before any submission', () => {
    renderLogin();
    expect(screen.queryByText(/invalid email/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/rejected/i)).not.toBeInTheDocument();
  });

});

// ─── Loading State ────────────────────────────────────────────────────────────

describe('Login — Loading State', () => {

  it('LG-13 | button shows loading state while request is in flight', async () => {
    // Delay the response so we can check the loading state
    api.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 500)));

    renderLogin();
    await userEvent.type(screen.getByPlaceholderText('name@example.com'), 'a@test.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'pass');

    const button = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(button);

    // Button should be disabled while loading
    await waitFor(() => expect(button).toBeDisabled());
  });

});
