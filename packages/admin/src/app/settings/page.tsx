import { Card } from '../../components/ui/Card';

export default function SettingsPage() {
  return (
    <div className='p-8'>
      <div className='mb-8'>
        <h1 className='text-4xl font-bold mb-2'>Settings</h1>
        <p className='text-gray-400'>Configure your Allium instance</p>
      </div>

      <Card>
        <h3 className='text-xl font-semibold mb-4'>System Information</h3>
        <div className='space-y-3'>
          <div className='flex justify-between items-center p-3 bg-gray-700/50 rounded-lg'>
            <span className='text-gray-400'>Version</span>
            <span className='font-medium'>0.1.0</span>
          </div>
          <div className='flex justify-between items-center p-3 bg-gray-700/50 rounded-lg'>
            <span className='text-gray-400'>Node.js</span>
            <span className='font-medium'>v20.x</span>
          </div>
          <div className='flex justify-between items-center p-3 bg-gray-700/50 rounded-lg'>
            <span className='text-gray-400'>Environment</span>
            <span className='font-medium'>Development</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
