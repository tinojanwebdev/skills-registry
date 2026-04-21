import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Search, Wrench } from 'lucide-react';

export const UserTypeSelection = () => {
  const navigate = useNavigate();
  const { setUserType } = useAuth();

  const handleSelection = (type: 'provider' | 'seeker') => {
    setUserType(type);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl text-center mb-12 text-gray-800">How do you want to use Worker?</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => handleSelection('seeker')}
            className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all hover:-translate-y-1 text-center group"
          >
            <div className="mb-6 flex justify-center">
              <div className="bg-blue-600 p-6 rounded-full group-hover:bg-blue-700 transition-colors">
                <Search className="w-16 h-16 text-white" />
              </div>
            </div>
            <h2 className="text-2xl mb-4 text-gray-800">I need a service</h2>
            <p className="text-gray-600">Find skilled professionals for your needs</p>
          </button>

          <button
            onClick={() => handleSelection('provider')}
            className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all hover:-translate-y-1 text-center group"
          >
            <div className="mb-6 flex justify-center">
              <div className="bg-indigo-600 p-6 rounded-full group-hover:bg-indigo-700 transition-colors">
                <Wrench className="w-16 h-16 text-white" />
              </div>
            </div>
            <h2 className="text-2xl mb-4 text-gray-800">I offer a service</h2>
            <p className="text-gray-600">Share your skills and earn money</p>
          </button>
        </div>
        <p className="text-center mt-8 text-sm text-gray-500">
          Admin? <Link to="/login" className="text-indigo-600 hover:text-indigo-700">Login here</Link>
        </p>
      </div>
    </div>
  );
};
