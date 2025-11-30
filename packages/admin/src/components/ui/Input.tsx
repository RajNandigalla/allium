import { forwardRef, InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className='flex flex-col gap-1.5'>
        {label && (
          <label className='text-sm font-medium text-gray-200'>{label}</label>
        )}
        <input
          ref={ref}
          className={twMerge(
            clsx(
              'px-4 py-2 bg-gray-800 border rounded-lg text-white',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
              'transition-all duration-200',
              'placeholder:text-gray-500',
              error ? 'border-red-500' : 'border-gray-700',
              className
            )
          )}
          {...props}
        />
        {error && <p className='text-sm text-red-500'>{error}</p>}
        {helperText && !error && (
          <p className='text-sm text-gray-400'>{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
