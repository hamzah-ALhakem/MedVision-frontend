/**
 * COMPONENT TESTS — ProtectedRoute
 *
 * Tests authentication enforcement and role-based access control.
 *
 * Run: npm run test:components
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import ProtectedRoute from '../../components/auth/ProtectedRoute';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Render a ProtectedRoute in a mini router environment.
 *
 * @param {object} authValue   - what AuthContext provides
 * @param {string[]} allowedRoles - roles allowed for this route (optional)
 * @param {string} initialPath - the URL the user is visiting
 */
function renderProtected({
  authValue,
  allowedRoles = undefined,
  initialPath = '/protected',
}) {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          {/* Public pages */}
          <Route path="/login"            element={<div>Login Page</div>} />
          <Route path="/patient-dashboard" element={<div>Patient Dashboard</div>} />
          <Route path="/doctor-dashboard"  element={<div>Doctor Dashboard</div>} />
          <Route path="/admin-dashboard"   element={<div>Admin Dashboard</div>} />
          <Route path="/"                  element={<div>Home Page</div>} />

          {/* Protected route wrapping a dummy page */}
          <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>

          {/* Role-specific protected routes (mirrors App.jsx structure) */}
          <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
            <Route path="/patient-only" element={<div>Patient Only</div>} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
            <Route path="/doctor-only" element={<div>Doctor Only</div>} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin-only" element={<div>Admin Only</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

// ─── Auth states ──────────────────────────────────────────────────────────────

const unauthenticated = {
  user: null, token: null, isAuthenticated: false, loading: false,
  login: () => {}, logout: () => {},
};

const asPatient = {
  user: { id: 1, role: 'patient', firstName: 'Ahmed', email: 'p@test.com' },
  token: 'fake-token', isAuthenticated: true, loading: false,
  login: () => {}, logout: () => {},
};

const asDoctor = {
  user: { id: 2, role: 'doctor', firstName: 'Sara', email: 'd@test.com' },
  token: 'fake-token', isAuthenticated: true, loading: false,
  login: () => {}, logout: () => {},
};

const asAdmin = {
  user: { id: 3, role: 'admin', firstName: 'Admin', email: 'a@test.com' },
  token: 'fake-token', isAuthenticated: true, loading: false,
  login: () => {}, logout: () => {},
};

const loadingState = {
  user: null, token: null, isAuthenticated: false, loading: true,
  login: () => {}, logout: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('ProtectedRoute — Authentication', () => {

  it('PR-01 | unauthenticated user is redirected to /login', () => {
    renderProtected({ authValue: unauthenticated });

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('PR-02 | authenticated user can access a protected route', () => {
    renderProtected({ authValue: asPatient });

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('PR-03 | while loading=true, shows loading indicator (not redirect)', () => {
    renderProtected({ authValue: loadingState });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

});

describe('ProtectedRoute — Role-Based Access Control', () => {

  it('PR-04 | patient can access patient-only route', () => {
    renderProtected({
      authValue: asPatient,
      allowedRoles: ['patient'],
      initialPath: '/patient-only',
    });

    expect(screen.getByText('Patient Only')).toBeInTheDocument();
  });

  it('PR-05 | doctor visiting patient-only route is redirected to /doctor-dashboard', () => {
    renderProtected({
      authValue: asDoctor,
      allowedRoles: ['patient'],
      initialPath: '/patient-only',
    });

    expect(screen.getByText('Doctor Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Patient Only')).not.toBeInTheDocument();
  });

  it('PR-06 | patient visiting doctor-only route is redirected to /patient-dashboard', () => {
    renderProtected({
      authValue: asPatient,
      allowedRoles: ['doctor'],
      initialPath: '/doctor-only',
    });

    expect(screen.getByText('Patient Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Doctor Only')).not.toBeInTheDocument();
  });

  it('PR-07 | doctor can access doctor-only route', () => {
    renderProtected({
      authValue: asDoctor,
      allowedRoles: ['doctor'],
      initialPath: '/doctor-only',
    });

    expect(screen.getByText('Doctor Only')).toBeInTheDocument();
  });

  it('PR-08 | admin can access admin-only route', () => {
    renderProtected({
      authValue: asAdmin,
      allowedRoles: ['admin'],
      initialPath: '/admin-only',
    });

    expect(screen.getByText('Admin Only')).toBeInTheDocument();
  });

  it('PR-09 | patient visiting admin-only route is redirected to /patient-dashboard', () => {
    renderProtected({
      authValue: asPatient,
      allowedRoles: ['admin'],
      initialPath: '/admin-only',
    });

    expect(screen.getByText('Patient Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Admin Only')).not.toBeInTheDocument();
  });

  it('PR-10 | route with no allowedRoles allows any authenticated user (doctor)', () => {
    renderProtected({ authValue: asDoctor });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('PR-10b | route with no allowedRoles allows any authenticated user (admin)', () => {
    renderProtected({ authValue: asAdmin });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

});

describe('ProtectedRoute — AuthContext Integration', () => {

  it('PR-11 | user loaded from localStorage (simulated via AuthContext) is authenticated', () => {
    // Simulates the case where the page is refreshed and user is restored
    // from localStorage (already handled by AuthProvider's useEffect,
    // but we verify ProtectedRoute accepts it correctly)
    const restoredAuth = {
      user: { id: 5, role: 'patient', firstName: 'Restored' },
      token: 'restored-token',
      isAuthenticated: true,
      loading: false,
      login: () => {},
      logout: () => {},
    };

    renderProtected({ authValue: restoredAuth });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('PR-12 | unauthenticated user visiting ANY protected path is redirected', () => {
    // Test multiple protected paths
    const paths = ['/protected', '/patient-only', '/doctor-only', '/admin-only'];

    paths.forEach((path) => {
      const { unmount } = renderProtected({
        authValue: unauthenticated,
        initialPath: path,
      });
      expect(screen.getByText('Login Page')).toBeInTheDocument();
      unmount();
    });
  });

});
