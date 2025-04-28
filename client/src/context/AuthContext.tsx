import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';

// Define user types
export interface User {
  id: string;
  _id?: string; // Add this for compatibility with different components
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  token?: string;
  specialization?: string;
  profilePicture?: string;
}

// Signup data interface
interface SignupData {
  name: string;
  email: string;
  password: string;
  role: 'patient' | 'doctor' | 'admin';
  specialization?: string;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  token?: string | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (data: SignupData) => Promise<User>;
  logout: () => void;
  checkAuthStatus: () => Promise<User | null>;
  updateUser: (updatedUser: User) => void;
  error: string | null;
}

// Export AuthContext as a named export
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure axios
axios.defaults.withCredentials = true;

// Auth provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem('token');

  // Initial auth check on mount
  useEffect(() => {
    checkAuthStatus().finally(() => {
      setLoading(false);
      setInitialized(true);
    });
  }, []);

  // Check if user is already authenticated
  const checkAuthStatus = async (): Promise<User | null> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return null;
      }
      
      // Verify token with backend
      const response = await axios.get('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const userData = response.data.user;
        const authenticatedUser: User = {
          id: userData._id,
          _id: userData._id, // Include both for compatibility
          name: userData.name,
          email: userData.email,
          role: userData.role,
          token: token,
          specialization: userData.specialization
        };
        
        setUser(authenticatedUser);
        localStorage.setItem('userId', authenticatedUser.id);
        localStorage.setItem('name', authenticatedUser.name);
        localStorage.setItem('role', authenticatedUser.role);
        return authenticatedUser;
      } else {
        // If token verification fails, clean up localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('name');
        localStorage.removeItem('role');
        return null;
      }
    } catch (error) {
      console.error("Auth verification error:", error);
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('name');
      localStorage.removeItem('role');
      return null;
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Attempting login with:", { email });
      const response = await axios.post('/api/auth/login', { email, password });
      
      if (response.data.token) {
        const token = response.data.token;
        const userData = response.data.user;
        
        // Save auth data to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('userId', userData._id);
        localStorage.setItem('name', userData.name);
        localStorage.setItem('role', userData.role);
        
        const authenticatedUser: User = {
          id: userData._id,
          _id: userData._id, // Include both for compatibility
          name: userData.name,
          email: userData.email,
          role: userData.role,
          token: token,
          specialization: userData.specialization
        };
        
        setUser(authenticatedUser);
        return authenticatedUser;
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.response) {
        // Server responded with error
        setError(error.response.data?.message || 'Server error occurred');
      } else if (error.request) {
        // Request made but no response
        setError('Server is unavailable. Please check your connection');
      } else {
        // Other errors
        setError('Login failed. Please check your credentials.');
      }
      throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: SignupData): Promise<User> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Attempting signup with:", { email: data.email, role: data.role });
      
      if (!data.role || (data.role !== 'patient' && data.role !== 'doctor')) {
        throw new Error('Invalid role selected. Please choose either patient or doctor.');
      }
      
      const response = await axios.post(`/api/auth/signup/${data.role}`, {
        name: data.name,
        email: data.email,
        password: data.password,
        ...(data.role === 'doctor' && data.specialization ? { specialization: data.specialization } : {})
      });
      
      if (response.data.token) {
        const token = response.data.token;
        const userData = response.data.user;
        
        // Save auth data to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('userId', userData._id);
        localStorage.setItem('name', userData.name);
        localStorage.setItem('role', userData.role);
        
        const authenticatedUser: User = {
          id: userData._id,
          _id: userData._id, // Include both for compatibility
          name: userData.name,
          email: userData.email,
          role: userData.role as 'patient' | 'doctor' | 'admin',
          token: token,
          specialization: userData.specialization
        };
        
        setUser(authenticatedUser);
        return authenticatedUser;
      } else {
        throw new Error('Registration failed');
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      }
      throw new Error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('name');
    localStorage.removeItem('role');
    localStorage.removeItem('pendingRedirect');
    setUser(null);
  };

  // Update user information (for profile updates)
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    // Also update localStorage
    localStorage.setItem('userId', updatedUser.id);
    localStorage.setItem('name', updatedUser.name);
    localStorage.setItem('role', updatedUser.role);
  };

  const value = {
    user,
    token,
    loading,
    initialized,
    login,
    signup,
    logout,
    checkAuthStatus,
    updateUser,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;