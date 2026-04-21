import { useNavigate } from 'react-router';
import { Briefcase } from 'lucide-react';
import packageJson from '../../../package.json';

export const GetStarted = () => {
  const navigate = useNavigate();
  const appVersion = packageJson.version;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="bg-indigo-600 p-4 rounded-full">
            <Briefcase className="w-12 h-12 text-white" />
          </div>
        </div>
        <h1 className="text-3xl mb-4 text-gray-800">Welcome to Worker</h1>
        <p className="text-gray-600 mb-8">Connect with skilled professionals or offer your services to those who need them</p>
        <button
          onClick={() => navigate('/login')}
          className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Get Started
        </button>
        <p className="mt-6 text-xs tracking-[0.2em] uppercase text-gray-400">Version {appVersion}</p>
      </div>
    </div>
  );
};
