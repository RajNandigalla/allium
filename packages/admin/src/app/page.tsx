import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LayoutDashboard, Box, Key, Activity, Plus, Eye } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const stats = [
    {
      name: 'Total Models',
      value: '12',
      icon: Box,
      color: 'indigo',
      change: '+2 this week',
    },
    {
      name: 'Total Records',
      value: '1,234',
      icon: LayoutDashboard,
      color: 'cyan',
      change: '+156 today',
    },
    {
      name: 'API Keys',
      value: '3',
      icon: Key,
      color: 'green',
      change: 'Active',
    },
    {
      name: 'Uptime',
      value: '99.9%',
      icon: Activity,
      color: 'yellow',
      change: 'Last 30 days',
    },
  ];

  return (
    <div className='p-8'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-4xl font-bold mb-2'>Dashboard</h1>
        <p className='text-gray-400'>Welcome to the Allium Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} glass hover>
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <p className='text-sm text-gray-400 mb-1'>{stat.name}</p>
                  <p className='text-3xl font-bold mb-2'>{stat.value}</p>
                  <p className='text-xs text-gray-500'>{stat.change}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-600/20`}>
                  <Icon size={24} className={`text-${stat.color}-500`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Welcome Banner */}
      <Card className='bg-gradient-to-r from-indigo-600 to-cyan-500 p-8 text-center mb-8 border-0'>
        <h2 className='text-2xl font-bold mb-2 text-white'>
          Get Started with Allium
        </h2>
        <p className='text-white/90 mb-6'>
          Create your first model or explore existing data to manage your
          application
        </p>
        <div className='flex gap-4 justify-center'>
          <Link href='/models/new'>
            <Button
              variant='secondary'
              size='md'
              className='bg-white text-gray-900 hover:bg-gray-100'
            >
              <Plus size={20} />
              Create Model
            </Button>
          </Link>
          <Link href='/models'>
            <Button
              variant='ghost'
              size='md'
              className='border-2 border-white text-white hover:bg-white/10'
            >
              <Eye size={20} />
              View Models
            </Button>
          </Link>
        </div>
      </Card>

      {/* Quick Links */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Card>
          <h3 className='text-xl font-semibold mb-4'>Recent Activity</h3>
          <div className='space-y-3'>
            <div className='flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg'>
              <div className='w-2 h-2 bg-green-500 rounded-full'></div>
              <div className='flex-1'>
                <p className='text-sm font-medium'>User model created</p>
                <p className='text-xs text-gray-400'>2 hours ago</p>
              </div>
            </div>
            <div className='flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg'>
              <div className='w-2 h-2 bg-indigo-500 rounded-full'></div>
              <div className='flex-1'>
                <p className='text-sm font-medium'>Database synced</p>
                <p className='text-xs text-gray-400'>5 hours ago</p>
              </div>
            </div>
            <div className='flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg'>
              <div className='w-2 h-2 bg-cyan-500 rounded-full'></div>
              <div className='flex-1'>
                <p className='text-sm font-medium'>API key generated</p>
                <p className='text-xs text-gray-400'>1 day ago</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className='text-xl font-semibold mb-4'>Quick Actions</h3>
          <div className='space-y-3'>
            <Link href='/models/new'>
              <button className='w-full flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors text-left'>
                <Plus size={20} className='text-indigo-500' />
                <div>
                  <p className='text-sm font-medium'>Create New Model</p>
                  <p className='text-xs text-gray-400'>
                    Define a new data model
                  </p>
                </div>
              </button>
            </Link>
            <Link href='/data'>
              <button className='w-full flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors text-left'>
                <LayoutDashboard size={20} className='text-cyan-500' />
                <div>
                  <p className='text-sm font-medium'>Explore Data</p>
                  <p className='text-xs text-gray-400'>
                    View and manage records
                  </p>
                </div>
              </button>
            </Link>
            <Link href='/api-keys'>
              <button className='w-full flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors text-left'>
                <Key size={20} className='text-green-500' />
                <div>
                  <p className='text-sm font-medium'>Manage API Keys</p>
                  <p className='text-xs text-gray-400'>
                    Generate and revoke keys
                  </p>
                </div>
              </button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
