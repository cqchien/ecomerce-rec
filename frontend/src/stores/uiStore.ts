import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStore {
  theme: 'light' | 'dark';
  isSidebarOpen: boolean;
  isCartDrawerOpen: boolean;
  searchQuery: string;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  toggleCartDrawer: () => void;
  setSearchQuery: (query: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: 'light',
      isSidebarOpen: false,
      isCartDrawerOpen: false,
      searchQuery: '',

      toggleTheme: () => {
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' }));
      },

      toggleSidebar: () => {
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
      },

      toggleCartDrawer: () => {
        set((state) => ({ isCartDrawerOpen: !state.isCartDrawerOpen }));
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      showToast: (message: string, type = 'success' as const) => {
        // Will integrate with toast library
        console.log(`[Toast ${type}]:`, message);
      },
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
