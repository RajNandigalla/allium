'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidePanelProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root> {
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SidePanel({
  trigger,
  title,
  description,
  children,
  className,
  open,
  onOpenChange,
  ...props
}: SidePanelProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} {...props}>
      {trigger && (
        <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      )}
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className='fixed inset-0 z-50 bg-black/40 backdrop-blur-sm'
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild>
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{
                  type: 'spring',
                  damping: 40,
                  stiffness: 400,
                  mass: 1,
                }}
                drag='x'
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0, right: 0.5 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 100 && info.velocity.x > 0) {
                    onOpenChange?.(false);
                  }
                }}
                className={cn(
                  'fixed inset-y-0 right-0 z-50 h-full w-full gap-4 border-l bg-background p-6 shadow-lg sm:max-w-md',
                  className
                )}
              >
                <div className='flex flex-col h-full'>
                  <div className='flex items-center justify-between mb-6'>
                    <div>
                      {title && (
                        <DialogPrimitive.Title className='text-lg font-semibold text-foreground'>
                          {title}
                        </DialogPrimitive.Title>
                      )}
                      {description && (
                        <DialogPrimitive.Description className='text-sm text-muted-foreground mt-1'>
                          {description}
                        </DialogPrimitive.Description>
                      )}
                    </div>
                    <DialogPrimitive.Close className='rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary'>
                      <X className='h-5 w-5' />
                      <span className='sr-only'>Close</span>
                    </DialogPrimitive.Close>
                  </div>
                  <div className='flex-1 overflow-y-auto'>{children}</div>
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
