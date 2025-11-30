import { forwardRef, TextareaHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className='flex flex-col gap-1.5'>
        {label && (
          <label className='text-sm font-medium text-slate-700 dark:text-slate-200'>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={twMerge(
            clsx(
              'px-4 py-2 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
              'transition-all duration-200',
              'placeholder:text-slate-400 dark:placeholder:text-slate-500',
              'resize-none',
              error
                ? 'border-red-500'
                : 'border-slate-300 dark:border-slate-700',
              className
            )
          )}
          {...props}
        />
        {error && <p className='text-sm text-red-500'>{error}</p>}
        {helperText && !error && (
          <p className='text-sm text-slate-500 dark:text-slate-400'>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
