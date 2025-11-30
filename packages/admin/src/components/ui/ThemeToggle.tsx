'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './Button';
import { useEffect, useState } from 'react';

interface ThemeToggleProps {
  isCollapsed?: boolean;
}

export function ThemeToggle({ isCollapsed = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Button
      variant='ghost'
      size='md'
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={
        isCollapsed ? 'w-full justify-center px-0' : 'w-full justify-start px-2'
      }
      disabled={!mounted}
    >
      {mounted ? (
        <>
          <Sun className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-slate-600 dark:text-slate-400' />
          <Moon className='absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-slate-600 dark:text-slate-400' />
          {!isCollapsed && <span className='ml-2'>Toggle theme</span>}
        </>
      ) : (
        !isCollapsed && <span className='ml-2'>Toggle theme</span>
      )}
    </Button>
  );
}
