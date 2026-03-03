import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Droplet, 
  Hospital, 
  AlertTriangle,
  Activity,
  Calendar,
  Download
} from 'lucide-react';
import { analyticsAPI } from '../../api/analytics';
import { adminAPI } from '../../api/admin';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

const SystemOverview = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [systemHealth, setSystemHealth] = useState({
    status: 'healthy',
    lastBackup: '2024-01-15T10:30:00Z',
    activeUsers: 0,
    apiLatency: 120,
    errorRate: 0.5,
  });

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics dashboard data
      const analyticsResponse = await analyticsAPI.getDashboard();
      
      // Fetch users count for system health
      const usersResponse = await adminAPI.getUsers({ page_size: 1 });
      
      setDashboardData(analyticsResponse.data);
      setSystemHealth(prev => ({
        ...prev,
        activeUsers: usersResponse.meta?.pagination?.total_count || 0,
      }));
      
    } catch (error) {
      console.error('Error fetching system data:', error);
      toast.error('Failed to fetch system overview data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    toast.success('Exporting system report...');
    // Implement export logic here
  };

  const handleRefreshData = () => {
    fetchSystemData();
    toast.success('System data refreshed');
  };

  if (loading) {
    return <Loader fullPage text="Loading system overview..." />;
  }

  // System metrics cards
  const systemMetrics = [
    {
      title: 'System Status',
      value: systemHealth.status,
      icon: Activity,
      color: 'bg-green-100 text-green-600',
      badge: systemHealth.status === 'healthy' ? 'success' : 'warning',
    },
    {
      title: 'Active Users',
      value: systemHealth.activeUsers,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'API Latency',
      value: `${systemHealth.apiLatency}ms`,
      icon: TrendingUp,
      color: 'bg-purple-100 text-purple-600',
      trend: '-5%',
      trendUp: false,
    },
    {
      title: 'Error Rate',
      value: `${systemHealth.errorRate}%`,
      icon: AlertTriangle,
      color: 'bg-yellow-100 text-yellow-600',
      trend: '-0.2%',
      trendUp: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>
          <p className="text-gray-600">Monitor system health and platform analytics</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshData}
            icon={Activity}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportReport}
            icon={Download}
          >
            Export Report
          </Button>
        </div>
      </div>

      {/* Last backup info */}
      <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl">
        <div className="flex items-center space-x-3">
          <Calendar className="h-5 w-5 text-blue-600" />
          <span className="text-sm text-blue-700">
            Last system backup: {new Date(systemHealth.lastBackup).toLocaleString()}
          </span>
        </div>
        <Badge variant="info" size="sm">Automated</Badge>
      </div>

      {/* System Metrics Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {systemMetrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl ${metric.color}`}>
                <metric.icon className="h-6 w-6" />
              </div>
              {metric.trend && (
                <div className={`flex items-center text-xs font-medium ${
                  metric.trendUp ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.trendUp ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {metric.trend}
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">{metric.title}</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {metric.value}
              </p>
              {metric.badge && (
                <Badge variant={metric.badge} size="sm" className="mt-2">
                  {metric.status}
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Platform Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution */}
        <Card title="User Distribution" subtitle="Platform user statistics">
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Administrators</span>
              </div>
              <span className="font-medium">{dashboardData?.admin_count || 5}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Hospitals</span>
              </div>
              <span className="font-medium">{dashboardData?.hospital_count || 24}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Blood Banks</span>
              </div>
              <span className="font-medium">{dashboardData?.blood_bank_count || 18}</span>
            </div>
          </div>
        </Card>

        {/* System Performance */}
        <Card title="System Performance" subtitle="Last 24 hours">
          <div className="space-y-4 mt-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">API Response Time</span>
                <span className="text-sm font-medium text-green-600">120ms avg</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Database Performance</span>
                <span className="text-sm font-medium text-green-600">95%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Cache Hit Rate</span>
                <span className="text-sm font-medium text-yellow-600">78%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent System Events */}
        <Card title="Recent System Events" className="lg:col-span-2">
          <div className="mt-4 space-y-3">
            {dashboardData?.recent_events?.length > 0 ? (
              dashboardData.recent_events.map((event, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`h-2 w-2 rounded-full ${
                      event.type === 'error' ? 'bg-red-500' :
                      event.type === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.message}</p>
                      <p className="text-xs text-gray-500">{event.time}</p>
                    </div>
                  </div>
                  <Badge variant={event.type === 'error' ? 'danger' : event.type === 'warning' ? 'warning' : 'success'} size="sm">
                    {event.type}
                  </Badge>
                </div>
              ))
            ) : (
              <EmptyState
                title="No recent events"
                description="System is running smoothly with no recent events to display"
              />
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <button className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-center">
            <Users className="h-6 w-6 text-primary-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-700">Manage Users</span>
          </button>
          <button className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-center">
            <BarChart3 className="h-6 w-6 text-primary-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-700">Analytics</span>
          </button>
          <button className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-center">
            <Activity className="h-6 w-6 text-primary-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-700">System Logs</span>
          </button>
          <button className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-center">
            <Calendar className="h-6 w-6 text-primary-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-700">Backup</span>
          </button>
        </div>
      </Card>
    </div>
  );
};

export default SystemOverview;