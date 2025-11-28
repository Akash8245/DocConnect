import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  HomeIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigation links based on user role
  const getNavLinks = () => {
    if (!user) return [];

    if (user.role === 'patient') {
      return [
        { name: 'Dashboard', href: '/patient/dashboard', icon: HomeIcon },
        { name: 'Find Doctors', href: '/patient/booking', icon: ClockIcon },
        { name: 'My Appointments', href: '/patient/appointments', icon: CalendarIcon },
        { name: 'My Profile', href: '/patient/profile', icon: UserIcon },
      ];
    } else {
      return [
        { name: 'Dashboard', href: '/doctor/dashboard', icon: HomeIcon },
        { name: 'My Availability', href: '/doctor/availability', icon: ClockIcon },
        { name: 'Appointments', href: '/doctor/appointments', icon: CalendarIcon },
        { name: 'My Profile', href: '/doctor/profile', icon: UserIcon },
      ];
    }
  };

  const navLinks = getNavLinks();
  const isPublicRoute = location.pathname === '/login' || location.pathname === '/signup';
  const isHomePage = location.pathname === '/';

  return (
    <div className="flex flex-col min-h-screen overflow-hidden bg-secondary-50">
      {/* Mobile menu */}
      <Transition.Root show={mobileMenuOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 lg:hidden" onClose={setMobileMenuOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 z-40 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white focus:outline-none">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute right-0 top-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="h-0 flex-1 overflow-y-auto pt-5 pb-4">
                  <div className="flex flex-shrink-0 items-center px-4">
                    <Link to="/" className="text-2xl font-bold text-primary-600">
                      DocConnect
                    </Link>
                  </div>
                  <nav aria-label="Sidebar" className="mt-5">
                    <div className="space-y-1 px-2">
                      {/* AI Health Assistant for all users */}
                      <Link
                        to="/ai-health-assistant"
                        className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                          location.pathname.includes('/ai-health-assistant')
                            ? 'bg-primary-100 text-primary-600'
                            : 'text-secondary-600 hover:bg-primary-50 hover:text-primary-600'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <SparklesIcon
                          className={`mr-4 h-6 w-6 flex-shrink-0 ${
                            location.pathname.includes('/ai-health-assistant')
                              ? 'text-primary-600'
                              : 'text-secondary-400 group-hover:text-primary-600'
                          }`}
                          aria-hidden="true"
                        />
                        AI Health Assistant
                      </Link>
                      
                      {/* User specific navigation links */}
                      {navLinks.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                            location.pathname.includes(item.href)
                              ? 'bg-primary-100 text-primary-600'
                              : 'text-secondary-600 hover:bg-primary-50 hover:text-primary-600'
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <item.icon
                            className={`mr-4 h-6 w-6 flex-shrink-0 ${
                              location.pathname.includes(item.href)
                                ? 'text-primary-600'
                                : 'text-secondary-400 group-hover:text-primary-600'
                            }`}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      ))}
                      {user && (
                        <button
                          onClick={() => {
                            handleLogout();
                            setMobileMenuOpen(false);
                          }}
                          className="group flex w-full items-center px-2 py-2 text-base font-medium rounded-md text-secondary-600 hover:bg-primary-50 hover:text-primary-600"
                        >
                          <ArrowRightOnRectangleIcon
                            className="mr-4 h-6 w-6 flex-shrink-0 text-secondary-400 group-hover:text-primary-600"
                            aria-hidden="true"
                          />
                          Log out
                        </button>
                      )}
                    </div>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
            <div className="w-14 flex-shrink-0" aria-hidden="true">
              {/* Dummy element to force sidebar to shrink to fit close icon */}
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      {user && !isPublicRoute && !isHomePage && (
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
          <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-secondary-200">
            <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
              <div className="flex flex-shrink-0 items-center px-4">
                <Link to="/" className="text-2xl font-bold text-primary-600">
                  DocConnect
                </Link>
              </div>
              <nav className="mt-5 flex-1 space-y-1 px-2" aria-label="Sidebar">
                <div className="space-y-1">
                  {navLinks.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        location.pathname.includes(item.href)
                          ? 'bg-primary-100 text-primary-600'
                          : 'text-secondary-600 hover:bg-primary-50 hover:text-primary-600'
                      }`}
                    >
                      <item.icon
                        className={`mr-3 h-5 w-5 flex-shrink-0 ${
                          location.pathname.includes(item.href)
                            ? 'text-primary-600'
                            : 'text-secondary-400 group-hover:text-primary-600'
                        }`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="group flex w-full items-center px-2 py-2 text-sm font-medium rounded-md text-secondary-600 hover:bg-primary-50 hover:text-primary-600"
                  >
                    <ArrowRightOnRectangleIcon
                      className="mr-3 h-5 w-5 flex-shrink-0 text-secondary-400 group-hover:text-primary-600"
                      aria-hidden="true"
                    />
                    Log out
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}

      <div className={`flex flex-1 flex-col ${user && !isPublicRoute && !isHomePage ? 'lg:pl-64' : ''}`}>
        {/* Top navbar */}
        {user && !isPublicRoute && !isHomePage && (
          <div className="sticky top-0 z-10 bg-white border-b border-secondary-200">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6">
              <button
                type="button"
                className="lg:hidden -ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-secondary-500 hover:text-secondary-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                onClick={() => setMobileMenuOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
              <div className="inline-flex items-center ml-2 lg:hidden">
                <Link to="/" className="text-xl font-bold text-primary-600">
                  DocConnect
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Public header for login/signup pages or homepage with user */}
        {(isPublicRoute || isHomePage) && (
          <header className="bg-white border-b border-secondary-200">
            <div className="flex h-16 justify-between items-center px-4 sm:px-6 lg:px-8">
              <Link to="/" className="text-2xl font-bold text-primary-600">
                DocConnect
              </Link>
              <div className="flex items-center space-x-4">
                {/* AI Health link - available to everyone */}
                <Link
                  to="/ai-health-assistant"
                  className="text-secondary-700 hover:text-primary-700 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                >
                  <SparklesIcon className="h-5 w-5 mr-1" />
                  AI Health
                </Link>
                
                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="text-secondary-700 hover:text-primary-700 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Dashboard
                    </Link>
                    <div className="relative">
                      <div>
                        <button
                          type="button"
                          className="flex items-center max-w-xs rounded-full text-sm focus:outline-none"
                          onClick={() => setUserMenuOpen(!userMenuOpen)}
                        >
                          <span className="sr-only">Open user menu</span>
                          <img
                            className="h-8 w-8 rounded-full object-cover"
                            src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.name}&background=0D8ABC&color=fff`}
                            alt={user.name}
                          />
                          <span className="ml-2 text-secondary-700">{user.name}</span>
                          <svg
                            className={`ml-1 h-5 w-5 text-secondary-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                      {userMenuOpen && (
                        <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                          <Link
                            to={`/${user.role}/profile`}
                            className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            Your Profile
                          </Link>
                          <button
                            onClick={() => {
                              handleLogout();
                              setUserMenuOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
                          >
                            Sign out
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className={`btn ${
                        location.pathname === '/login' ? 'btn-primary' : 'btn-secondary'
                      }`}
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      className={`btn ${
                        location.pathname === '/signup' ? 'btn-primary' : 'btn-secondary'
                      }`}
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </header>
        )}

        <main className="flex-1">
          <Outlet />
        </main>

        {/* Footer */}
        {(!isHomePage || (isHomePage && user)) && (
          <footer className="bg-white border-t border-secondary-200 py-4">
            <div className="px-4 sm:px-6 lg:px-8">
              <p className="text-center text-sm text-secondary-500">
                &copy; {new Date().getFullYear()} DocConnect. All rights reserved.
              </p>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};

export default Layout; 