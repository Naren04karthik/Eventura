'use client';

import { createContext, useContext } from 'react';
import type { AppUser } from '@/types';

interface AuthContextType {
  user: AppUser | null;
}

const AuthContext = createContext<AuthContextType>({ user: null });

export function AuthProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user: AppUser | null;
}) {
  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
