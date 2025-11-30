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
          'rounded-lg p-6 bg-slate-800 border border-slate-700',
          hover && 'transition-shadow duration-200 hover:shadow-md',
          className
        )
      )}
    >
      {children}
    </div>
  );
}
