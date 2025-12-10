'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Box,
  Key,
  Settings,
  Database,
  ArrowLeftRight,
  TrendingUp,
  Zap,
  Clock,
} from 'lucide-react';
import { clsx } from 'clsx';
import { ThemeToggle } from '../ui/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: TrendingUp,
  },
  {
    name: 'Models',
    href: '/models',
    icon: Database,
  },
  { name: 'API Keys', href: '/api-keys', icon: Key },
  { name: 'Data', href: '/data', icon: Database },
  { name: 'Import / Export', href: '/import-export', icon: ArrowLeftRight },
  { name: 'Webhooks', href: '/webhooks', icon: Zap },
  { name: 'Cron Jobs', href: '/cron-jobs', icon: Clock },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  isCollapsed: boolean;
}

export function Sidebar({ isCollapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 64 : 256 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={clsx(
        'fixed left-4 top-4 bottom-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col z-40 rounded-xl overflow-hidden'
      )}
    >
      {/* Logo */}
      <div className='h-[61px] flex items-center px-6 border-b border-slate-200 dark:border-slate-800 whitespace-nowrap overflow-hidden'>
        <h1
          className={clsx(
            'font-bold text-slate-900 dark:text-white tracking-tight transition-all duration-200',
            isCollapsed ? 'text-sm text-center' : 'text-xl'
          )}
        >
          {isCollapsed ? 'A' : 'Allium Admin'}
        </h1>
      </div>

      {/* Navigation */}
      <nav className='flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden'>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.name} href={item.href} className='block'>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                className={clsx(
                  'flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors duration-75 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
                  isCollapsed && 'justify-center px-2'
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon size={18} className='flex-shrink-0' />
                <AnimatePresence mode='wait'>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className='font-medium text-sm overflow-hidden'
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className='p-4 border-t border-slate-200 dark:border-slate-800 space-y-4 whitespace-nowrap overflow-hidden'>
        <ThemeToggle isCollapsed={isCollapsed} />
        <div
          className={clsx(
            'text-xs text-slate-500 dark:text-slate-500',
            isCollapsed ? 'text-center' : 'px-2'
          )}
        >
          <p>{isCollapsed ? 'v0.1' : 'v0.1.0'}</p>
        </div>
      </div>
    </motion.aside>
  );
}
