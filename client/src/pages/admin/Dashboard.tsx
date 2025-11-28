import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

interface Stats {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  appointmentsToday: number;
  totalAppointments: number;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    appointmentsToday: 0,
    totalAppointments: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // In a real implementation, you would fetch this data from your API
        // For now, we'll use placeholder data
        
        // Simulate API call
        setTimeout(() => {
          setStats({
            totalUsers: 1250,
            totalDoctors: 150,
            totalPatients: 1100,
            appointmentsToday: 42,
            totalAppointments: 3678
          });
          setLoading(false);
        }, 800);
        
        // Real implementation would be:
        // const response = await axios.get('/api/admin/stats', {
        //   headers: { Authorization: `Bearer ${user?.token}` }
        // });
        // setStats(response.data);
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        setError('Failed to load dashboard stats. Please try again later.');
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
        <button 
          className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-md"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-secondary-900 mb-6">Admin Dashboard</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border border-secondary-100">
          <h2 className="text-lg font-semibold text-secondary-700 mb-2">Users</h2>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-3xl font-bold text-primary-600">{stats.totalUsers}</p>
              <p className="text-sm text-secondary-500">Total users</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold text-secondary-700">{stats.totalDoctors}</p>
              <p className="text-sm text-secondary-500">Doctors</p>
              <p className="text-xl font-semibold text-secondary-700 mt-2">{stats.totalPatients}</p>
              <p className="text-sm text-secondary-500">Patients</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border border-secondary-100">
          <h2 className="text-lg font-semibold text-secondary-700 mb-2">Appointments Today</h2>
          <p className="text-3xl font-bold text-primary-600">{stats.appointmentsToday}</p>
          <div className="flex items-center mt-2">
            <div className="w-full bg-secondary-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full" 
                style={{ width: `${Math.min(100, stats.appointmentsToday / 50 * 100)}%` }}
              ></div>
            </div>
            <span className="text-xs text-secondary-500 ml-2">Target: 50</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border border-secondary-100">
          <h2 className="text-lg font-semibold text-secondary-700 mb-2">Total Appointments</h2>
          <p className="text-3xl font-bold text-primary-600">{stats.totalAppointments}</p>
          <p className="text-sm text-secondary-500 mt-2">Across all time</p>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-secondary-100 mb-8">
        <h2 className="text-lg font-semibold text-secondary-700 mb-4">Recent Activity</h2>
        <p className="text-secondary-500 italic">Admin activity dashboard content would appear here in the real implementation.</p>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-secondary-100">
        <h2 className="text-lg font-semibold text-secondary-700 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-primary-50 hover:bg-primary-100 rounded-lg text-primary-700 transition-colors">
            Manage Users
          </button>
          <button className="p-4 bg-primary-50 hover:bg-primary-100 rounded-lg text-primary-700 transition-colors">
            View Reports
          </button>
          <button className="p-4 bg-primary-50 hover:bg-primary-100 rounded-lg text-primary-700 transition-colors">
            System Settings
          </button>
          <button className="p-4 bg-primary-50 hover:bg-primary-100 rounded-lg text-primary-700 transition-colors">
            Help Center
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 