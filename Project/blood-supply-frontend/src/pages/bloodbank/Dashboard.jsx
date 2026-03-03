import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { bloodBankAPI } from '../../api/bloodbanks';
import { emergencyAPI } from '../../api/emergency';
import { analyticsAPI } from '../../api/analytics';
import { Droplet, AlertTriangle, Clock, TrendingDown } from 'lucide-react';
import Loader from '../../components/ui/Loader';
import StatusBadge from '../../components/ui/StatusBadge';
import { getBloodTypeColor } from '../../utils/helpers';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

const BloodBankDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [predictions, setPredictions] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch inventory
      const inventoryResponse = await bloodBankAPI.getInventory(user?.id);
      setInventory(inventoryResponse.data);

      // Fetch alerts
      const alertsResponse = await bloodBankAPI.getAlerts(user?.id, { 
        page_size: 5 
      });
      setAlerts(alertsResponse.data);

      // Fetch emergency requests (mock for now)
      setEmergencyRequests([
        { id: 1, hospital: 'City Hospital', blood_type: 'O-', units: 5, requested_at: new Date().toISOString() },
        { id: 2, hospital: 'Memorial Hospital', blood_type: 'A+', units: 3, requested_at: new Date().toISOString() },
      ]);

      // Fetch predictions
      const predictionsResponse = await analyticsAPI.getPredictions();
      setPredictions(predictionsResponse.data);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullPage />;
  }

  const totalUnits = inventory.reduce((sum, item) => sum + item.units_available, 0);
  const lowStockItems = inventory.filter(item => item.units_available < 10);
  const expiringSoon = inventory.filter(item => {
    const daysUntilExpiry = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  });

  const stats = [
    {
      title: 'Total Units',
      value: totalUnits,
      icon: Droplet,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Low Stock Items',
      value: lowStockItems.length,
      icon: AlertTriangle,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      title: 'Expiring Soon',
      value: expiringSoon.length,
      icon: Clock,
      color: 'bg-orange-100 text-orange-600',
    },
    {
      title: 'Emergency Requests',
      value: emergencyRequests.length,
      icon: TrendingDown,
      color: 'bg-red-100 text-red-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}
        </h1>
        <p className="text-gray-600">Blood Bank Dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
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
        {/* Inventory Summary */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Inventory Summary</h2>
            <Link 
              to={ROUTES.BLOOD_BANK.INVENTORY}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Manage Inventory
            </Link>
          </div>
          
          <div className="space-y-3">
            {inventory.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className={`px-2 py-1 text-sm font-medium rounded-full ${getBloodTypeColor(item.blood_type)}`}>
                    {item.blood_type}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">{item.units_available} units</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${Math.min((item.units_available / 20) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
            <Link 
              to={ROUTES.BLOOD_BANK.ALERTS}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View All
            </Link>
          </div>
          
          <div className="space-y-3">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <div key={alert.id} className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">{alert.message}</p>
                      <p className="text-xs text-red-600 mt-1">{alert.created_at}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No active alerts</p>
            )}
          </div>
        </div>

        {/* Emergency Requests */}
        <div className="card lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Emergency Requests</h2>
            <Link 
              to={ROUTES.BLOOD_BANK.EMERGENCY}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View All
            </Link>
          </div>
          
          <div className="space-y-3">
            {emergencyRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                <div>
                  <p className="text-sm font-medium text-red-800">{request.hospital}</p>
                  <p className="text-xs text-red-600">
                    {request.blood_type} - {request.units} units
                  </p>
                </div>
                <button className="btn-primary text-sm py-1 px-3">
                  Fulfill
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodBankDashboard;