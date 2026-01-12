import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { client } from '../api/client';

interface User {
  username: string;
  id: number;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setToken: (token: string) => {
        set({ token });
        // Set default header for axios
        client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      },
      setUser: (user: User) => set({ user }),
      logout: () => {
        set({ token: null, user: null });
        delete client.defaults.headers.common['Authorization'];
      },
      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        // Re-attach token to axios on reload
        if (state?.token) {
          client.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      }
    }
  )
);
