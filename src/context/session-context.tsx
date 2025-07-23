
'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { User, Role } from '@prisma/client';

interface SessionContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
                setIsAuthenticated(true);
            } else {
                 if (pathname !== '/login') {
                    router.push('/login');
                }
            }
        } catch (error) {
            // localStorage not available on server or JSON parsing failed
            if (pathname !== '/login') {
                router.push('/login');
            }
        } finally {
            setIsLoading(false);
        }
    }, [pathname, router]);

    const login = useCallback((userData: User) => {
        try {
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            setIsAuthenticated(true);
        } catch (error) {}
    }, []);

    const logout = useCallback(() => {
        try {
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {}
    }, []);

    const value = { isAuthenticated, isLoading, user, login, logout };
    
    if (isLoading) {
        return null; // Or a loading spinner
    }

    if (!isAuthenticated && pathname !== '/login') {
        return null; // Or a loading spinner, while redirecting
    }
    
    // This prevents a flash of the login page if the user is already authenticated
    if (isAuthenticated && pathname === '/login') {
        return null;
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
