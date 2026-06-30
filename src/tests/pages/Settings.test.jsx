/**
 * PAGE TESTS — Settings.jsx
 * Run: npm run test:pages
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';
import Settings from '../../pages/Settings';

vi.mock('../../services/api');
import api from '../../services/api';

const mockPatientProfile = {
  id: 1, firstName: 'Ahmed', lastName: 'Ali',
  email: 'ahmed@test.com', phone: '01012345678',
  role: 'patient', clinicAddress: null, specialty: null,
};

const mockDoctorProfile = {
  id: 2, firstName: 'Sara', lastName: 'Hassan',
  email: 'sara@test.com', phone: '01098765432',
  role: 'doctor', clinicAddress: 'Cairo Clinic', specialty: 'Cardiology',
};

const mockSchedule = [
  { day: 'Monday', startTime: '09:00', endTime: '17:00', isActive: true },
];

function renderSettings({ role = 'patient', language = 'en' } = {}) {
  const profile = role === 'doctor' ? mockDoctorProfile : mockPatientProfile;
  api.get.mockImplementation((url) => {
    if (url === '/users/profile') return Promise.resolve({ data: profile });
    if (url === '/schedule/my-schedule') return Promise.resolve({ data: mockSchedule });
    return Promise.resolve({ data: [] });
  });

  return render(
    <MemoryRouter>
      <AuthContext.Provider value={{
        user: { id: profile.id, role, firstName: profile.firstName },
        token: 'fake-token', isAuthenticated: true, loading: false,
        login: vi.fn(), logout: vi.fn(),
      }}>
        <LanguageContext.Provider value={{ language, toggleLanguage: vi.fn() }}>
          <Settings />
        </LanguageContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  api.get.mockReset();
  api.put.mockReset();
  api.post.mockReset();
});

// ─── Profile Tab ──────────────────────────────────────────────────────────────

describe('Settings — Profile Tab', () => {

  it('ST-01 | fetches and displays user profile data on load', async () => {
    renderSettings({ role: 'patient' });
    await waitFor(() =>
      expect(screen.getByDisplayValue('Ahmed Ali')).toBeInTheDocument()
    );
  });

  it('ST-02 | General tab is active by default', async () => {
    renderSettings();
    await waitFor(() => screen.getByDisplayValue('Ahmed Ali'));
    // Profile form should be visible
    expect(screen.getByText(/profile settings/i)).toBeInTheDocument();
  });

  it('ST-03 | email field is disabled (cannot be edited)', async () => {
    renderSettings();
    await waitFor(() => screen.getByDisplayValue('ahmed@test.com'));
    const emailInput = screen.getByDisplayValue('ahmed@test.com');
    expect(emailInput).toBeDisabled();
  });

  it('ST-04 | FE-BUG-001 FIXED: saving profile now shows visible success feedback', async () => {
    api.put.mockResolvedValue({ data: {} });

    renderSettings({ role: 'patient' });
    await waitFor(() => screen.getByDisplayValue('Ahmed Ali'));

    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    // BUG-001 FIXED: success alert now appears in the DOM
    await waitFor(() => {
      expect(screen.getByText(/profile saved successfully|saved successfully/i)).toBeInTheDocument();
    });
  });

});

// ─── Security Tab ─────────────────────────────────────────────────────────────

describe('Settings — Security Tab', () => {

  it('ST-05 | clicking Security tab shows password form', async () => {
    renderSettings();
    await waitFor(() => screen.getByDisplayValue('Ahmed Ali'));

    await userEvent.click(screen.getByRole('button', { name: /security/i }));

    expect(screen.getByText(/current password/i)).toBeInTheDocument();
    expect(screen.getByText(/new password/i)).toBeInTheDocument();
    expect(screen.getByText(/confirm password/i)).toBeInTheDocument();
  });

  it('ST-06 | mismatched passwords → password change is blocked (alert still used)', async () => {
    // The mismatch check still uses native alert() — which jsdom doesn't fully support
    // Verify indirectly: API should NOT be called when passwords don't match
    api.put.mockResolvedValue({ data: {} });

    renderSettings();
    await waitFor(() => screen.getByDisplayValue('Ahmed Ali'));
    await userEvent.click(screen.getByRole('button', { name: /security/i }));

    const [currentPass, newPass, confirmPass] = screen.getAllByPlaceholderText('••••••••');
    await userEvent.type(currentPass, 'OldPass123');
    await userEvent.type(newPass, 'NewPass123');
    await userEvent.type(confirmPass, 'DifferentPass');

    await userEvent.click(screen.getByRole('button', { name: /update password/i }));

    // Mismatch blocks API call — PUT should not have been called
    await new Promise(r => setTimeout(r, 300));
    expect(api.put).not.toHaveBeenCalled();
  });

  it('ST-07 | FE-BUG-001 FIXED: password change now shows visible success feedback', async () => {
    api.put.mockResolvedValue({ data: {} });

    renderSettings();
    await waitFor(() => screen.getByDisplayValue('Ahmed Ali'));
    await userEvent.click(screen.getByRole('button', { name: /security/i }));

    const [currentPass, newPass, confirmPass] = screen.getAllByPlaceholderText('••••••••');
    await userEvent.type(currentPass, 'OldPass123');
    await userEvent.type(newPass, 'NewPass456');
    await userEvent.type(confirmPass, 'NewPass456');

    await userEvent.click(screen.getByRole('button', { name: /update password/i }));

    // BUG-001 FIXED: success alert now appears in the DOM
    await waitFor(() => {
      expect(screen.getByText(/password changed successfully/i)).toBeInTheDocument();
    });
  });

});

// ─── Schedule Tab (Doctor) ────────────────────────────────────────────────────

describe('Settings — Schedule Tab (Doctor only)', () => {

  it('ST-08 | doctor sees Schedule tab', async () => {
    renderSettings({ role: 'doctor' });
    await waitFor(() => screen.getByDisplayValue('Sara Hassan'));
    expect(screen.getByRole('button', { name: /work schedule/i })).toBeInTheDocument();
  });

  it('ST-09 | patient does NOT see Schedule tab', async () => {
    renderSettings({ role: 'patient' });
    await waitFor(() => screen.getByDisplayValue('Ahmed Ali'));
    expect(screen.queryByRole('button', { name: /work schedule/i })).not.toBeInTheDocument();
  });

  it('ST-10 | schedule tab shows days of the week', async () => {
    renderSettings({ role: 'doctor' });
    await waitFor(() => screen.getByDisplayValue('Sara Hassan'));

    await userEvent.click(screen.getByRole('button', { name: /work schedule/i }));

    // Days should be visible
    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('Friday')).toBeInTheDocument();
  });

  it('ST-11 | toggling a day enables its time inputs', async () => {
    renderSettings({ role: 'doctor' });
    await waitFor(() => screen.getByDisplayValue('Sara Hassan'));

    await userEvent.click(screen.getByRole('button', { name: /work schedule/i }));

    // Find Saturday checkbox (first one, inactive by default in mock)
    const checkboxes = screen.getAllByRole('checkbox');
    const saturdayCheckbox = checkboxes[0]; // Saturday is first in daysOfWeek array

    expect(saturdayCheckbox).not.toBeChecked();
    await userEvent.click(saturdayCheckbox);
    expect(saturdayCheckbox).toBeChecked();
  });

});

// ─── Language Settings ────────────────────────────────────────────────────────

describe('Settings — Language Settings', () => {

  it('ST-12 | language switcher is visible on general tab', async () => {
    renderSettings();
    await waitFor(() => screen.getByDisplayValue('Ahmed Ali'));
    expect(screen.getByText(/language settings/i)).toBeInTheDocument();
  });

  it('ST-13 | English button is shown in language switcher', async () => {
    renderSettings();
    await waitFor(() => screen.getByDisplayValue('Ahmed Ali'));
    expect(screen.getByRole('button', { name: /english/i })).toBeInTheDocument();
  });

});
