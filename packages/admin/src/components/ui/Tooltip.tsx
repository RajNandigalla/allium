'use client';

import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, HelpCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  icon?: 'info' | 'help';
}

export function Tooltip({
  content,
  children,
  side = 'top',
  className,
  icon = 'info',
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const Icon = icon === 'info' ? Info : HelpCircle;

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrows = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-slate-800 dark:border-t-slate-700',
    bottom:
      'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-slate-800 dark:border-b-slate-700',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-slate-800 dark:border-l-slate-700',
    right:
      'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-slate-800 dark:border-r-slate-700',
  };

  return (
    <div className='relative inline-flex items-center'>
      <div
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className={clsx('inline-flex items-center cursor-help', className)}
      >
        {children || (
          <Icon
            size={16}
            className='text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors'
          />
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={clsx(
              'absolute z-50 px-3 py-2 text-sm text-white bg-slate-800 dark:bg-slate-700 rounded-lg shadow-lg max-w-xs',
              positions[side]
            )}
          >
            {content}
            <div className={clsx('absolute w-0 h-0 border-4', arrows[side])} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper component for info tooltips with examples
interface InfoTooltipProps {
  title: string;
  description: string;
  example?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  children?: ReactNode;
}

export function InfoTooltip({
  title,
  description,
  example,
  side = 'top',
  children,
}: InfoTooltipProps) {
  return (
    <Tooltip
      side={side}
      content={
        <div className='space-y-1.5'>
          <div className='font-semibold'>{title}</div>
          <div className='text-xs text-slate-300 dark:text-slate-400'>
            {description}
          </div>
          {example && (
            <div className='text-xs font-mono bg-slate-900 dark:bg-slate-800 px-2 py-1 rounded mt-2'>
              {example}
            </div>
          )}
        </div>
      }
    >
      {children || <span />}
    </Tooltip>
  );
}
