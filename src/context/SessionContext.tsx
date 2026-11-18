"use client";

import type { CurrentUser } from "@/lib/auth/dal";
import { can, type Permission } from "@/lib/permissions";
import { createContext, useContext } from "react";

const SessionContext = createContext<CurrentUser | null>(null);

export function SessionProvider({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

export function useCurrentUser() {
  const user = useContext(SessionContext);
  if (!user) throw new Error("useCurrentUser must be used within SessionProvider");
  return user;
}

export function useCan(permission: Permission) {
  return can(useCurrentUser().role, permission);
}
