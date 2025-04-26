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
        return authenticatedUser;
      } else {
        // If token verification fails, clean up localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return null;
      }
    } catch (error) {
      console.error("Auth verification error:", error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    try {
      console.log("Attempting login with:", { email });
      const response = await axios.post('/api/auth/login', { email, password });
      
      if (response.data.token) {
        const token = response.data.token;
        const userData = response.data.user;
        
        // Save auth data to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
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
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Login failed. Please check your credentials.');
    }
  };

  const signup = async (data: SignupData): Promise<User> => {
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
        localStorage.setItem('user', JSON.stringify(userData));
        
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
        throw new Error(error.response.data.message);
      }
      throw new Error('Registration failed. Please try again.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('pendingRedirect');
    setUser(null);
  };

  // Update user information (for profile updates)
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    // Also update localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
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
    updateUser
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