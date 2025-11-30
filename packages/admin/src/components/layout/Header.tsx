'use client';

import { Menu } from 'lucide-react';
import { Breadcrumb } from '../ui/Breadcrumb';
import { Button } from '../ui/Button';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

export function Header({ onToggleSidebar, sidebarCollapsed }: HeaderProps) {
  return (
    <header
      className='fixed top-4 right-4 z-30 flex items-center gap-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 backdrop-blur-sm px-6 py-3 transition-all duration-150 rounded-xl'
      style={{
        left: sidebarCollapsed ? 'calc(4rem + 2rem)' : 'calc(16rem + 2rem)',
      }}
    >
      <Button
        variant='ghost'
        size='sm'
        onClick={onToggleSidebar}
        className='w-9 px-0'
        aria-label='Toggle sidebar'
      >
        <Menu className='h-5 w-5' />
      </Button>
      <Breadcrumb />
    </header>
  );
}
