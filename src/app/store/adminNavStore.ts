import { create } from "zustand";

// ── View keys — add new drawer destinations here ──────────────────────────────
export const ADMIN_VIEWS = {
  DASHBOARD:   "dashboard",
  USERS:       "users",
  BATCH:       "batch",
  DEPARTMENTS: "departments",
  REPORTS:     "reports",
  SETTINGS:    "settings",
  MAIN:        "main",   // default landing view
} as const;

export type AdminNavState = {
  activeView: string;
  setView: (key: string) => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// useAdminNavStore
//
// activeView  — currently rendered page/panel
// setView(key) — called by AdminDrawer's onNavSelect
// ─────────────────────────────────────────────────────────────────────────────
export const useAdminNavStore = create<AdminNavState>()((set) => ({
  activeView: ADMIN_VIEWS.MAIN,
  setView: (key) => set({ activeView: key }),
}));
