
'use client';

import { LoginForm } from '@/components/login-form';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

function LoginPageContent() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/trademarks');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <LoginForm />
        </div>
      );
  }

  // User is authenticated but hasn't been redirected yet, or an edge case.
  // Return a loading state to prevent brief flashes of content.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}


export default function LoginPage() {
    return (
        <LoginPageContent />
    )
}
