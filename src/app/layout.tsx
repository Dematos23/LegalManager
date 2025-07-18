
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/context/language-context';
import { MobileHeader } from '@/components/mobile-header';

export const metadata: Metadata = {
  title: 'Legal CRM',
  description: 'Manage your legal trademarks with ease and intelligence.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Code+Pro&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased min-h-screen")}>
        <LanguageProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <MobileHeader />
              {children}
            </SidebarInset>
          </SidebarProvider>
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}
