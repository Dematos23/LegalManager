
'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface SessionContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        try {
            const session = localStorage.getItem('isLoggedIn');
            if (session === 'true') {
                setIsAuthenticated(true);
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
        } catch (error) {}
    }, []);

    const logout = useCallback(() => {
        try {
            localStorage.removeItem('isLoggedIn');
            setIsAuthenticated(false);
        } catch (error) {}
    }, []);

    const value = { isAuthenticated, isLoading, login, logout };
    
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
