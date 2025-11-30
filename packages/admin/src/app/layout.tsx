import type { Metadata } from 'next';
import { ApolloWrapper } from '../lib/apollo-wrapper';
import { Sidebar } from '../components/layout/Sidebar';
import { ToastProvider } from '../components/ui/Toast';
import '../styles/index.scss';

export const metadata: Metadata = {
  title: 'Allium Admin',
  description: 'Allium Admin Dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body>
        <ApolloWrapper>
          <div className='flex min-h-screen bg-slate-950'>
            <Sidebar />
            <main className='flex-1 ml-64'>{children}</main>
          </div>
          <ToastProvider />
        </ApolloWrapper>
      </body>
    </html>
  );
}
