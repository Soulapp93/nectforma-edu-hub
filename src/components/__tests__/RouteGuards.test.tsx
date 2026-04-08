import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import React from 'react';

// Mock useCurrentUser for route guards
const mockUseCurrentUser = vi.fn();
vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

// Import after mocks
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import AdminPrincipalRoute from '@/components/AdminPrincipalRoute';

function renderWithRouter(ui: React.ReactElement, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/" element={ui} />
        <Route path="/auth" element={<div>Auth Page</div>} />
        <Route path="/formations" element={<div>Formations Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner while auth is loading', () => {
    mockUseCurrentUser.mockReturnValue({ userId: null, userRole: null, loading: true, error: null });
    renderWithRouter(
      <ProtectedRoute><div>Secret Content</div></ProtectedRoute>
    );
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
    // Should see a spinner (the spinning div)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redirects to /auth when not authenticated', () => {
    mockUseCurrentUser.mockReturnValue({ userId: null, userRole: null, loading: false, error: null });
    renderWithRouter(
      <ProtectedRoute><div>Secret Content</div></ProtectedRoute>
    );
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
    expect(screen.getByText('Auth Page')).toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    mockUseCurrentUser.mockReturnValue({ userId: 'user-1', userRole: 'Admin', loading: false, error: null });
    renderWithRouter(
      <ProtectedRoute><div>Secret Content</div></ProtectedRoute>
    );
    expect(screen.getByText('Secret Content')).toBeInTheDocument();
  });
});

describe('AdminRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner while loading', () => {
    mockUseCurrentUser.mockReturnValue({ userId: 'u1', userRole: null, loading: true, error: null });
    renderWithRouter(
      <AdminRoute><div>Admin Content</div></AdminRoute>
    );
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redirects to /formations for non-admin users', () => {
    mockUseCurrentUser.mockReturnValue({ userId: 'u1', userRole: 'Étudiant', loading: false, error: null });
    renderWithRouter(
      <AdminRoute><div>Admin Content</div></AdminRoute>
    );
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    expect(screen.getByText('Formations Page')).toBeInTheDocument();
  });

  it('renders children for Admin role', () => {
    mockUseCurrentUser.mockReturnValue({ userId: 'u1', userRole: 'Admin', loading: false, error: null });
    renderWithRouter(
      <AdminRoute><div>Admin Content</div></AdminRoute>
    );
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('renders children for AdminPrincipal role', () => {
    mockUseCurrentUser.mockReturnValue({ userId: 'u1', userRole: 'AdminPrincipal', loading: false, error: null });
    renderWithRouter(
      <AdminRoute><div>Admin Content</div></AdminRoute>
    );
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('redirects Tuteur to /formations', () => {
    mockUseCurrentUser.mockReturnValue({ userId: 'u1', userRole: 'Tuteur', loading: false, error: null });
    renderWithRouter(
      <AdminRoute><div>Admin Content</div></AdminRoute>
    );
    expect(screen.getByText('Formations Page')).toBeInTheDocument();
  });
});

describe('AdminPrincipalRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner while loading', () => {
    mockUseCurrentUser.mockReturnValue({ userId: 'u1', userRole: null, loading: true, error: null });
    renderWithRouter(
      <AdminPrincipalRoute><div>Principal Content</div></AdminPrincipalRoute>
    );
    expect(screen.queryByText('Principal Content')).not.toBeInTheDocument();
  });

  it('redirects non-AdminPrincipal to /dashboard', () => {
    mockUseCurrentUser.mockReturnValue({ userId: 'u1', userRole: 'Admin', loading: false, error: null });
    renderWithRouter(
      <AdminPrincipalRoute><div>Principal Content</div></AdminPrincipalRoute>
    );
    expect(screen.queryByText('Principal Content')).not.toBeInTheDocument();
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('renders children for AdminPrincipal role', () => {
    mockUseCurrentUser.mockReturnValue({ userId: 'u1', userRole: 'AdminPrincipal', loading: false, error: null });
    renderWithRouter(
      <AdminPrincipalRoute><div>Principal Content</div></AdminPrincipalRoute>
    );
    expect(screen.getByText('Principal Content')).toBeInTheDocument();
  });
});
