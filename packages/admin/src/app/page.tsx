'use client';

import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  LayoutDashboard,
  Box,
  Key,
  Activity,
  Plus,
  Eye,
  Database,
} from 'lucide-react';
import Link from 'next/link';
import { adminApi, ModelDefinition } from '../lib/api';

export default function Dashboard() {
  const [models, setModels] = useState<ModelDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const data = await adminApi.getModels();
        setModels(data);
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, []);

  const stats = [
    {
      name: 'Total Models',
      value: isLoading ? '...' : models.length.toString(),
      icon: Box,
      color: 'indigo',
      change: `${
        models.filter((m) => m.fields && m.fields.length > 0).length
      } configured`,
    },
    {
      name: 'Active Models',
      value: isLoading
        ? '...'
        : models
            .filter((m) => m.fields && m.fields.length > 0)
            .length.toString(),
      icon: LayoutDashboard,
      color: 'cyan',
      change: 'With fields defined',
    },
    {
      name: 'Advanced Features',
      value: isLoading
        ? '...'
        : models.filter((m) => m.softDelete || m.auditTrail).length.toString(),
      icon: Activity,
      color: 'green',
      change: 'Soft delete or audit trail',
    },
    {
      name: 'Relations',
      value: isLoading
        ? '...'
        : models
            .reduce((acc, m) => acc + (m.relations?.length || 0), 0)
            .toString(),
      icon: Key,
      color: 'yellow',
      change: 'Total relationships',
    },
  ];

  // Get recent models (last 3)
  const recentModels = models.slice(0, 3);

  return (
    <div className='p-8'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-4xl font-bold mb-2'>Dashboard</h1>
        <p className='text-slate-600 dark:text-slate-400'>
          Welcome to the Allium Admin Panel
        </p>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} glass hover>
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <p className='text-sm text-slate-600 dark:text-slate-400 mb-1'>
                    {stat.name}
                  </p>
                  <p className='text-3xl font-bold mb-2'>{stat.value}</p>
                  <p className='text-xs text-slate-500 dark:text-slate-500'>
                    {stat.change}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}
                >
                  <Icon
                    size={24}
                    className={`text-${stat.color}-600 dark:text-${stat.color}-400`}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Welcome Banner */}
      <Card className='bg-gradient-to-r from-indigo-600 to-cyan-500 p-8 text-center mb-8 border-0'>
        <h2 className='text-2xl font-bold mb-2 text-white'>
          {models.length === 0
            ? 'Get Started with Allium'
            : 'Manage Your Data Models'}
        </h2>
        <p className='text-white/90 mb-6'>
          {models.length === 0
            ? 'Create your first model to start managing your application data'
            : 'Create new models or explore existing data to manage your application'}
        </p>
        <div className='flex gap-4 justify-center'>
          <Link href='/models'>
            <Button
              variant='secondary'
              size='md'
              className='bg-white text-slate-900 hover:bg-slate-100'
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
          <h3 className='text-xl font-semibold mb-4'>Recent Models</h3>
          {isLoading ? (
            <div className='flex justify-center items-center h-32'>
              <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600'></div>
            </div>
          ) : recentModels.length === 0 ? (
            <p className='text-slate-500 text-sm text-center py-8'>
              No models created yet. Create your first model to get started!
            </p>
          ) : (
            <div className='space-y-3'>
              {recentModels.map((model) => (
                <Link
                  key={model.name}
                  href={`/models/${model.name.toLowerCase()}/data`}
                >
                  <div className='flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer'>
                    <Database size={20} className='text-indigo-500' />
                    <div className='flex-1'>
                      <p className='text-sm font-medium'>{model.name}</p>
                      <p className='text-xs text-slate-500 dark:text-slate-400'>
                        {model.fields?.length || 0} fields
                        {model.relations &&
                          model.relations.length > 0 &&
                          `, ${model.relations.length} relations`}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className='text-xl font-semibold mb-4'>Quick Actions</h3>
          <div className='space-y-3'>
            <Link href='/models'>
              <button className='w-full flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2'>
                <Plus size={20} className='text-indigo-500' />
                <div>
                  <p className='text-sm font-medium'>Create New Model</p>
                  <p className='text-xs text-slate-500 dark:text-slate-400'>
                    Define a new data model
                  </p>
                </div>
              </button>
            </Link>
            <Link href='/models'>
              <button className='w-full flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2'>
                <LayoutDashboard size={20} className='text-cyan-500' />
                <div>
                  <p className='text-sm font-medium'>Browse Models</p>
                  <p className='text-xs text-slate-500 dark:text-slate-400'>
                    View and manage all models
                  </p>
                </div>
              </button>
            </Link>
            <Link href='/database'>
              <button className='w-full flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2'>
                <Activity size={20} className='text-green-500' />
                <div>
                  <p className='text-sm font-medium'>Database Status</p>
                  <p className='text-xs text-slate-500 dark:text-slate-400'>
                    Check connection and sync
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
