
'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { Role } from '@prisma/client';

interface SessionContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  role: Role;
  login: () => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    // For now, we'll mock the user role. In a real app, this would come from the session.
    const [role, setRole] = useState<Role>('ADMIN'); 
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        try {
            const session = localStorage.getItem('isLoggedIn');
            if (session === 'true') {
                setIsAuthenticated(true);
                // In a real app, you would fetch the user's role here
                // For now, we will just keep the default 'ADMIN' role
            } else {
                 if (pathname !== '/login') {
                    router.push('/login');
                }
            }
        } catch (error) {
            // localStorage not available on server
        } finally {
            setIsLoading(false);
        }
    }, [pathname, router]);

    const login = useCallback(() => {
        try {
            localStorage.setItem('isLoggedIn', 'true');
            setIsAuthenticated(true);
            // After login, you would set the user's role
            // For now, we'll default to ADMIN
            setRole('ADMIN');
        } catch (error) {}
    }, []);

    const logout = useCallback(() => {
        try {
            localStorage.removeItem('isLoggedIn');
            setIsAuthenticated(false);
        } catch (error) {}
    }, []);

    const value = { isAuthenticated, isLoading, role, login, logout };
    
    if (isLoading) {
        return null; // Or a loading spinner
    }

    if (!isAuthenticated && pathname !== '/login') {
        return null; // Or a loading spinner, while redirecting
    }

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
