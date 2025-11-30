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

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Models', href: '/models', icon: Box },
  { name: 'Data Explorer', href: '/data', icon: Table },
  { name: 'API Keys', href: '/api-keys', icon: Key },
  { name: 'Database', href: '/database', icon: Database },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className='fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-40'>
      {/* Logo */}
      <div className='p-6 border-b border-slate-800'>
        <h1 className='text-xl font-bold text-white tracking-tight'>
          Allium Admin
        </h1>
      </div>

      {/* Navigation */}
      <nav className='flex-1 p-4 space-y-1'>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors duration-200',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              )}
            >
              <Icon size={18} />
              <span className='font-medium text-sm'>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className='p-4 border-t border-slate-800 text-xs text-slate-500'>
        <p>v0.1.0</p>
      </div>
    </aside>
  );
}
