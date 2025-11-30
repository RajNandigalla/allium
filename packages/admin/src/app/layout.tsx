import type { Metadata } from 'next';
import { ApolloWrapper } from '../lib/apollo-wrapper';
import './index.scss';

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
        <ApolloWrapper>{children}</ApolloWrapper>
      </body>
    </html>
  );
}
