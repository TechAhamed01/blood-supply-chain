import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { emergencyAPI } from '../../api/emergency';
import { bloodBankAPI } from '../../api/bloodbanks';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle,
  MapPin,
  Phone,
  Mail,
  Droplet,
  Ambulance
} from 'lucide-react';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { formatDate, getBloodTypeColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

const EmergencyRequests = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showFulfillModal, setShowFulfillModal] = useState(false);
  const [fulfillData, setFulfillData] = useState({
    units_provided: '',
    notes: ''
  });
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState('pending'); // pending, in-progress, completed

  useEffect(() => {
    fetchEmergencyRequests();
  }, [filter]);

  const fetchEmergencyRequests = async (page = 1) => {
    try {
      setLoading(true);
      const response = await emergencyAPI.getAll({ 
        page,
        page_size: 10,
        status: filter !== 'all' ? filter : undefined
      });
      
      setRequests(response.data);
      setPagination(response.meta?.pagination);
    } catch (error) {
      console.error('Error fetching emergency requests:', error);
      toast.error('Failed to fetch emergency requests');
    } finally {
      setLoading(false);
    }
  };

  const handleFulfillRequest = async () => {
    if (!fulfillData.units_provided || parseInt(fulfillData.units_provided) <= 0) {
      toast.error('Please enter valid units');
      return;
    }

    setProcessing(true);
    try {
      await emergencyAPI.fulfill(selectedRequest.id, {
        units_provided: parseInt(fulfillData.units_provided),
        notes: fulfillData.notes,
        blood_bank_id: user?.id
      });

      toast.success('Emergency request fulfilled successfully');
      setShowFulfillModal(false);
      setSelectedRequest(null);
      setFulfillData({ units_provided: '', notes: '' });
      fetchEmergencyRequests(pagination?.page);
    } catch (error) {
      toast.error('Failed to fulfill request');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to reject this emergency request?')) return;

    try {
      await emergencyAPI.reject(requestId, {
        blood_bank_id: user?.id,
        reason: 'Insufficient inventory'
      });

      toast.success('Request rejected');
      fetchEmergencyRequests(pagination?.page);
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const getUrgencyColor = (urgency) => {
    switch(urgency) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'in-progress':
        return <Badge variant="info">In Progress</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const filterOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'all', label: 'All Requests' },
  ];

  if (loading) {
    return <Loader fullPage text="Loading emergency requests..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emergency Requests</h1>
          <p className="text-gray-600">Critical blood requests from hospitals</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="danger" size="lg" className="animate-pulse">
            {requests.filter(r => r.urgency === 'CRITICAL').length} Critical
          </Badge>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
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
      </Card>

      {/* Emergency Requests Grid */}
      <div className="grid grid-cols-1 gap-6">
        {requests.length > 0 ? (
          requests.map((request) => (
            <Card key={request.id} className={`border-l-4 ${
              request.urgency === 'CRITICAL' ? 'border-l-red-500' :
              request.urgency === 'HIGH' ? 'border-l-orange-500' :
              'border-l-yellow-500'
            }`}>
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Request Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.hospital_name}
                        </h3>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                        {request.location || 'Location not specified'}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(request.urgency)}`}>
                      {request.urgency} URGENCY
                    </div>
                  </div>

                  {/* Blood Requirements */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Blood Type</p>
                      <span className={`px-2 py-1 text-sm font-medium rounded-full ${getBloodTypeColor(request.blood_type)}`}>
                        {request.blood_type}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Units Needed</p>
                      <p className="text-lg font-semibold text-gray-900">{request.units}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Required By</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(request.required_by)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Requested</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(request.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Patient Info & Reason */}
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">Patient: {request.patient_name}</p>
                    <p className="text-sm text-gray-600">{request.reason}</p>
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-wrap gap-4">
                    {request.contact_phone && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <Phone className="h-4 w-4 mr-1 text-gray-400" />
                        {request.contact_phone}
                      </p>
                    )}
                    {request.contact_email && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <Mail className="h-4 w-4 mr-1 text-gray-400" />
                        {request.contact_email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {request.status === 'pending' && (
                  <div className="flex lg:flex-col gap-2 lg:min-w-[200px]">
                    <Button
                      variant="danger"
                      fullWidth
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowFulfillModal(true);
                      }}
                      icon={Ambulance}
                    >
                      Fulfill Request
                    </Button>
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => handleRejectRequest(request.id)}
                      icon={XCircle}
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {request.status === 'in-progress' && (
                  <div className="lg:min-w-[200px]">
                    <Badge variant="info" size="lg" className="w-full text-center py-2">
                      <Clock className="h-4 w-4 mr-2 inline" />
                      In Progress
                    </Badge>
                  </div>
                )}

                {request.status === 'completed' && (
                  <div className="lg:min-w-[200px]">
                    <Badge variant="success" size="lg" className="w-full text-center py-2">
                      <CheckCircle className="h-4 w-4 mr-2 inline" />
                      Completed
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
          ))
        ) : (
          <EmptyState
            icon={AlertTriangle}
            title="No emergency requests"
            description="There are no emergency requests at this time."
          />
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <Pagination
          pagination={pagination}
          onPageChange={(page) => fetchEmergencyRequests(page)}
        />
      )}

      {/* Fulfill Request Modal */}
      <Modal
        isOpen={showFulfillModal}
        onClose={() => {
          setShowFulfillModal(false);
          setSelectedRequest(null);
          setFulfillData({ units_provided: '', notes: '' });
        }}
        title="Fulfill Emergency Request"
        size="md"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                This is an emergency request. Please respond immediately.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h4 className="font-medium text-gray-900 mb-2">Request Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Hospital</p>
                  <p className="text-sm font-medium">{selectedRequest.hospital_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Blood Type</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBloodTypeColor(selectedRequest.blood_type)}`}>
                    {selectedRequest.blood_type}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Units Needed</p>
                  <p className="text-sm font-medium">{selectedRequest.units}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Required By</p>
                  <p className="text-sm font-medium">{formatDate(selectedRequest.required_by)}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Units to Provide <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={selectedRequest.units}
                value={fulfillData.units_provided}
                onChange={(e) => setFulfillData({ ...fulfillData, units_provided: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter number of units"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum available: {selectedRequest.units} units
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                rows="3"
                value={fulfillData.notes}
                onChange={(e) => setFulfillData({ ...fulfillData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Any additional information..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowFulfillModal(false);
                  setSelectedRequest(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleFulfillRequest}
                loading={processing}
              >
                Confirm Fulfillment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EmergencyRequests;