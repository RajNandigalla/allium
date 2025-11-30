'use client';

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position='top-right'
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1f2937',
          color: '#f9fafb',
          border: '1px solid rgba(75, 85, 99, 0.3)',
          borderRadius: '0.5rem',
          padding: '1rem',
        },
        loading: {
          duration: Infinity,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid rgba(75, 85, 99, 0.3)',
          },
        },
        success: {
          duration: 4000,
          iconTheme: {
            primary: '#10b981',
            secondary: '#f9fafb',
          },
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#f9fafb',
          },
        },
      }}
    />
  );
}
