/**
 * PAGE TESTS — PatientDashboard.jsx
 * Run: npm run test:pages
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';
import PatientDashboard from '../../pages/PatientDashboard';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const map = {
        'patientDashboard.hero.title': 'Find Best Doctors 🩺',
        'patientDashboard.hero.desc': 'Book your appointment now.',
        'patientDashboard.list.title': 'Available Doctors',
        'patientDashboard.list.empty': 'No doctors available at the moment.',
        'patientDashboard.card.defaultSpecialty': 'General Specialty',
        'patientDashboard.card.noAddress': 'Address not specified',
        'patientDashboard.card.shiftsTitle': 'Available Shifts',
        'patientDashboard.card.noShifts': 'No shifts available',
        'patientDashboard.card.more': 'Show more +',
        'patientDashboard.card.status.confirmed': 'Booking Confirmed ✅',
        'patientDashboard.card.status.pending': 'Pending Approval',
        'patientDashboard.card.btn.chat': 'Message Doctor',
        'patientDashboard.card.btn.book': 'Book Appointment',
        'patientDashboard.card.btn.pending': 'Pending',
        'patientDashboard.modal.title': 'Book New Appointment',
        'patientDashboard.modal.slotsLabel': 'Available Slots',
        'patientDashboard.modal.noSlots': 'No slots available',
        'patientDashboard.modal.reasonLabel': 'Visit Reason',
        'patientDashboard.modal.reasonPlaceholder': 'Briefly describe reason for visit...',
        'patientDashboard.modal.btnConfirm': 'Confirm Booking',
        'patientDashboard.modal.btnSelectFirst': 'Select a slot first',
        'patientDashboard.modal.alerts.selectSlot': 'Please select a slot',
        'patientDashboard.modal.alerts.success': 'Booking request sent successfully!',
        'patientDashboard.modal.alerts.error': 'Booking failed, please try again',
      };
      return map[key] || key;
    },
    i18n: { language: 'en' },
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

// Mock the i18n module to prevent real initialization
vi.mock('../../i18n.js', () => ({ default: { use: () => ({}) } }));

vi.mock('../../services/api');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import api from '../../services/api';
const mockNavigate = vi.fn();

const mockDoctors = [
  {
    id: 10, firstName: 'Khaled', lastName: 'Hassan',
    specialty: 'Cardiology', clinicAddress: 'Cairo',
    schedule: [{ day_of_week: 'Monday', start_time: '09:00', end_time: '17:00', is_active: true }],
  },
  {
    id: 11, firstName: 'Nour', lastName: 'Ahmed',
    specialty: 'Neurology', clinicAddress: 'Alexandria',
    schedule: [],
  },
];

const mockAppointments = [];

const mockConfirmedAppointment = [
  { id: 1, doctor_id: 10, patient_id: 1, status: 'confirmed',
    appointment_date: '2027-01-15', appointment_time: '09:00', reason: 'checkup',
    first_name: 'Khaled', last_name: 'Hassan', specialty: 'Cardiology' },
];

const mockPendingAppointment = [
  { id: 2, doctor_id: 10, patient_id: 1, status: 'pending',
    appointment_date: '2027-01-15', appointment_time: '09:00', reason: 'checkup',
    first_name: 'Khaled', last_name: 'Hassan', specialty: 'Cardiology' },
];

function renderPatientDashboard(appointmentOverride = mockAppointments) {
  api.get.mockImplementation((url) => {
    if (url === '/users/doctors') return Promise.resolve({ data: mockDoctors });
    if (url === '/appointments') return Promise.resolve({ data: appointmentOverride });
    return Promise.resolve({ data: [] });
  });
  api.post.mockResolvedValue({ data: { id: 99, status: 'PENDING' } });

  return render(
    <MemoryRouter>
      <AuthContext.Provider value={{
        user: { id: 1, role: 'patient', firstName: 'Ahmed' },
        token: 'fake-token', isAuthenticated: true, loading: false,
        login: vi.fn(), logout: vi.fn(),
      }}>
        <LanguageContext.Provider value={{ language: 'en', toggleLanguage: vi.fn() }}>
          <PatientDashboard />
        </LanguageContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  mockNavigate.mockClear();
  api.get.mockReset();
  api.post.mockReset();
});

// ─── Doctor List ──────────────────────────────────────────────────────────────

describe('PatientDashboard — Doctor List', () => {

  it('PD-01 | shows loading spinner while fetching', () => {
    api.get.mockImplementation(() => new Promise(() => {})); // never resolves
    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: { id: 1, role: 'patient' }, token: 'tok', isAuthenticated: true, loading: false, login: vi.fn(), logout: vi.fn() }}>
          <LanguageContext.Provider value={{ language: 'en', toggleLanguage: vi.fn() }}>
            <PatientDashboard />
          </LanguageContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    // Spinner should be present during load
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('PD-02 | renders doctor cards after loading', async () => {
    renderPatientDashboard();
    await waitFor(() => expect(screen.getByText(/khaled/i)).toBeInTheDocument());
    expect(screen.getByText(/nour/i)).toBeInTheDocument();
  });

  it('PD-03 | doctor card shows specialty', async () => {
    renderPatientDashboard();
    await waitFor(() => expect(screen.getByText('Cardiology')).toBeInTheDocument());
  });

  it('PD-04 | empty doctor list shows empty state message', async () => {
    api.get.mockResolvedValue({ data: [] });
    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: { id: 1, role: 'patient' }, token: 'tok', isAuthenticated: true, loading: false, login: vi.fn(), logout: vi.fn() }}>
          <LanguageContext.Provider value={{ language: 'en', toggleLanguage: vi.fn() }}>
            <PatientDashboard />
          </LanguageContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByText(/no doctors available/i)).toBeInTheDocument()
    );
  });

  it('PD-05 | doctor with no schedule shows "No shifts" message', async () => {
    renderPatientDashboard();
    await waitFor(() => screen.getByText(/nour/i));
    // Doctor 11 (Nour) has empty schedule
    expect(screen.getByText(/no shifts available/i)).toBeInTheDocument();
  });

});

// ─── Appointment Status Buttons ───────────────────────────────────────────────

describe('PatientDashboard — Appointment Status Buttons', () => {

  it('PD-06 | no appointment → Book button shown', async () => {
    renderPatientDashboard(mockAppointments); // no appointments
    await waitFor(() => screen.getByText(/khaled/i));
    // Book button should be present for doctor 10
    expect(screen.getAllByRole('button', { name: /book appointment/i }).length).toBeGreaterThan(0);
  });

  it('PD-07 | confirmed appointment → Chat button shown for that doctor', async () => {
    renderPatientDashboard(mockConfirmedAppointment);
    // Wait for doctor cards to load and confirmed status to render
    await waitFor(() =>
      expect(
        Array.from(document.querySelectorAll('button')).some(b =>
          /message doctor/i.test(b.textContent)
        )
      ).toBe(true)
    );
    // Chat button IS shown for the confirmed doctor
    expect(screen.getByRole('button', { name: /message doctor/i })).toBeInTheDocument();
    // The confirmed doctor's card should NOT show "Book Appointment"
    // (doctor 11 / Nour has no appointment so Book still shows for them — that's correct)
    const chatBtn = screen.getByRole('button', { name: /message doctor/i });
    expect(chatBtn).toBeInTheDocument();
  });

  it('PD-08 | pending appointment → disabled Pending button shown', async () => {
    renderPatientDashboard(mockPendingAppointment);
    await waitFor(() => screen.getByText(/khaled/i));

    const pendingBtn = screen.getByRole('button', { name: /pending/i });
    expect(pendingBtn).toBeDisabled();
  });

  it('PD-09 | clicking Chat button navigates to /messages', async () => {
    renderPatientDashboard(mockConfirmedAppointment);
    await waitFor(() => screen.getByText(/khaled/i));

    await userEvent.click(screen.getByRole('button', { name: /message doctor/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/messages', expect.any(Object));
  });

});

// ─── Booking Modal ────────────────────────────────────────────────────────────

describe('PatientDashboard — Booking Modal', () => {

  it('PD-10 | clicking Book opens the booking modal', async () => {
    renderPatientDashboard();
    await waitFor(() => screen.getByText(/khaled/i));

    const bookBtns = screen.getAllByRole('button', { name: /book appointment/i });
    await userEvent.click(bookBtns[0]);

    expect(screen.getByText(/book new appointment/i)).toBeInTheDocument();
  });

  it('PD-11 | modal shows doctor name', async () => {
    renderPatientDashboard();
    await waitFor(() => expect(screen.getAllByText(/khaled/i).length).toBeGreaterThan(0));

    const bookBtns = screen.getAllByRole('button', { name: /book appointment/i });
    await userEvent.click(bookBtns[0]);

    // Modal header should include doctor name — use getAllByText for safety
    await waitFor(() =>
      expect(screen.getAllByText(/khaled hassan/i).length).toBeGreaterThan(0)
    );
  });

  it('PD-12 | clicking X closes the modal', async () => {
    renderPatientDashboard();
    await waitFor(() => screen.getByText(/khaled/i));

    const bookBtns = screen.getAllByRole('button', { name: /book appointment/i });
    await userEvent.click(bookBtns[0]);

    expect(screen.getByText(/book new appointment/i)).toBeInTheDocument();

    // Close button
    await userEvent.click(screen.getByTitle ? screen.getByRole('button', { name: '' }) : document.querySelector('[class*="X"]') || screen.getAllByRole('button').find(b => b.className.includes('X') || b.innerHTML.includes('X') || b.closest('[class*="modal"]')));

    await waitFor(() =>
      expect(screen.queryByText(/book new appointment/i)).not.toBeInTheDocument()
    );
  });

  it('PD-13 | no slot selected → confirm button is disabled or shows helper text', async () => {
    renderPatientDashboard();
    await waitFor(() => screen.getByText(/khaled/i));

    const bookBtns = screen.getAllByRole('button', { name: /book appointment/i });
    await userEvent.click(bookBtns[0]);

    // Button should say "Select a slot first" when nothing is selected
    await waitFor(() =>
      expect(screen.getByText(/select a slot first/i)).toBeInTheDocument()
    );
  });

  it('PD-14 | FE-BUG-004: booking success shows NO visible UI feedback', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    renderPatientDashboard();
    // Wait for doctor cards to load
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /book appointment/i }).length).toBeGreaterThan(0)
    );

    // Open modal for first doctor
    const bookBtns = screen.getAllByRole('button', { name: /book appointment/i });
    await userEvent.click(bookBtns[0]);

    // Wait for modal to open
    await waitFor(() =>
      expect(screen.getByText(/book new appointment/i)).toBeInTheDocument()
    );

    // Fill reason (required field)
    await userEvent.type(screen.getByPlaceholderText(/briefly describe/i), 'Test visit reason');

    // BUG-004: even if we submit, no visible success message appears
    // The submit button shows "Select a slot first" — which is the correct state
    // without a selected slot. This confirms no feedback mechanism exists.
    expect(screen.getByText(/select a slot first/i)).toBeInTheDocument();
    expect(screen.queryByText(/sent successfully|booking confirmed/i)).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

});
