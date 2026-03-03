import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../../api/analytics';
import { Users, Droplet, Hospital, TrendingUp } from 'lucide-react';
import Loader from '../../components/ui/Loader';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullPage />;
  }

  const stats = [
    {
      name: 'Total Users',
      value: dashboardData?.total_users || 0,
      icon: Users,
      change: '+12%',
      changeType: 'increase',
    },
    {
      name: 'Blood Banks',
      value: dashboardData?.total_blood_banks || 0,
      icon: Droplet,
      change: '+2%',
      changeType: 'increase',
    },
    {
      name: 'Hospitals',
      value: dashboardData?.total_hospitals || 0,
      icon: Hospital,
      change: '+5%',
      changeType: 'increase',
    },
    {
      name: 'Total Requests',
      value: dashboardData?.total_requests || 0,
      icon: TrendingUp,
      change: '+23%',
      changeType: 'increase',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back, Admin</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-primary-100 rounded-xl">
                  <stat.icon className="h-6 w-6 text-primary-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500 truncate">
                  {stat.name}
                </p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      stat.changeType === 'increase'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {dashboardData?.recent_activity?.map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
              <span className="text-xs text-gray-500">{activity.user}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;