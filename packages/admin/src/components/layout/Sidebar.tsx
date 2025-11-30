'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Box,
  Database,
  Key,
  Settings,
  Table,
} from 'lucide-react';
import { clsx } from 'clsx';
import { ThemeToggle } from '../ui/ThemeToggle';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Models', href: '/models', icon: Box },
  { name: 'Data Explorer', href: '/data', icon: Table },
  { name: 'API Keys', href: '/api-keys', icon: Key },
  { name: 'Database', href: '/database', icon: Database },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  isCollapsed: boolean;
}

export function Sidebar({ isCollapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={clsx(
        'fixed left-4 top-4 bottom-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col z-40 transition-all duration-150 rounded-xl',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className='p-6 border-b border-slate-200 dark:border-slate-800'>
        <h1
          className={clsx(
            'font-bold text-slate-900 dark:text-white tracking-tight transition-all duration-300',
            isCollapsed ? 'text-sm text-center' : 'text-xl'
          )}
        >
          {isCollapsed ? 'A' : 'Allium Admin'}
        </h1>
      </div>

      {/* Navigation */}
      <nav className='flex-1 p-4 space-y-1 overflow-y-auto'>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors duration-75',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
                isCollapsed && 'justify-center px-2'
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon size={18} />
              {!isCollapsed && (
                <span className='font-medium text-sm'>{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className='p-4 border-t border-slate-200 dark:border-slate-800 space-y-4'>
        {!isCollapsed && <ThemeToggle />}
        <div
          className={clsx(
            'text-xs text-slate-500 dark:text-slate-500',
            isCollapsed ? 'text-center' : 'px-2'
          )}
        >
          <p>{isCollapsed ? 'v0.1' : 'v0.1.0'}</p>
        </div>
      </div>
    </aside>
  );
}
