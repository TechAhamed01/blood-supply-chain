import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { hospitalAPI } from '../../api/hospitals';
import Table from '../../components/ui/Table';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatDate } from '../../utils/helpers';
import { Eye } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const Requests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const columns = [
    { key: 'id', title: 'Request ID' },
    { 
      key: 'blood_type', 
      title: 'Blood Type',
      render: (row) => (
        <span className="font-medium">{row.blood_type}</span>
      )
    },
    { 
      key: 'units', 
      title: 'Units',
      render: (row) => `${row.units} units`
    },
    {
      key: 'urgency',
      title: 'Urgency',
      render: (row) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          row.urgency === 'EMERGENCY' ? 'bg-red-100 text-red-800' :
          row.urgency === 'URGENT' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {row.urgency}
        </span>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: 'created_at',
      title: 'Requested On',
      render: (row) => formatDate(row.created_at)
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row) => (
        <button
          onClick={() => {
            setSelectedRequest(row);
            setShowDetails(true);
          }}
          className="text-primary-600 hover:text-primary-800"
        >
          <Eye className="h-4 w-4" />
        </button>
      )
    }
  ];

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async (page = 1) => {
    try {
      setLoading(true);
      const response = await hospitalAPI.getRequests(user?.id, { 
        page,
        page_size: 10 
      });
      setRequests(response.data);
      setPagination(response.meta.pagination);
    } catch (error) {
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Blood Requests</h1>
        <p className="text-gray-600">View and track all your blood requests</p>
      </div>

      <Table
        columns={columns}
        data={requests}
        pagination={pagination}
        onPageChange={fetchRequests}
        loading={loading}
      />

      <Modal
        isOpen={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedRequest(null);
        }}
        title="Request Details"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Request ID</p>
                <p className="font-medium">{selectedRequest.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <StatusBadge status={selectedRequest.status} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Blood Type</p>
                <p className="font-medium">{selectedRequest.blood_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Units</p>
                <p className="font-medium">{selectedRequest.units}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Urgency</p>
                <p className="font-medium">{selectedRequest.urgency}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Blood Bank</p>
                <p className="font-medium">{selectedRequest.blood_bank_name}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-2">Patient Information</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{selectedRequest.patient_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Age</p>
                  <p className="font-medium">{selectedRequest.patient_age}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-500">Reason</p>
              <p className="mt-1">{selectedRequest.reason}</p>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-500">Timeline</p>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Requested:</span>
                  <span className="text-sm">{formatDate(selectedRequest.created_at)}</span>
                </div>
                {selectedRequest.required_by && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Required by:</span>
                    <span className="text-sm">{formatDate(selectedRequest.required_by)}</span>
                  </div>
                )}
                {selectedRequest.fulfilled_at && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Fulfilled:</span>
                    <span className="text-sm">{formatDate(selectedRequest.fulfilled_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Requests;