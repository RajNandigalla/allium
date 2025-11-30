'use client';

import { ApolloWrapper } from '../lib/apollo-wrapper';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { ToastProvider } from '../components/ui/Toast';
import '../styles/index.scss';
import { ThemeProvider } from '../components/providers/ThemeProvider';
import { useState } from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <html lang='en' suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <ApolloWrapper>
            <div className='flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-150 p-4 gap-4'>
              <Sidebar isCollapsed={isSidebarCollapsed} />
              <div
                className='flex-1 flex flex-col'
                style={{
                  marginLeft: isSidebarCollapsed ? '4.5rem' : '16.5rem',
                }}
              >
                <Header
                  onToggleSidebar={() =>
                    setIsSidebarCollapsed(!isSidebarCollapsed)
                  }
                  sidebarCollapsed={isSidebarCollapsed}
                />
                <main className='flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 transition-colors duration-150 mt-20'>
                  {children}
                </main>
              </div>
            </div>
            <ToastProvider />
          </ApolloWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
