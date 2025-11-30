'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { clsx } from 'clsx';

export interface WizardStepConfig {
  id: string;
  title: string;
  description?: string;
  optional?: boolean;
}

interface WizardProps {
  steps: WizardStepConfig[];
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
  onSubmit: () => void;
  canGoNext: boolean;
  canGoBack: boolean;
  isSubmitting?: boolean;
  children: ReactNode;
}

export function Wizard({
  steps,
  currentStep,
  onNext,
  onBack,
  onSkip,
  onSubmit,
  canGoNext,
  canGoBack,
  isSubmitting = false,
  children,
}: WizardProps) {
  const isLastStep = currentStep === steps.length - 1;
  const currentStepConfig = steps[currentStep];

  return (
    <div className='flex flex-col h-full'>
      {/* Progress Indicator */}
      <div className='mb-8'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h2 className='text-2xl font-bold text-slate-900 dark:text-white'>
              {currentStepConfig.title}
            </h2>
            {currentStepConfig.description && (
              <p className='text-sm text-slate-600 dark:text-slate-400 mt-1'>
                {currentStepConfig.description}
              </p>
            )}
          </div>
          <div className='text-sm font-medium text-slate-600 dark:text-slate-400'>
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className='flex items-center gap-2'>
          {steps.map((step, index) => (
            <div key={step.id} className='flex items-center flex-1'>
              <div className='flex-1 flex items-center'>
                <div className='relative flex-1'>
                  <div className='h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden'>
                    <motion.div
                      className={clsx(
                        'h-full rounded-full transition-colors duration-300',
                        index < currentStep
                          ? 'bg-indigo-600'
                          : index === currentStep
                          ? 'bg-indigo-500'
                          : 'bg-slate-200 dark:bg-slate-700'
                      )}
                      initial={{ width: 0 }}
                      animate={{
                        width: index <= currentStep ? '100%' : '0%',
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className='w-2 h-2 mx-1 rounded-full bg-slate-300 dark:bg-slate-600' />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className='flex items-center justify-between mt-2'>
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={clsx(
                'text-xs font-medium transition-colors duration-200',
                index === currentStep
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : index < currentStep
                  ? 'text-slate-600 dark:text-slate-400'
                  : 'text-slate-400 dark:text-slate-500'
              )}
              style={{
                flex: 1,
                textAlign:
                  index === 0
                    ? 'left'
                    : index === steps.length - 1
                    ? 'right'
                    : 'center',
              }}
            >
              {step.title}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className='flex-1 overflow-y-auto'>
        <AnimatePresence mode='wait'>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className='flex items-center justify-between pt-6 mt-6 border-t border-slate-200 dark:border-slate-700'>
        <div>
          {canGoBack && (
            <Button
              type='button'
              variant='ghost'
              onClick={onBack}
              disabled={isSubmitting}
            >
              <ChevronLeft size={20} />
              Back
            </Button>
          )}
        </div>

        <div className='flex items-center gap-3'>
          {currentStepConfig.optional && onSkip && !isLastStep && (
            <Button
              type='button'
              variant='ghost'
              onClick={onSkip}
              disabled={isSubmitting}
            >
              Skip
            </Button>
          )}

          {isLastStep ? (
            <Button
              type='button'
              variant='primary'
              onClick={onSubmit}
              disabled={!canGoNext || isSubmitting}
              isLoading={isSubmitting}
            >
              Create Model
            </Button>
          ) : (
            <Button
              type='button'
              variant='primary'
              onClick={onNext}
              disabled={!canGoNext || isSubmitting}
            >
              Next: {steps[currentStep + 1]?.title}
              <ChevronRight size={20} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
