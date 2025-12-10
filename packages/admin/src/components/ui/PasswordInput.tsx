'use client';

import { forwardRef, useState, InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';

interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  showCopyButton?: boolean;
  onCopy?: () => void;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      showCopyButton = false,
      onCopy,
      value,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);

    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    const handleCopy = async () => {
      if (value && typeof value === 'string') {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          onCopy?.();
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
      }
    };

    return (
      <div className='flex flex-col gap-1.5'>
        {label && (
          <label className='text-sm font-medium text-slate-700 dark:text-slate-200'>
            {label}
          </label>
        )}
        <div className='relative'>
          <input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            value={value}
            className={twMerge(
              clsx(
                'w-full px-4 py-2 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                'transition-all duration-200',
                'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                error
                  ? 'border-red-500'
                  : 'border-slate-300 dark:border-slate-700',
                showCopyButton ? 'pr-20' : 'pr-12',
                className
              )
            )}
            {...props}
          />
          <div className='absolute inset-y-0 right-0 flex items-center gap-1 pr-3'>
            {showCopyButton && value && (
              <button
                type='button'
                onClick={handleCopy}
                className='p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded focus:outline-none focus:ring-2 focus:ring-indigo-500'
                aria-label='Copy password'
              >
                {copied ? (
                  <Check className='w-4 h-4 text-green-600 dark:text-green-400' />
                ) : (
                  <Copy className='w-4 h-4' />
                )}
              </button>
            )}
            <button
              type='button'
              onClick={togglePasswordVisibility}
              className='p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded focus:outline-none focus:ring-2 focus:ring-indigo-500'
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className='w-4 h-4' />
              ) : (
                <Eye className='w-4 h-4' />
              )}
            </button>
          </div>
        </div>
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

PasswordInput.displayName = 'PasswordInput';
