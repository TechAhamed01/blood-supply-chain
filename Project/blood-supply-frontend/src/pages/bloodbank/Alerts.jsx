import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { bloodBankAPI } from '../../api/bloodbanks';
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  XCircle, 
  Filter,
  RefreshCw,
  Clock,
  Droplet
} from 'lucide-react';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const Alerts = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, resolved
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const fetchAlerts = async (page = 1) => {
    try {
      setLoading(true);
      const response = await bloodBankAPI.getAlerts(user?.id, { 
        page,
        page_size: 10,
        status: filter !== 'all' ? filter : undefined
      });
      
      setAlerts(response.data);
      setPagination(response.meta?.pagination);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts(pagination?.page);
    setRefreshing(false);
    toast.success('Alerts refreshed');
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      // API call to mark alert as read
      await bloodBankAPI.updateInventory(user?.id, { 
        alert_id: alertId, 
        action: 'mark_read' 
      });
      
      // Update local state
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, status: 'read' } 
            : alert
        )
      );
      
      toast.success('Alert marked as read');
    } catch (error) {
      toast.error('Failed to mark alert as read');
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      // API call to resolve alert
      await bloodBankAPI.updateInventory(user?.id, { 
        alert_id: alertId, 
        action: 'resolve' 
      });
      
      // Remove from list or mark as resolved
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      
      toast.success('Alert resolved successfully');
    } catch (error) {
      toast.error('Failed to resolve alert');
    }
  };

  const getAlertIcon = (type) => {
    switch(type) {
      case 'low_stock':
        return <Droplet className="h-5 w-5 text-yellow-500" />;
      case 'expiring':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'emergency':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getAlertColor = (type) => {
    switch(type) {
      case 'low_stock':
        return 'bg-yellow-50 border-yellow-200';
      case 'expiring':
        return 'bg-orange-50 border-orange-200';
      case 'emergency':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All Alerts' },
    { value: 'unread', label: 'Unread' },
    { value: 'resolved', label: 'Resolved' },
  ];

  if (loading && !refreshing) {
    return <Loader fullPage text="Loading alerts..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts & Notifications</h1>
          <p className="text-gray-600">Monitor system alerts and inventory notifications</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            loading={refreshing}
            icon={RefreshCw}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">Filter by:</span>
            <div className="flex space-x-2">
              {filterOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                    filter === option.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <Badge variant="primary" size="sm">
            {alerts.length} Active Alerts
          </Badge>
        </div>
      </Card>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-xl p-4 transition-all hover:shadow-md ${getAlertColor(alert.type)} ${
                alert.status === 'unread' ? 'ring-2 ring-primary-200' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-900">{alert.title}</h3>
                      {alert.status === 'unread' && (
                        <Badge variant="primary" size="sm">New</Badge>
                      )}
                      <Badge variant={
                        alert.type === 'emergency' ? 'danger' :
                        alert.type === 'low_stock' ? 'warning' : 'info'
                      } size="sm">
                        {alert.type?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                    
                    {/* Alert Details */}
                    {alert.details && (
                      <div className="bg-white bg-opacity-50 rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-700">{alert.details}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {formatDate(alert.created_at)}
                      </p>
                      <div className="flex items-center space-x-2">
                        {alert.status === 'unread' && (
                          <button
                            onClick={() => handleMarkAsRead(alert.id)}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          className="text-xs text-green-600 hover:text-green-700 font-medium"
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={Bell}
            title="No alerts found"
            description="You're all caught up! No alerts to display at this time."
          />
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <Pagination
          pagination={pagination}
          onPageChange={(page) => fetchAlerts(page)}
        />
      )}
    </div>
  );
};

export default Alerts;