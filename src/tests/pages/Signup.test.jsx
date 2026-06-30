/**
 * PAGE TESTS — Signup.jsx
 * Run: npm run test:pages
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LanguageContext } from '../../context/LanguageContext';
import Signup from '../../pages/Signup';

vi.mock('../../services/api');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import api from '../../services/api';
const mockNavigate = vi.fn();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderSignup(language = 'en') {
  return render(
    <MemoryRouter>
      <LanguageContext.Provider value={{ language, toggleLanguage: vi.fn() }}>
        <Signup />
      </LanguageContext.Provider>
    </MemoryRouter>
  );
}

/** Get password inputs by their name attribute (Input has no htmlFor) */
const pwd     = () => document.querySelector('[name="password"]');
const confirm = () => document.querySelector('[name="confirmPassword"]');

/** Fill the common Step 2 patient fields */
async function fillStep2Base(email = 'a@test.com') {
  await userEvent.type(screen.getByPlaceholderText('Ex: Ahmed Mohamed'), 'Ahmed Ali');
  await userEvent.type(screen.getByPlaceholderText('name@example.com'), email);
  await userEvent.type(screen.getByPlaceholderText('10xxxxxxxx'), '1012345678');
}

/** Fill the doctor-specific fields */
async function fillDoctorFields() {
  await userEvent.type(screen.getByPlaceholderText(/internal medicine/i), 'Cardiology');
  await userEvent.type(screen.getByPlaceholderText(/MD-12345/i), 'LIC-001');
  await userEvent.type(screen.getByPlaceholderText(/cairo/i), 'Cairo');
}

beforeEach(() => {
  mockNavigate.mockClear();
  api.post.mockReset();
});

// ─── Step 1: Role Selection ───────────────────────────────────────────────────

describe('Signup — Step 1: Role Selection', () => {

  it('SG-01 | renders Patient and Doctor role cards', () => {
    renderSignup();
    expect(screen.getByText('Patient')).toBeInTheDocument();
    expect(screen.getByText('Doctor')).toBeInTheDocument();
  });

  it('SG-02 | clicking Patient card advances to Step 2', async () => {
    renderSignup();
    await userEvent.click(screen.getByText('Patient'));
    expect(screen.getByText(/step 2: personal info/i)).toBeInTheDocument();
  });

  it('SG-03 | clicking Doctor card advances to Step 2 with doctor-specific fields', async () => {
    renderSignup();
    await userEvent.click(screen.getByText('Doctor'));
    expect(screen.getByText(/medical specialty/i)).toBeInTheDocument();
  });

});

// ─── Step 2: Validation ───────────────────────────────────────────────────────

describe('Signup — Step 2: Validation', () => {

  it('SG-04 | single-word fullName → "at least two names" error', async () => {
    renderSignup();
    await userEvent.click(screen.getByText('Patient'));
    await userEvent.type(screen.getByPlaceholderText(/ex: ahmed/i), 'Ahmed');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() =>
      expect(screen.getByText(/at least two names/i)).toBeInTheDocument()
    );
  });

  it('SG-05 | invalid email format → form does not submit (validation blocks it)', async () => {
    api.post.mockResolvedValue({ data: {} });

    renderSignup();
    await userEvent.click(screen.getByText('Patient'));
    await userEvent.type(screen.getByPlaceholderText('Ex: Ahmed Mohamed'), 'Ahmed Ali');
    await userEvent.type(screen.getByPlaceholderText('name@example.com'), 'not-an-email');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Wait a moment — if validation worked, the API should NOT be called
    await new Promise(r => setTimeout(r, 500));
    expect(api.post).not.toHaveBeenCalled();

    // Also verify we're still on Step 2 (not redirected)
    expect(screen.getByText(/step 2/i)).toBeInTheDocument();
  });

  it('SG-06 | FE-BUG-006 FIXED: password < 8 chars now shows validation error', async () => {
    // BUG-006 FIXED: Signup.jsx now validates password >= 8 chars (was 6)
    renderSignup();
    await userEvent.click(screen.getByText('Patient'));
    await fillStep2Base();

    // Type 7-char password — now correctly blocked
    await userEvent.type(pwd(), 'pass123');   // 7 chars
    await userEvent.type(confirm(), 'pass123');

    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    // BUG-006 FIXED: "at least 8 characters" error now appears
    await waitFor(() => {
      const bodyText = document.body.textContent ?? '';
      expect(bodyText.includes('8 characters') || bodyText.includes('Password must be at least 8')).toBe(true);
    });
  });

  it('SG-07 | mismatched passwords → confirmation error', async () => {
    renderSignup();
    await userEvent.click(screen.getByText('Patient'));
    await fillStep2Base();
    await userEvent.type(pwd(), 'Password123');
    await userEvent.type(confirm(), 'DifferentPass');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() =>
      expect(screen.getByText(/do not match/i)).toBeInTheDocument()
    );
  });

});

