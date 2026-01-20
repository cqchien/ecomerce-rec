import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAuthService } from '@/services';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  avatar?: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,

      login: async (email: string, password: string) => {
        const authService = getAuthService();
        const response = await authService.login({ email, password });
        
        set({
          user: response.user,
          isAuthenticated: true,
          token: response.token,
        });
      },

      logout: async () => {
        const authService = getAuthService();
        await authService.logout();
        
        // Clear cart storage when logging out
        localStorage.removeItem('cart-storage');
        
        set({
          user: null,
          isAuthenticated: false,
          token: null,
        });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
