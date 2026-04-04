import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { setAccessToken } from "@/lib/api";
import type { UserRole } from "@/types";

interface AuthState {
  accessToken: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  setAuth: (token: string, role: UserRole) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      role: null,
      isAuthenticated: false,

      setAuth: (token, role) => {
        setAccessToken(token);
        // Normalise to lowercase — backend returns uppercase (TUTOR, ADMIN, etc.)
        const normalisedRole = (role as string).toLowerCase() as UserRole;
        set({ accessToken: token, role: normalisedRole, isAuthenticated: true });
      },

      clearAuth: () => {
        setAccessToken(null);
        set({ accessToken: null, role: null, isAuthenticated: false });
      },
    }),
    {
      name: "tutorflow-auth",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          setAccessToken(state.accessToken);
        }
        if (state?.role) {
          state.role = (state.role as string).toLowerCase() as UserRole;
        }
      },
    }
  )
);
