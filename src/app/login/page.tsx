
'use client';

import { LoginForm } from '@/components/login-form';
import { SessionProvider, useSession } from '@/context/session-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function LoginPageContent() {
  const { isAuthenticated, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return null; // or a loading spinner
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}


export default function LoginPage() {
    return (
        <SessionProvider>
            <LoginPageContent />
        </SessionProvider>
    )
}
