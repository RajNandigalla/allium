import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Database, RefreshCw, Trash2 } from 'lucide-react';

export default function DatabasePage() {
  return (
    <div className='p-8'>
      <div className='mb-8'>
        <h1 className='text-4xl font-bold mb-2'>Database</h1>
        <p className='text-gray-400'>Manage your database operations</p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
        <Card>
          <h3 className='text-xl font-semibold mb-4'>Database Statistics</h3>
          <div className='space-y-3'>
            <div className='flex justify-between items-center p-3 bg-gray-700/50 rounded-lg'>
              <span className='text-gray-400'>Total Records</span>
              <span className='font-bold'>1,234</span>
            </div>
            <div className='flex justify-between items-center p-3 bg-gray-700/50 rounded-lg'>
              <span className='text-gray-400'>Total Models</span>
              <span className='font-bold'>12</span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className='text-xl font-semibold mb-4'>Schema Status</h3>
          <div className='flex items-center gap-2 mb-4'>
            <div className='w-3 h-3 bg-green-500 rounded-full'></div>
            <span className='text-sm'>Schema is in sync</span>
          </div>
          <Button variant='primary' size='md' className='w-full'>
            <RefreshCw size={20} />
            Sync Schema
          </Button>
        </Card>
      </div>

      <Card className='border-red-500/50'>
        <h3 className='text-xl font-semibold mb-4 text-red-500'>Danger Zone</h3>
        <div className='space-y-3'>
          <div className='flex items-center justify-between p-4 bg-gray-700/50 rounded-lg'>
            <div>
              <p className='font-medium'>Seed Database</p>
              <p className='text-sm text-gray-400'>
                Populate database with sample data
              </p>
            </div>
            <Button variant='secondary' size='md'>
              <Database size={20} />
              Seed
            </Button>
          </div>
          <div className='flex items-center justify-between p-4 bg-gray-700/50 rounded-lg'>
            <div>
              <p className='font-medium'>Reset Database</p>
              <p className='text-sm text-gray-400'>
                Delete all data and reset schema
              </p>
            </div>
            <Button variant='danger' size='md'>
              <Trash2 size={20} />
              Reset
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
