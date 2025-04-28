import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import axios from 'axios'

// Polyfills for WebRTC and related libraries
if (typeof window !== 'undefined') {
  window.global = window;
  window.process = window.process || { env: {} };
}

// Set up axios defaults - use Vite proxy for API requests
// Do not set a baseURL to use the proxy configured in vite.config.ts
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Clear any old axios configurations
delete axios.defaults.headers.common['Authorization'];

// Add token to requests if available
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  console.log('Found token in localStorage, adding to axios headers');
} else {
  console.log('No token found in localStorage');
}

// Add axios interceptor to update auth header when token changes
axios.interceptors.request.use(config => {
  // Always get the latest token
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add timestamp to prevent caching issues
  const url = config.url || '';
  const separator = url.includes('?') ? '&' : '?';
  config.url = `${url}${separator}_t=${new Date().getTime()}`;
  
  console.log('API Request:', { 
    url: config.url, 
    method: config.method, 
    headers: config.headers,
    data: config.data ? JSON.stringify(config.data).substring(0, 100) : 'No data' 
  });
  return config;
});

// Add response interceptor for better error logging
axios.interceptors.response.use(
  response => {
    console.log('API Response Success:', {
      status: response.status,
      url: response.config.url,
      data: JSON.stringify(response.data).substring(0, 100)
    });
    return response;
  },
  error => {
    console.error('API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data ? JSON.stringify(error.response.data).substring(0, 100) : 'No data'
    });
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
