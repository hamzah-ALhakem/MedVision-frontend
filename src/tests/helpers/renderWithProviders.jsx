/**
 * src/tests/helpers/renderWithProviders.jsx
 *
 * A custom render function that wraps components with all the providers
 * they need: Router, AuthContext, LanguageContext, i18n.
 *
 * Usage:
 *   import { renderWithProviders } from '../helpers/renderWithProviders'
 *
 *   // Render as unauthenticated user (default)
 *   renderWithProviders(<Login />)
 *
 *   // Render as authenticated patient
 *   renderWithProviders(<PatientDashboard />, {
 *     user: { id: 1, role: 'patient', firstName: 'Ahmed', email: 'a@test.com' },
 *     token: 'fake-token'
 *   })
 *
 *   // Render as doctor
 *   renderWithProviders(<DoctorDashboard />, {
 *     user: { id: 2, role: 'doctor', firstName: 'Sara', email: 's@test.com' },
 *     token: 'fake-token'
 *   })
 */

import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';
import '../../i18n.js'; // initialize i18next

// Default auth state — unauthenticated
const defaultAuth = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  login: () => {},
  logout: () => {},
};

// Default language state
const defaultLang = {
  language: 'en',
  toggleLanguage: () => {},
};

export function renderWithProviders(
  ui,
  {
    user = null,
    token = null,
    language = 'en',
    initialEntries = ['/'],
    ...renderOptions
  } = {}
) {
  const authValue = {
    ...defaultAuth,
    user,
    token,
    isAuthenticated: !!token,
  };

  const langValue = {
    ...defaultLang,
    language,
  };

  function Wrapper({ children }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <AuthContext.Provider value={authValue}>
          <LanguageContext.Provider value={langValue}>
            {children}
          </LanguageContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Shorthand factories
export const renderAsPatient = (ui, options = {}) =>
  renderWithProviders(ui, {
    user: { id: 1, role: 'patient', firstName: 'Ahmed', lastName: 'Test', email: 'patient@test.com' },
    token: 'fake-patient-token',
    ...options,
  });

export const renderAsDoctor = (ui, options = {}) =>
  renderWithProviders(ui, {
    user: { id: 2, role: 'doctor', firstName: 'Sara', lastName: 'Test', email: 'doctor@test.com' },
    token: 'fake-doctor-token',
    ...options,
  });

export const renderAsAdmin = (ui, options = {}) =>
  renderWithProviders(ui, {
    user: { id: 3, role: 'admin', firstName: 'Admin', lastName: 'User', email: 'admin@test.com' },
    token: 'fake-admin-token',
    ...options,
  });
