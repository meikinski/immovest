'use client';

import { createContext, useContext, ReactNode } from 'react';

/**
 * Auth Context for server-side auth status
 * This allows us to pass auth state from server to client components
 * WITHOUT loading Clerk client-side JavaScript
 */
const AuthContext = createContext<{ isSignedIn: boolean }>({ isSignedIn: false });

export function useAuthStatus() {
  return useContext(AuthContext);
}

/**
 * Auth Provider - wraps children with auth status from server
 * NO Clerk client-side code, just a simple React Context
 */
export function AuthProvider({
  isSignedIn,
  children,
}: {
  isSignedIn: boolean;
  children: ReactNode;
}) {
  return (
    <AuthContext.Provider value={{ isSignedIn }}>
      {children}
    </AuthContext.Provider>
  );
}
