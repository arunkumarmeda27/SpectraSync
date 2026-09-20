// Global application state store using Zustand
import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export interface User {
  id: number;
  email: string;
  role: string;
  created_at: string;
}

interface AppStore {
  // Authentication
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;

  // Toast notifications
  toasts: Toast[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;

  // Active job tracking
  activeJobId: number | null;
  setActiveJobId: (id: number | null) => void;

  // Sidebar state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

// Hydrate auth from localStorage if available
const storedToken = localStorage.getItem('spectrasync_token');
let storedUser: User | null = null;
try {
  const userJson = localStorage.getItem('spectrasync_user');
  if (userJson) {
    storedUser = JSON.parse(userJson);
  }
} catch {
  storedUser = null;
}

export const useStore = create<AppStore>((set) => ({
  user: storedUser,
  token: storedToken,
  isAuthenticated: Boolean(storedToken),
  setAuth: (token: string, user: User) => {
    localStorage.setItem('spectrasync_token', token);
    localStorage.setItem('spectrasync_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },
  clearAuth: () => {
    localStorage.removeItem('spectrasync_token');
    localStorage.removeItem('spectrasync_user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  toasts: [],
  addToast: (type, message) => {
    const id = Math.random().toString(36).slice(2);
    set(s => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, 4500);
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  activeJobId: null,
  setActiveJobId: (id) => set({ activeJobId: id }),

  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
