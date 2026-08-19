import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  token: string | null;
  tenantId: string | null;
  user: User | null;
  currentBranchId: string | null;
  currentBranch: { id: string; name: string } | null;
  setAuth: (token: string, tenantId: string, user: User) => void;
  setTenantId: (tenantId: string) => void;
  setCurrentBranch: (branch: { id: string; name: string } | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      tenantId: null,
      user: null,
      currentBranchId: null,
      currentBranch: null,
      setAuth: (token, tenantId, user) => set({ token, tenantId, user }),
      setTenantId: (tenantId) => set({ tenantId }),
      setCurrentBranch: (branch) => set({ currentBranch: branch, currentBranchId: branch?.id ?? null }),
      logout: () => set({ token: null, tenantId: null, user: null, currentBranch: null, currentBranchId: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
