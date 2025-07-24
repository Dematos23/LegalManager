
'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { useSession as useNextAuthSession } from 'next-auth/react';
import type { User } from '@prisma/client';

interface AppSessionContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
}

const AppSessionContext = createContext<AppSessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
    const { data: session, status } = useNextAuthSession();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        if (session?.user) {
            setUser(session.user as User);
        }
    }, [session]);

    const logout = useCallback(() => {
        // This will be handled by next-auth signOut
    }, []);

    const value = { 
        user, 
        isLoading: status === 'loading',
        logout,
    };
    
    return (
        <AppSessionContext.Provider value={value}>
            {children}
        </AppSessionContext.Provider>
    );
};

export const useSession = (): AppSessionContextType => {
  const context = useContext(AppSessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
