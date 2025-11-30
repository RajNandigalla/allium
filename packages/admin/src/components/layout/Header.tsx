'use client';

import { Search } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className='bg-gray-800 border-b border-gray-700 px-8 py-4'>
      <div className='flex items-center justify-between'>
        {/* Title Section */}
        <div>
          {title && <h1 className='text-2xl font-bold text-white'>{title}</h1>}
          {subtitle && <p className='text-sm text-gray-400 mt-1'>{subtitle}</p>}
        </div>

        {/* Search Bar */}
        <div className='relative w-96'>
          <Search
            className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
            size={20}
          />
          <input
            type='text'
            placeholder='Search...'
            className='w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all'
          />
        </div>
      </div>
    </header>
  );
}
