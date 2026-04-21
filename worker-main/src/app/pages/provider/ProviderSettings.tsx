import { Settings } from 'lucide-react';

export const ProviderSettings = () => {
  return (
    <div>
      <h1 className="text-3xl mb-8">Settings</h1>
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <Settings className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl text-gray-700 mb-2">Coming Soon</h2>
        <p className="text-gray-500">Settings will be available in a future update. Stay tuned!</p>
      </div>
    </div>
  );
};
