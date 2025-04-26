import { Link } from 'react-router-dom';
import { ArrowRightIcon, CalendarIcon, VideoCameraIcon, UserGroupIcon, ClockIcon, GlobeAltIcon, ShieldCheckIcon, UserIcon, Bars3Icon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  const handleLogout = () => {
    authContext?.logout?.();
    // No need to navigate since we're already on the home page
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navigation Bar */}
      <div className="fixed top-0 left-0 w-full z-50 bg-white border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <span className="text-2xl font-bold text-primary-600">DocConnect</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
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
                    to={`/${user.role}/dashboard`}
                    className="text-secondary-700 hover:text-primary-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <div className="relative">
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
                    className="bg-white hover:bg-secondary-50 text-secondary-700 px-4 py-2 rounded-md text-sm font-medium border border-secondary-300"
                  >
                    Log in
                  </Link>
                  <Link 
                    to="/signup"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                onClick={() => setMobileMenuOpen(true)}
              >
                <span className="sr-only">Open main menu</span>
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-0 inset-x-0 min-h-screen bg-white z-50">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <Link to="/" className="flex-shrink-0">
                  <span className="text-2xl font-bold text-primary-600">DocConnect</span>
                </Link>
                <button
                  type="button"
                  className="inline-flex items-center justify-center p-2 rounded-md text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close menu</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-6 space-y-4">
                <Link 
                  to="/ai-health-assistant" 
                  className="flex items-center px-4 py-3 rounded-md text-base font-medium text-secondary-700 hover:bg-secondary-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  AI Health
                </Link>
                
                {user ? (
                  <>
                    <Link 
                      to={`/${user.role}/dashboard`} 
                      className="flex items-center px-4 py-3 rounded-md text-base font-medium text-secondary-700 hover:bg-secondary-100 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to={`/${user.role}/profile`} 
                      className="flex items-center px-4 py-3 rounded-md text-base font-medium text-secondary-700 hover:bg-secondary-100 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Your Profile
                    </Link>
                    <div className="pt-4 mt-4 border-t border-secondary-200">
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center px-4 py-3 rounded-md text-base font-medium text-secondary-700 hover:bg-secondary-100 transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="pt-4 mt-4 border-t border-secondary-200">
                    <Link 
                      to="/login" 
                      className="block px-4 py-3 rounded-md text-base font-medium text-secondary-700 border border-secondary-300 hover:bg-secondary-100 mb-3 text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log In
                    </Link>
                    <Link 
                      to="/signup" 
                      className="block px-4 py-3 rounded-md text-base font-medium text-white bg-primary-600 hover:bg-primary-700 text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Hero Section - completely redesigned */}
      <div className="relative overflow-hidden bg-gradient-to-b from-secondary-950 via-secondary-900 to-primary-900 mb-20 pt-16">
        {/* Gradient overlays and effects */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:3rem_3rem]"></div>
        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-primary-500 opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-64 w-64 rounded-full bg-primary-400 opacity-20 blur-3xl"></div>
        
        {/* Content container */}
        <div className="relative max-w-7xl mx-auto">
          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left content - text */}
            <div className="px-6 py-20 md:px-10 md:py-24 lg:py-32 xl:px-16 xl:py-40 flex flex-col justify-center">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-900/30 border border-primary-700/40 backdrop-blur-sm mb-6 text-sm text-primary-200 font-medium">
                <span className="block w-2 h-2 rounded-full bg-primary-400 mr-2 animate-pulse"></span>
                Trusted by leading medical institutions worldwide
              </div>
              
              <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold text-white leading-tight tracking-tight">
                Revolutionizing <span className="bg-gradient-to-r from-primary-300 via-primary-200 to-blue-200 text-transparent bg-clip-text">Global Healthcare</span> Access
              </h1>
              
              <p className="mt-6 text-lg text-secondary-200 max-w-lg leading-relaxed">
                Connect with elite healthcare professionals instantly across all time zones. Experience personalized care with cutting-edge technology and unparalleled security.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row gap-5">
                <Link to="/signup" className="px-8 py-4 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium shadow-lg shadow-primary-900/30 hover:shadow-xl hover:from-primary-500 hover:to-primary-400 transition-all duration-300 text-center">
                  Get Started Now
                </Link>
                <Link to="/login" className="px-8 py-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium hover:bg-white/15 transition-all duration-300 text-center">
                  Sign In
                </Link>
              </div>
              
              <div className="mt-12 pt-12 border-t border-secondary-800/50">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="flex items-center">
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4].map((i) => (
                        <img 
                          key={i} 
                          src={`https://randomuser.me/api/portraits/${i % 2 === 0 ? 'women' : 'men'}/${20 + i}.jpg`} 
                          alt="User" 
                          className="w-10 h-10 rounded-full border-2 border-secondary-900 object-cover"
                        />
                      ))}
                    </div>
                    <div className="ml-3">
                      <div className="text-secondary-200 text-sm">Trusted by</div>
                      <div className="text-white font-medium">10M+ Users</div>
                    </div>
                  </div>
                  
                  <div className="h-10 w-px bg-secondary-800/70 hidden sm:block"></div>
                  
                  <div className="flex items-center">
                    <div className="flex text-primary-300">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className="h-5 w-5" />
                      ))}
                    </div>
                    <div className="ml-3">
                      <div className="text-secondary-200 text-sm">Rated</div>
                      <div className="text-white font-medium">4.9 out of 5</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right content - visual */}
            <div className="hidden lg:flex items-center justify-center relative">
              {/* Visual UI elements */}
              <div className="relative w-full max-w-lg aspect-square">
                {/* Main display panel */}
                <div className="absolute inset-0 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-purple-500/10"></div>
                  
                  {/* Doctor interface mockup */}
                  <div className="absolute inset-6 rounded-2xl overflow-hidden shadow-2xl">
                    <img 
                      src="https://images.unsplash.com/photo-1651008376811-b90baee60c1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=987&q=80" 
                      alt="Doctor interface" 
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Interface overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-secondary-950/80 via-secondary-900/30 to-transparent"></div>
                    
                    {/* Video call interface elements */}
                    <div className="absolute bottom-0 inset-x-0 p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-400">
                            <img 
                              src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=250&q=80" 
                              alt="Doctor" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="ml-3">
                            <div className="text-white font-medium text-sm">Dr. Sarah Chen</div>
                            <div className="text-primary-200 text-xs">Cardiologist</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
                            <VideoCameraIcon className="h-5 w-5 text-white" />
                          </div>
                          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating UI elements */}
                  <div className="absolute bottom-4 right-4 w-40 bg-white/10 backdrop-blur-md rounded-lg border border-white/10 p-3 shadow-xl">
                    <div className="flex items-center space-x-3">
                      <CalendarIcon className="h-6 w-6 text-primary-300" />
                      <div>
                        <p className="text-xs text-secondary-200">Next Appointment</p>
                        <p className="text-sm text-white font-medium">Today, 3:00 PM</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute top-4 left-4 w-40 bg-white/10 backdrop-blur-md rounded-lg border border-white/10 p-3 shadow-xl">
                    <div className="flex items-center space-x-3">
                      <GlobeAltIcon className="h-6 w-6 text-primary-300" />
                      <div>
                        <p className="text-xs text-secondary-200">Translation</p>
                        <p className="text-sm text-white font-medium">English → Spanish</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute w-64 h-64 bg-primary-400 rounded-full -top-20 -right-20 blur-3xl opacity-20"></div>
                <div className="absolute w-64 h-64 bg-blue-400 rounded-full -bottom-20 -left-20 blur-3xl opacity-20"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom wave decoration */}
        <div className="absolute -bottom-12 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 355" className="w-full h-auto">
            <path fill="#f8fafc" fillOpacity="1" d="M0,160L48,165.3C96,171,192,181,288,181.3C384,181,480,171,576,170.7C672,171,768,181,864,181.3C960,181,1056,171,1152,170.7C1248,171,1344,181,1392,186.7L1440,192L1440,355L1392,355C1344,355,1248,355,1152,355C1056,355,960,355,864,355C768,355,672,355,576,355C480,355,384,355,288,355C192,355,96,355,48,355L0,355Z"></path>
          </svg>
        </div>
      </div>

      {/* Global service section */}
      <div className="bg-secondary-50 py-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            <div className="flex items-center space-x-2">
              <GlobeAltIcon className="h-6 w-6 text-primary-600" />
              <span className="text-secondary-700 font-medium">Available in 150+ countries</span>
            </div>
            <div className="flex items-center space-x-2">
              <UserIcon className="h-6 w-6 text-primary-600" />
              <span className="text-secondary-700 font-medium">10,000+ verified specialists</span>
            </div>
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="h-6 w-6 text-primary-600" />
              <span className="text-secondary-700 font-medium">HIPAA & GDPR compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-6 w-6 text-primary-600" />
              <span className="text-secondary-700 font-medium">24/7 global support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900">How DocConnect Works</h2>
            <div className="mt-6 h-1 w-24 bg-primary-500 mx-auto rounded-full"></div>
            <p className="mt-6 text-xl text-secondary-600">
              Our platform connects you with healthcare professionals worldwide in three simple steps.
            </p>
          </div>

          <div className="mt-20 grid gap-y-16 gap-x-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="relative bg-white rounded-2xl p-8 shadow-lg border border-secondary-100 transition-all duration-300 hover:shadow-xl hover:border-primary-200 group">
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 h-20 w-20 rounded-full bg-primary-100 border-4 border-white flex items-center justify-center shadow-md group-hover:bg-primary-500 transition-colors duration-300">
                <UserGroupIcon className="h-10 w-10 text-primary-600 group-hover:text-white transition-colors duration-300" aria-hidden="true" />
              </div>
              <div className="pt-10 text-center">
                <h3 className="text-xl font-bold text-secondary-900 mt-2">Find Specialists</h3>
                <p className="mt-4 text-secondary-600 leading-relaxed">
                  Browse our extensive network of internationally certified doctors across all specialties. Filter by language, specialty, availability, and patient ratings.
                </p>
                <div className="mt-8 flex justify-center">
                  <Link to="/signup" className="text-primary-600 font-medium hover:text-primary-700 flex items-center group">
                    <span>Find a specialist</span>
                    <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="relative bg-white rounded-2xl p-8 shadow-lg border border-secondary-100 transition-all duration-300 hover:shadow-xl hover:border-primary-200 group">
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 h-20 w-20 rounded-full bg-primary-100 border-4 border-white flex items-center justify-center shadow-md group-hover:bg-primary-500 transition-colors duration-300">
                <CalendarIcon className="h-10 w-10 text-primary-600 group-hover:text-white transition-colors duration-300" aria-hidden="true" />
              </div>
              <div className="pt-10 text-center">
                <h3 className="text-xl font-bold text-secondary-900 mt-2">Book Appointments</h3>
                <p className="mt-4 text-secondary-600 leading-relaxed">
                  Schedule consultations across any time zone with our intelligent booking system. Receive automated reminders and manage appointments with ease.
                </p>
                <div className="mt-8 flex justify-center">
                  <Link to="/signup" className="text-primary-600 font-medium hover:text-primary-700 flex items-center group">
                    <span>Book now</span>
                    <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="relative bg-white rounded-2xl p-8 shadow-lg border border-secondary-100 transition-all duration-300 hover:shadow-xl hover:border-primary-200 group">
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 h-20 w-20 rounded-full bg-primary-100 border-4 border-white flex items-center justify-center shadow-md group-hover:bg-primary-500 transition-colors duration-300">
                <VideoCameraIcon className="h-10 w-10 text-primary-600 group-hover:text-white transition-colors duration-300" aria-hidden="true" />
              </div>
              <div className="pt-10 text-center">
                <h3 className="text-xl font-bold text-secondary-900 mt-2">Virtual Consultations</h3>
                <p className="mt-4 text-secondary-600 leading-relaxed">
                  Connect via our high-definition, encrypted video platform. Access consultations from any device with real-time translation in 30+ languages.
                </p>
                <div className="mt-8 flex justify-center">
                  <Link to="/signup" className="text-primary-600 font-medium hover:text-primary-700 flex items-center group">
                    <span>Try a consultation</span>
                    <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-20 text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-50 border border-primary-100">
              <span className="text-primary-700 font-medium">Over 5 million consultations completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="py-16 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900">Why Millions Choose DocConnect</h2>
            <div className="mt-6 h-1 w-24 bg-primary-500 mx-auto rounded-full"></div>
            <p className="mt-6 text-xl text-secondary-600">
              We're setting a new global standard in digital healthcare with our enterprise-grade platform.
            </p>
          </div>

          <div className="mt-20 grid md:grid-cols-2 gap-y-12 gap-x-16 items-center">
            <div className="relative order-2 md:order-1">
              <div className="absolute -top-10 -left-10 w-48 h-48 bg-primary-200 rounded-full opacity-30 mix-blend-multiply blur-2xl"></div>
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-primary-300 rounded-full opacity-30 mix-blend-multiply blur-2xl"></div>
              
              {/* Stats grid */}
              <div className="relative grid grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-secondary-100">
                  <div className="text-3xl md:text-4xl font-bold text-primary-600">150+</div>
                  <p className="mt-2 text-secondary-600">Countries served</p>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border border-secondary-100">
                  <div className="text-3xl md:text-4xl font-bold text-primary-600">10k+</div>
                  <p className="mt-2 text-secondary-600">Verified doctors</p>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border border-secondary-100">
                  <div className="text-3xl md:text-4xl font-bold text-primary-600">30+</div>
                  <p className="mt-2 text-secondary-600">Languages supported</p>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border border-secondary-100">
                  <div className="text-3xl md:text-4xl font-bold text-primary-600">99.9%</div>
                  <p className="mt-2 text-secondary-600">Uptime reliability</p>
                </div>
              </div>
              
              {/* Image overlay */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white rounded-full shadow-xl flex items-center justify-center p-4">
                <img 
                  src="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" 
                  alt="DocConnect logo" 
                  className="h-24 w-24 object-contain rounded-full"
                />
              </div>
            </div>

            <div className="order-1 md:order-2">
              <div className="space-y-8">
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-600 text-white">
                      <ClockIcon className="h-6 w-6" aria-hidden="true" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-secondary-900">24/7 Global Availability</h3>
                    <p className="mt-3 text-secondary-600 leading-relaxed">
                      Access healthcare professionals from anywhere in the world, any time of day or night. Our platform automatically adjusts for time zones and language preferences.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-600 text-white">
                      <ShieldCheckIcon className="h-6 w-6" aria-hidden="true" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-secondary-900">Enterprise-Grade Security</h3>
                    <p className="mt-3 text-secondary-600 leading-relaxed">
                      Your health data is protected with bank-level encryption and multi-factor authentication. We're fully compliant with HIPAA, GDPR, and international healthcare regulations.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-600 text-white">
                      <GlobeAltIcon className="h-6 w-6" aria-hidden="true" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-secondary-900">Global Healthcare Network</h3>
                    <p className="mt-3 text-secondary-600 leading-relaxed">
                      Our platform connects you to certified specialists from renowned institutions worldwide. Access expertise regardless of geographic boundaries or language barriers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 py-16 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-400 rounded-full opacity-20 mix-blend-overlay blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary-300 rounded-full opacity-20 mix-blend-overlay blur-3xl"></div>
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillOpacity="0.07" fill="#FFFFFF" d="M0,224L60,202.7C120,181,240,139,360,149.3C480,160,600,224,720,213.3C840,203,960,117,1080,90.7C1200,64,1320,96,1380,112L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="p-8 md:p-12 lg:p-16">
                <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to experience healthcare without boundaries?</h2>
                <p className="mt-4 text-xl text-primary-100">
                  Join our global community and transform how you access healthcare forever.
                </p>
                
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Link to="/signup" className="btn bg-white text-primary-700 hover:bg-primary-50 py-3 px-8 text-lg font-medium rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-xl">
                    Create Free Account
                    <ArrowRightIcon className="w-5 h-5" />
                  </Link>
                  <Link to="/login" className="btn border-2 border-white bg-transparent text-white hover:bg-white/10 py-3 px-8 text-lg font-medium rounded-lg flex items-center justify-center gap-2 transition-all duration-300">
                    Sign In
                  </Link>
                </div>
                
                <div className="mt-10 flex flex-col sm:flex-row items-center gap-6">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-primary-100" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-primary-100">No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-primary-100" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-primary-100">Cancel anytime</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-primary-100" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-primary-100">Worldwide availability</span>
                  </div>
                </div>
              </div>
              
              <div className="hidden md:block p-8 md:p-0">
                <img 
                  src="https://images.unsplash.com/photo-1512678080530-7760d81faba6?ixlib=rb-4.0.3&auto=format&fit=crop&w=987&q=80" 
                  alt="Doctor with patient on tablet" 
                  className="w-full h-full object-cover rounded-l-3xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900">Trusted by Millions Worldwide</h2>
            <div className="mt-6 h-1 w-24 bg-primary-500 mx-auto rounded-full"></div>
            <p className="mt-6 text-xl text-secondary-600">
              Our global community of patients and doctors share their experiences.
            </p>
          </div>

          {/* Testimonial cards with enhanced design */}
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-secondary-100 relative">
              {/* Quotation mark */}
              <div className="absolute -top-5 -left-5 h-10 w-10 bg-primary-500 rounded-full flex items-center justify-center">
                <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>
              
              <div className="text-yellow-400 flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="h-5 w-5" />
                ))}
              </div>
              
              <p className="text-secondary-700 leading-relaxed italic">
                "DocConnect has transformed healthcare access for my family. With relatives across three continents, we can now all consult with the same specialists, ensuring consistent care regardless of location."
              </p>
              
              <div className="mt-8 pt-6 border-t border-secondary-100 flex items-center">
                <div className="flex-shrink-0">
                  <img
                    className="h-14 w-14 rounded-full object-cover border-2 border-primary-100"
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    alt="User"
                  />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-secondary-900">Sarah Johnson</h3>
                  <div className="flex items-center text-secondary-500">
                    <span>Patient</span>
                    <span className="mx-2">•</span>
                    <span>United States</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-secondary-100 relative">
              {/* Quotation mark */}
              <div className="absolute -top-5 -left-5 h-10 w-10 bg-primary-500 rounded-full flex items-center justify-center">
                <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>
              
              <div className="text-yellow-400 flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="h-5 w-5" />
                ))}
              </div>
              
              <p className="text-secondary-700 leading-relaxed italic">
                "The video consultation quality is exceptional, and the real-time translation feature has been a game-changer for my international practice. I can now serve patients from Singapore to Brazil with equal effectiveness."
              </p>
              
              <div className="mt-8 pt-6 border-t border-secondary-100 flex items-center">
                <div className="flex-shrink-0">
                  <img
                    className="h-14 w-14 rounded-full object-cover border-2 border-primary-100"
                    src="https://randomuser.me/api/portraits/men/75.jpg"
                    alt="Dr. Michael Chen - Cardiologist from Singapore"
                  />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-secondary-900">Dr. Michael Chen</h3>
                  <div className="flex items-center text-secondary-500">
                    <span>Cardiologist</span>
                    <span className="mx-2">•</span>
                    <span>Singapore</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-secondary-100 relative">
              {/* Quotation mark */}
              <div className="absolute -top-5 -left-5 h-10 w-10 bg-primary-500 rounded-full flex items-center justify-center">
                <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>
              
              <div className="text-yellow-400 flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="h-5 w-5" />
                ))}
              </div>
              
              <p className="text-secondary-700 leading-relaxed italic">
                "As the medical director for a multinational corporation, DocConnect has revolutionized our employee healthcare. The platform's ability to coordinate care across global offices has increased efficiency by 300%."
              </p>
              
              <div className="mt-8 pt-6 border-t border-secondary-100 flex items-center">
                <div className="flex-shrink-0">
                  <img
                    className="h-14 w-14 rounded-full object-cover border-2 border-primary-100"
                    src="https://images.unsplash.com/photo-1607990283143-e81e7a2c9349?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    alt="User"
                  />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-secondary-900">Dr. Amara Okafor</h3>
                  <div className="flex items-center text-secondary-500">
                    <span>Medical Director</span>
                    <span className="mx-2">•</span>
                    <span>United Kingdom</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Logos of trusted organizations - completely redesigned */}
          <div className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h3 className="text-xl font-semibold text-secondary-900">Trusted By Leading Healthcare Organizations</h3>
              </div>
              
              <div className="relative">
                {/* Background decorative elements */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-secondary-200 to-transparent"></div>
                </div>
                
                {/* Premium logo display with gradients and glass effects */}
                <div className="relative grid grid-cols-2 lg:grid-cols-6 gap-8 md:gap-12 items-center justify-items-center">
                  {/* Logo 1 - Johns Hopkins */}
                  <div className="bg-white shadow-md rounded-xl p-6 border border-secondary-100 hover:shadow-lg hover:border-primary-100 transition-all duration-300 h-24 w-full flex items-center justify-center">
                    <div className="relative h-12">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-700 opacity-10 blur-xl rounded-full"></div>
                      <div className="relative flex items-center justify-center h-full">
                        <div className="text-secondary-900 font-bold text-lg">Johns Hopkins</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Logo 2 - Mayo Clinic */}
                  <div className="bg-white shadow-md rounded-xl p-6 border border-secondary-100 hover:shadow-lg hover:border-primary-100 transition-all duration-300 h-24 w-full flex items-center justify-center">
                    <div className="relative h-12">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-700 opacity-10 blur-xl rounded-full"></div>
                      <div className="relative flex items-center justify-center h-full">
                        <div className="text-secondary-900 font-bold text-lg">Mayo Clinic</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Logo 3 - Cleveland Clinic */}
                  <div className="bg-white shadow-md rounded-xl p-6 border border-secondary-100 hover:shadow-lg hover:border-primary-100 transition-all duration-300 h-24 w-full flex items-center justify-center">
                    <div className="relative h-12">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-700 opacity-10 blur-xl rounded-full"></div>
                      <div className="relative flex items-center justify-center h-full">
                        <div className="text-secondary-900 font-bold text-lg">Cleveland Clinic</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Logo 4 - Mass General */}
                  <div className="bg-white shadow-md rounded-xl p-6 border border-secondary-100 hover:shadow-lg hover:border-primary-100 transition-all duration-300 h-24 w-full flex items-center justify-center">
                    <div className="relative h-12">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-700 opacity-10 blur-xl rounded-full"></div>
                      <div className="relative flex items-center justify-center h-full">
                        <div className="text-secondary-900 font-bold text-lg">Mass General</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Logo 5 - NYU Langone */}
                  <div className="bg-white shadow-md rounded-xl p-6 border border-secondary-100 hover:shadow-lg hover:border-primary-100 transition-all duration-300 h-24 w-full flex items-center justify-center">
                    <div className="relative h-12">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-yellow-700 opacity-10 blur-xl rounded-full"></div>
                      <div className="relative flex items-center justify-center h-full">
                        <div className="text-secondary-900 font-bold text-lg">NYU Langone</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Logo 6 - Stanford Health */}
                  <div className="bg-white shadow-md rounded-xl p-6 border border-secondary-100 hover:shadow-lg hover:border-primary-100 transition-all duration-300 h-24 w-full flex items-center justify-center">
                    <div className="relative h-12">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-700 opacity-10 blur-xl rounded-full"></div>
                      <div className="relative flex items-center justify-center h-full">
                        <div className="text-secondary-900 font-bold text-lg">Stanford Health</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Additional recognition */}
              <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md border border-secondary-100 text-center">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-secondary-900">HIPAA & GDPR Compliant</h4>
                  <p className="mt-2 text-secondary-700">Adheres to international data protection standards</p>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-md border border-secondary-100 text-center">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-secondary-900">ISO 27001 Certified</h4>
                  <p className="mt-2 text-secondary-700">Enterprise-grade information security management</p>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-md border border-secondary-100 text-center">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-secondary-900">HL7 FHIR Compatible</h4>
                  <p className="mt-2 text-secondary-700">Seamless integration with healthcare systems</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white py-12 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary-600 rounded-full opacity-5 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-600 rounded-full opacity-5 translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="space-y-6">
              <div>
                <Link to="/" className="inline-flex items-center">
                  <span className="text-3xl font-bold text-primary-400">DocConnect</span>
                </Link>
              </div>
              <p className="text-secondary-300 leading-relaxed">
                Revolutionizing global healthcare through technology, making quality care accessible to everyone, everywhere, in any language.
              </p>
              <div className="flex space-x-5">
                <a href="#" className="text-secondary-300 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-secondary-300 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-secondary-300 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-secondary-300 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6 text-primary-300">Platform</h3>
              <ul className="space-y-4">
                <li><Link to="/login" className="text-secondary-300 hover:text-white transition-colors">For Patients</Link></li>
                <li><Link to="/login" className="text-secondary-300 hover:text-white transition-colors">For Doctors</Link></li>
                <li><a href="#" className="text-secondary-300 hover:text-white transition-colors">For Enterprises</a></li>
                <li><a href="#" className="text-secondary-300 hover:text-white transition-colors">For Hospitals</a></li>
                <li><a href="#" className="text-secondary-300 hover:text-white transition-colors">API & Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6 text-primary-300">Company</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-secondary-300 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-secondary-300 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-secondary-300 hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="text-secondary-300 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-secondary-300 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6 text-primary-300">Get in Touch</h3>
              <div className="space-y-4">
                <p className="text-secondary-300 flex items-start">
                  <svg className="h-6 w-6 mr-3 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>support@docconnect.com</span>
                </p>
                <p className="text-secondary-300 flex items-start">
                  <svg className="h-6 w-6 mr-3 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>+91 9876543210</span>
                </p>
                <div className="pt-4">
                  <h4 className="text-white font-medium mb-2">Subscribe to our newsletter</h4>
                  <form className="flex">
                    <input
                      type="email"
                      placeholder="Your email"
                      className="px-4 py-2 w-full rounded-l-md bg-secondary-800 border-secondary-700 text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <button
                      type="submit"
                      className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-r-md transition-colors"
                    >
                      Subscribe
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-secondary-800">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-secondary-400">
                &copy; {new Date().getFullYear()} DocConnect. All rights reserved.
              </p>
              <div className="flex mt-4 md:mt-0 space-x-6">
                <a href="#" className="text-sm text-secondary-400 hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="text-sm text-secondary-400 hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="text-sm text-secondary-400 hover:text-white transition-colors">Cookie Policy</a>
                <a href="#" className="text-sm text-secondary-400 hover:text-white transition-colors">Accessibility</a>
              </div>
            </div>
          </div>
          
          {/* Language selector */}
          <div className="mt-8 flex justify-center md:justify-end">
            <div className="inline-flex items-center border border-secondary-700 rounded-md px-3 py-1">
              <GlobeAltIcon className="h-5 w-5 text-secondary-400 mr-2" />
              <select className="bg-transparent text-secondary-400 focus:outline-none text-sm">
                <option value="en-US">English (US)</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="zh">中文</option>
                <option value="ja">日本語</option>
                <option value="ar">العربية</option>
              </select>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 