/**
 * PAGE TESTS — Appointments.jsx
 * Run: npm run test:pages
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';
import Appointments from '../../pages/Appointments';

vi.mock('../../services/api');
import api from '../../services/api';

// Future date appointments (show up in Upcoming tab)
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 7);
const futureDateStr = futureDate.toISOString();

// Past date appointments (show up in History tab)
const pastDateStr = '2024-01-01T00:00:00.000Z';

const mockPatientAppointments = [
  {
    id: 1, doctor_id: 10, patient_id: 1,
    first_name: 'Khaled', last_name: 'Hassan',
    appointment_date: futureDateStr, appointment_time: '09:00',
    status: 'confirmed', reason: 'Annual checkup',
    specialty: 'Cardiology', clinic_address: 'Cairo Clinic', gender: null,
  },
  {
    id: 2, doctor_id: 11, patient_id: 1,
    first_name: 'Nour', last_name: 'Ahmed',
    appointment_date: pastDateStr, appointment_time: '11:00',
    status: 'cancelled', reason: 'Cancelled visit',
    specialty: 'Neurology', clinic_address: 'Alex Clinic', gender: null,
  },
];

const mockDoctorAppointments = [
  {
    id: 3, doctor_id: 2, patient_id: 5,
    first_name: 'Ahmed', last_name: 'Ali',
    appointment_date: futureDateStr, appointment_time: '09:00',
    status: 'pending', reason: 'Consultation',
    specialty: null, clinic_address: null, gender: 'Male',
  },
];

function renderAppointments({ role = 'patient', appointments = mockPatientAppointments } = {}) {
  api.get.mockResolvedValue({ data: appointments });
  api.put.mockResolvedValue({ data: {} });

  return render(
    <MemoryRouter>
      <AuthContext.Provider value={{
        user: { id: role === 'patient' ? 1 : 2, role },
        token: 'fake-token', isAuthenticated: true, loading: false,
        login: vi.fn(), logout: vi.fn(),
      }}>
        <LanguageContext.Provider value={{ language: 'en', toggleLanguage: vi.fn() }}>
          <Appointments />
        </LanguageContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  api.get.mockReset();
  api.put.mockReset();
});

// ─── Rendering & Tabs ─────────────────────────────────────────────────────────

describe('Appointments — Rendering & Tabs', () => {

  it('AP-01 | renders Upcoming and History tabs', async () => {
    renderAppointments();
    await waitFor(() => screen.getByText(/khaled/i));

    expect(screen.getByRole('button', { name: /upcoming/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument();
  });

  it('AP-02 | Upcoming tab is active by default', async () => {
    renderAppointments();
    await waitFor(() => screen.getByText(/khaled/i));
    // Confirmed future appointment should be visible
    expect(screen.getByText(/khaled/i)).toBeInTheDocument();
  });

  it('AP-03 | History tab shows cancelled/past appointments', async () => {
    renderAppointments();
    await waitFor(() => screen.getByText(/khaled/i));

    await userEvent.click(screen.getByRole('button', { name: /history/i }));

    await waitFor(() => expect(screen.getByText(/nour/i)).toBeInTheDocument());
  });

  it('AP-04 | empty state shown when no appointments in tab', async () => {
    api.get.mockResolvedValue({ data: [] });
    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: { id: 1, role: 'patient' }, token: 'tok', isAuthenticated: true, loading: false, login: vi.fn(), logout: vi.fn() }}>
          <LanguageContext.Provider value={{ language: 'en', toggleLanguage: vi.fn() }}>
            <Appointments />
          </LanguageContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByText(/no appointments/i)).toBeInTheDocument()
    );
  });

});

// ─── Role-Based Display ───────────────────────────────────────────────────────

describe('Appointments — Role-Based Display', () => {

  it('AP-05 | patient view shows "Dr." prefix on doctor name', async () => {
    renderAppointments({ role: 'patient', appointments: mockPatientAppointments });
    await waitFor(() => screen.getByText(/dr\. khaled hassan/i));
    expect(screen.getByText(/dr\. khaled hassan/i)).toBeInTheDocument();
  });

  it('AP-06 | doctor view shows patient name WITHOUT "Dr." prefix', async () => {
    renderAppointments({ role: 'doctor', appointments: mockDoctorAppointments });
    await waitFor(() => screen.getByText(/ahmed ali/i));
    // Should NOT have "Dr." prefix for patient name
    expect(screen.queryByText(/dr\. ahmed ali/i)).not.toBeInTheDocument();
    expect(screen.getByText('Ahmed Ali')).toBeInTheDocument();
  });

  it('AP-07 | doctor sees Accept/Reject on pending appointment', async () => {
    renderAppointments({ role: 'doctor', appointments: mockDoctorAppointments });
    await waitFor(() => screen.getByText(/ahmed ali/i));

    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
  });

  it('AP-08 | patient does NOT see Accept/Reject buttons', async () => {
    renderAppointments({ role: 'patient', appointments: mockPatientAppointments });
    await waitFor(() => screen.getByText(/khaled/i));

    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument();
  });

});

// ─── Appointment Card Content ─────────────────────────────────────────────────

describe('Appointments — Card Content', () => {

  it('AP-09 | appointment card shows visit reason', async () => {
    renderAppointments({ role: 'patient' });
    await waitFor(() => screen.getByText(/annual checkup/i));
    expect(screen.getByText(/annual checkup/i)).toBeInTheDocument();
  });

  it('AP-10 | appointment card shows time', async () => {
    renderAppointments({ role: 'patient' });
    await waitFor(() => screen.getByText('09:00'));
    expect(screen.getByText('09:00')).toBeInTheDocument();
  });

  it('AP-11 | appointment card shows clinic address', async () => {
    renderAppointments({ role: 'patient' });
    await waitFor(() => screen.getByText(/cairo clinic/i));
    expect(screen.getByText(/cairo clinic/i)).toBeInTheDocument();
  });

});

// ─── Doctor Actions ───────────────────────────────────────────────────────────

describe('Appointments — Doctor Actions', () => {

  it('AP-12 | doctor accepts appointment → PUT called with "confirmed"', async () => {
    renderAppointments({ role: 'doctor', appointments: mockDoctorAppointments });
    await waitFor(() => screen.getByText(/ahmed ali/i));

    await userEvent.click(screen.getByRole('button', { name: /accept/i }));

    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith('/appointments/3/status', { status: 'confirmed' })
    );
  });

  it('AP-13 | doctor rejects appointment → PUT called with "cancelled"', async () => {
    renderAppointments({ role: 'doctor', appointments: mockDoctorAppointments });
    await waitFor(() => screen.getByText(/ahmed ali/i));

    await userEvent.click(screen.getByRole('button', { name: /reject/i }));

    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith('/appointments/3/status', { status: 'cancelled' })
    );
  });

  it('AP-14 | FE-BUG-008: status update error shows NO UI feedback', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    api.put.mockRejectedValue({ response: { status: 500 } });

    renderAppointments({ role: 'doctor', appointments: mockDoctorAppointments });
    await waitFor(() => screen.getByText(/ahmed ali/i));

    await userEvent.click(screen.getByRole('button', { name: /accept/i }));

    await waitFor(() => {
      // BUG-008: error goes to console.log, NOT shown in the UI
      // Use specific error text from Appointments.jsx t.error value
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByText(/failed to update status/i)).not.toBeInTheDocument(); // ← BUG-008
    });

    consoleSpy.mockRestore();
  });

});
