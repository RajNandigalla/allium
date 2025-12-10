'use client';

import { forwardRef } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CheckboxProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    'checked' | 'onCheckedChange'
  > {
  label?: string;
  error?: string;
  helperText?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  indeterminate?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Checkbox = forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(
  (
    {
      className,
      label,
      error,
      helperText,
      checked,
      onCheckedChange,
      indeterminate,
      size = 'md',
      disabled,
      name,
      onChange,
      ...props
    },
    ref
  ) => {
    const sizes = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    const iconSizes = {
      sm: 14,
      md: 16,
      lg: 20,
    };

    const handleCheckedChange = (value: boolean | 'indeterminate') => {
      if (typeof value === 'boolean') {
        if (onChange) {
          // react-hook-form only needs target.checked for checkboxes
          (
            onChange as unknown as (e: { target: { checked: boolean } }) => void
          )({
            target: { checked: value },
          });
        }
        if (onCheckedChange) {
          onCheckedChange(value);
        }
      }
    };

    const checkboxElement = (
      <CheckboxPrimitive.Root
        ref={ref}
        name={name}
        checked={indeterminate ? 'indeterminate' : checked}
        onCheckedChange={handleCheckedChange}
        disabled={disabled}
        className={twMerge(
          clsx(
            'flex items-center justify-center rounded border-2 transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-red-500 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500'
              : 'border-slate-300 dark:border-slate-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600',
            'data-[state=indeterminate]:bg-indigo-600 data-[state=indeterminate]:border-indigo-600',
            'hover:border-indigo-500 dark:hover:border-indigo-400',
            sizes[size],
            className
          )
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator className='flex items-center justify-center text-white'>
          {indeterminate ? (
            <Minus size={iconSizes[size]} strokeWidth={3} />
          ) : (
            <Check size={iconSizes[size]} strokeWidth={3} />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );

    if (!label && !error && !helperText) {
      return checkboxElement;
    }

    return (
      <div className='flex flex-col gap-1.5'>
        <label
          className={clsx(
            'flex items-center gap-2',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer'
          )}
        >
          {checkboxElement}
          {label && (
            <span className='text-sm font-medium text-slate-700 dark:text-slate-200 select-none'>
              {label}
            </span>
          )}
        </label>
        {error && <p className='text-sm text-red-500 ml-7'>{error}</p>}
        {helperText && !error && (
          <p className='text-sm text-slate-500 dark:text-slate-400 ml-7'>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
