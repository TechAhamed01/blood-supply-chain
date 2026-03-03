import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { hospitalAPI } from '../../api/hospitals';
import { analyticsAPI } from '../../api/analytics';
import { Droplet, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import Loader from '../../components/ui/Loader';
import StatusBadge from '../../components/ui/StatusBadge';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

const HospitalDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({
    total_requests: 0,
    pending_requests: 0,
    approved_requests: 0,
    completed_requests: 0,
  });
  const [nearbyBanks, setNearbyBanks] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch recent requests
      const requestsResponse = await hospitalAPI.getRequests(user?.id, { 
        page_size: 5 
      });
      setRequests(requestsResponse.data);
      
      // Calculate stats from requests
      const allRequests = requestsResponse.data;
      setStats({
        total_requests: allRequests.length,
        pending_requests: allRequests.filter(r => r.status === 'PENDING').length,
        approved_requests: allRequests.filter(r => r.status === 'APPROVED').length,
        completed_requests: allRequests.filter(r => r.status === 'COMPLETED').length,
      });

      // Fetch nearby blood banks (mock for now - would need geolocation)
      setNearbyBanks([
        { id: 1, name: 'City Blood Bank', distance: '2.5 km', blood_types: ['A+', 'O+', 'B-'] },
        { id: 2, name: 'Red Cross Center', distance: '3.8 km', blood_types: ['All types'] },
        { id: 3, name: 'Memorial Blood Bank', distance: '5.1 km', blood_types: ['A+', 'A-', 'O+'] },
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullPage />;
  }

  const statCards = [
    {
      title: 'Total Requests',
      value: stats.total_requests,
      icon: Droplet,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Pending',
      value: stats.pending_requests,
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      title: 'Approved',
      value: stats.approved_requests,
      icon: TrendingUp,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Completed',
      value: stats.completed_requests,
      icon: AlertTriangle,
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}
        </h1>
        <p className="text-gray-600">Hospital Dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Requests</h2>
            <Link 
              to={ROUTES.HOSPITAL.REQUESTS}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View All
            </Link>
          </div>
          
          <div className="space-y-3">
            {requests.length > 0 ? (
              requests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {request.blood_type} - {request.units} units
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No requests yet</p>
            )}
          </div>
        </div>

        {/* Nearby Blood Banks */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Nearby Blood Banks</h2>
            <Link 
              to={ROUTES.HOSPITAL.BLOOD_BANKS}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View All
            </Link>
          </div>
          
          <div className="space-y-3">
            {nearbyBanks.map((bank) => (
              <div key={bank.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{bank.name}</p>
                  <p className="text-xs text-gray-500">{bank.distance} away</p>
                </div>
                <span className="text-xs bg-white px-2 py-1 rounded-full">
                  {bank.blood_types.join(', ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;