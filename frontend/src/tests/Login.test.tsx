import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { vi } from 'vitest';

// Mock client
const mockPost = vi.fn();
const mockGet = vi.fn();

vi.mock('../api/client', () => ({
  client: {
    post: (url: string, data: any, config: any) => mockPost(url, data, config),
    get: (url: string) => mockGet(url),
    defaults: { headers: { common: {} } }
  }
}));

// Mock store
const mockSetToken = vi.fn();
const mockSetUser = vi.fn();

vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({
    setToken: mockSetToken,
    setUser: mockSetUser,
  })
}));

const renderLogin = () => {
  render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form', () => {
    renderLogin();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    mockPost.mockResolvedValueOnce({ data: { access_token: 'fake-token' } });
    mockGet.mockResolvedValueOnce({ data: { username: 'testuser', id: 1 } });

    renderLogin();

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/token', expect.any(URLSearchParams), expect.any(Object));
        expect(mockSetToken).toHaveBeenCalledWith('fake-token');
        expect(mockGet).toHaveBeenCalledWith('/users/me');
        expect(mockSetUser).toHaveBeenCalledWith({ username: 'testuser', id: 1 });
    });
  });

  it('handles login failure', async () => {
    mockPost.mockRejectedValueOnce({ response: { data: { detail: 'Invalid credentials' } } });

    renderLogin();

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
