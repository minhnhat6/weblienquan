import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/lib/auth';

// Mock fetch
global.fetch = vi.fn();

function Harness() {
  const { user, register, login, logout, toasts } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? user.username : 'none'}</div>
      <div data-testid="toasts">{toasts.length}</div>

      <button onClick={() => void register('tester', 'tester@example.com', 'secret123')}>
        register
      </button>
      <button onClick={() => logout()}>logout</button>
      <button onClick={() => { void login('tester', 'secret123'); }}>login</button>
    </div>
  );
}

describe('AuthProvider basic flow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('registers, logs out, and logs in user', async () => {
    // Mock initial /api/auth/me call (not authenticated)
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ success: false, error: 'Not authenticated' })
    });

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('none');
    });

    // Mock register API
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        data: { 
          user: { 
            id: 'test-1', 
            username: 'tester', 
            email: 'tester@example.com',
            balance: 0,
            role: 'user'
          } 
        } 
      })
    });

    fireEvent.click(screen.getByText('register'));
    
    await waitFor(() => {
      expect(screen.getByTestId('toasts').textContent).not.toBe('0');
    }, { timeout: 2000 });

    // Mock logout
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    fireEvent.click(screen.getByText('logout'));
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'));

    // Mock login API + fetch orders + fetch transactions
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        data: { 
          user: { 
            id: 'test-1', 
            username: 'tester', 
            email: 'tester@example.com',
            balance: 0,
            role: 'user'
          } 
        } 
      })
    });
    
    // Mock orders fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { orders: [] } })
    });
    
    // Mock transactions fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { transactions: [] } })
    });

    fireEvent.click(screen.getByText('login'));
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('tester'), { timeout: 2000 });

    expect(Number(screen.getByTestId('toasts').textContent || '0')).toBeGreaterThan(0);
  });
});
