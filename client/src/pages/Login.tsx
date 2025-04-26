import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, User } from '../context/AuthContext';
import { FaUser, FaLock, FaUserMd } from 'react-icons/fa';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    if (user && user.role) {
      const pendingRedirect = localStorage.getItem('pendingRedirect');
      
      if (pendingRedirect) {
        localStorage.removeItem('pendingRedirect');
        navigate(pendingRedirect);
      } else {
        // Navigate based on role if no pending redirect
        if (user.role === 'patient') {
          navigate('/patient/dashboard');
        } else if (user.role === 'doctor') {
          navigate('/doctor/dashboard');
        } else if (user.role === 'admin') {
          navigate('/admin/dashboard');
        }
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Login attempt with:', { email, password: '******' });
      
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }
      
      const userData = await login(email, password);
      console.log('Login successful:', { role: userData.role });
      
      // Store redirect path for mobile apps to handle
      // This will be checked on next app open/reload
      if (userData && userData.role) {
        let redirectPath = '';
        if (userData.role === 'patient') {
          redirectPath = '/patient/dashboard';
        } else if (userData.role === 'doctor') {
          redirectPath = '/doctor/dashboard';
        } else if (userData.role === 'admin') {
          redirectPath = '/admin/dashboard';
        }
        
        if (redirectPath) {
          localStorage.setItem('pendingRedirect', redirectPath);
        }
      }
    } catch (err: any) {
      console.error('Login error details:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'patient' | 'doctor') => {
    setError('');
    setIsLoading(true);
    
    try {
      // Demo credentials
      const demoCredentials = {
        patient: { email: 'test@example.com', password: 'password123' },
        doctor: { email: 'testdoctor@example.com', password: 'password123' }
      };
      
      const { email, password } = demoCredentials[role];
      console.log(`Attempting demo login as ${role}:`, { email });
      
      const userData = await login(email, password);
      console.log('Demo login successful:', { role: userData.role });
      
      // Store the appropriate redirect path
      if (userData && userData.role) {
        const redirectPath = `/${userData.role}/dashboard`;
        localStorage.setItem('pendingRedirect', redirectPath);
      }
    } catch (err: any) {
      console.error('Demo login error:', err);
      setError('Demo login failed. Please try again or use regular login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or try a demo account</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDemoLogin('patient')}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70"
            >
              <FaUser className="mr-2" />
              Patient Demo
            </button>
            <button
              onClick={() => handleDemoLogin('doctor')}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70"
            >
              <FaUserMd className="mr-2" />
              Doctor Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 