'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';

export function Breadcrumb() {
  const pathname = usePathname();

  const pathSegments = pathname.split('/').filter(Boolean);

  type BreadcrumbItem = {
    name: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Home', href: '/', icon: Home },
    ...pathSegments.map((segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      const name = segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return { name, href };
    }),
  ];

  return (
    <nav className='flex items-center space-x-2 text-sm'>
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const Icon = crumb.icon;

        return (
          <Fragment key={crumb.href}>
            {index > 0 && (
              <ChevronRight className='h-4 w-4 text-slate-400 dark:text-slate-600' />
            )}
            {isLast ? (
              <span className='font-medium text-slate-900 dark:text-white'>
                {Icon ? <Icon className='h-4 w-4' /> : crumb.name}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className='flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors'
              >
                {Icon ? <Icon className='h-4 w-4' /> : crumb.name}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
