'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface WizardStepProps {
  children: ReactNode;
  className?: string;
}

export function WizardStep({ children, className }: WizardStepProps) {
  return <div className={clsx('space-y-6', className)}>{children}</div>;
}