// ─── Patient Registration ─────────────────────────────────────────────────────

describe('Signup — Patient Registration', () => {

  it('SG-08 | patient registration success → shows email verification notice', async () => {
    // FE-BUG-003 FIXED + new email verification flow:
    // Patient registration now shows a success screen with email verification notice
    // instead of navigating directly to /login
    api.post.mockResolvedValue({ data: { message: 'Registered' } });

    renderSignup();
    await userEvent.click(screen.getByText('Patient'));
    await fillStep2Base('patient@test.com');
    await userEvent.type(pwd(), 'Password123');
    await userEvent.type(confirm(), 'Password123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      // Now shows success screen with email verification notice
      const bodyText = document.body.textContent ?? '';
      expect(
        bodyText.includes('verify') ||
        bodyText.includes('Account Created') ||
        bodyText.includes('email inbox') ||
        mockNavigate.mock.calls.length > 0
      ).toBe(true);
    });
  });

  it('SG-09 | API error on registration → global error message shown', async () => {
    api.post.mockRejectedValue({ response: { data: { message: 'Server Error' } } });

    renderSignup();
    await userEvent.click(screen.getByText('Patient'));
    await fillStep2Base('fail@test.com');
    await userEvent.type(pwd(), 'Password123');
    await userEvent.type(confirm(), 'Password123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() =>
      expect(screen.getByText(/account creation failed/i)).toBeInTheDocument()
    );
  });

});

// ─── Doctor Flow ──────────────────────────────────────────────────────────────

describe('Signup — Doctor Flow', () => {

  async function fillDoctorStep2(email = 'doctor@test.com') {
    await userEvent.type(screen.getByPlaceholderText('Ex: Ahmed Mohamed'), 'Sara Hassan');
    await userEvent.type(screen.getByPlaceholderText('name@example.com'), email);
    await userEvent.type(screen.getByPlaceholderText('10xxxxxxxx'), '1012345678');
    await userEvent.type(screen.getByPlaceholderText(/internal medicine/i), 'Cardiology');
    await userEvent.type(screen.getByPlaceholderText(/MD-12345/i), 'LIC-001');
    await userEvent.type(screen.getByPlaceholderText(/cairo/i), 'Cairo');
    await userEvent.type(pwd(), 'Password123');
    await userEvent.type(confirm(), 'Password123');
  }

  it('SG-10 | doctor completes Step 2 and reaches Step 3 (schedule)', async () => {
    renderSignup();
    await userEvent.click(screen.getByText('Doctor'));
    await fillDoctorStep2('doc1@test.com');
    await userEvent.click(screen.getByRole('button', { name: /next: schedule/i }));

    await waitFor(() =>
      expect(screen.getByText(/set clinic schedule/i)).toBeInTheDocument()
    );
  });

  it('SG-11 | Step 3: no day selected → schedule validation error', async () => {
    renderSignup();
    await userEvent.click(screen.getByText('Doctor'));
    await fillDoctorStep2('doc2@test.com');
    await userEvent.click(screen.getByRole('button', { name: /next: schedule/i }));

    await waitFor(() => screen.getByText(/set clinic schedule/i));
    await userEvent.click(screen.getByRole('button', { name: /finish registration/i }));

    await waitFor(() =>
      expect(screen.getByText(/must select at least one/i)).toBeInTheDocument()
    );
  });

  it('SG-12 | doctor registration success → shows success screen', async () => {
    api.post.mockResolvedValue({ data: { requireApproval: true } });

    renderSignup();
    await userEvent.click(screen.getByText('Doctor'));
    await fillDoctorStep2('doc3@test.com');
    await userEvent.click(screen.getByRole('button', { name: /next: schedule/i }));

    await waitFor(() => screen.getByText(/set clinic schedule/i));

    // Select Monday (index 1 in the 7-day array)
    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[1]);

    await userEvent.click(screen.getByRole('button', { name: /finish registration/i }));

    await waitFor(() =>
      expect(screen.getByText(/request received successfully/i)).toBeInTheDocument()
    );
  });

});
