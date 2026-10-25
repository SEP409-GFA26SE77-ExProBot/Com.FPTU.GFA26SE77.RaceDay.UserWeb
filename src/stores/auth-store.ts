"use client";
import { create } from "zustand";
import type { AuthUser } from "@/dto/auth.dto";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => void;
  setUser: (user: AuthUser) => void;
}
let epoch = 0;
let pending: Promise<void> | null = null;
export function clearPrivateCache() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.clear();
    for (const key of Object.keys(localStorage)) {
      if (/^(raceday|registration|confirmation|finance|rd_ci_|checkin|check-in)/i.test(key)) localStorage.removeItem(key);
    }
  } catch {
    // Storage can be disabled; in-memory authentication must still be cleared.
  }
}
export function announceSessionChange() {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel("raceday-session");
  channel.postMessage("changed");
  channel.close();
}
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null, isAuthenticated: false, isLoading: false, isInitialized: false,
  setUser: (user) => set({ user, isAuthenticated: true, isInitialized: true }),
  clearAuth: () => {
    epoch++;
    pending = null;
    clearPrivateCache();
    set({ user: null, isAuthenticated: false, isLoading: false, isInitialized: true });
  },
  fetchMe: () => {
    if (pending) return pending;
    const generation = epoch;
    set({ isLoading: true });
    const operation = (async () => {
      try {
        const response = await fetch("/api/backend/api/v1/iam/me", { cache: "no-store", credentials: "same-origin" });
        if (generation !== epoch) return;
        if (response.ok) {
          const user: AuthUser = await response.json();
          if (generation === epoch) set({ user, isAuthenticated: true });
        } else if (generation === epoch) {
          get().clearAuth();
        }
      } catch {
        if (generation === epoch) get().clearAuth();
      } finally {
        if (generation === epoch) set({ isLoading: false, isInitialized: true });
      }
    })();
    pending = operation;
    void operation.finally(() => { if (pending === operation) pending = null; });
    return operation;
  },
  logout: async () => {
    get().clearAuth();
    try {
      const response = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      if (!response.ok) throw new Error("Unable to clear browser session. Please try signing out again.");
    } finally {
      get().clearAuth();
      announceSessionChange();
    }
  },
}));
export const getAuthUser = () => useAuthStore.getState().user;
