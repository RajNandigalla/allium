import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  children: ReactNode;
  className?: string;
  glass?: boolean;
  hover?: boolean;
}

export function Card({
  children,
  className,
  glass = false, // Deprecated, kept for compatibility but ignored
  hover = false,
}: CardProps) {
  return (
    <div
      className={twMerge(
        clsx(
          'rounded-xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-200',
          hover &&
            'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600',
          className
        )
      )}
    >
      {children}
    </div>
  );
}
