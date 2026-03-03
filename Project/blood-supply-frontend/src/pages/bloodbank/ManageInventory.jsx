import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { bloodBankAPI } from '../../api/bloodbanks';
import { Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { getBloodTypeColor, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const ManageInventory = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    blood_type: '',
    units_available: '',
    expiry_date: '',
    storage_location: '',
  });

  const columns = [
    { 
      key: 'blood_type', 
      title: 'Blood Type',
      render: (row) => (
        <span className={`px-2 py-1 text-sm font-medium rounded-full ${getBloodTypeColor(row.blood_type)}`}>
          {row.blood_type}
        </span>
      )
    },
    { 
      key: 'units_available', 
      title: 'Units Available',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <span className="font-medium">{row.units_available}</span>
          {row.units_available < 10 && (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          )}
        </div>
      )
    },
    {
      key: 'expiry_date',
      title: 'Expiry Date',
      render: (row) => {
        const daysUntilExpiry = Math.ceil((new Date(row.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
        const expiryClass = daysUntilExpiry <= 7 ? 'text-red-600 font-medium' : 'text-gray-600';
        return (
          <span className={expiryClass}>
            {formatDate(row.expiry_date)} ({daysUntilExpiry} days)
          </span>
        );
      }
    },
    { key: 'storage_location', title: 'Location' },
    {
      key: 'actions',
      title: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async (page = 1) => {
    try {
      setLoading(true);
      const response = await bloodBankAPI.getInventory(user?.id, { 
        page,
        page_size: 10 
      });
      setInventory(response.data);
      setPagination(response.meta?.pagination);
    } catch (error) {
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      blood_type: item.blood_type,
      units_available: item.units_available,
      expiry_date: item.expiry_date?.split('T')[0],
      storage_location: item.storage_location,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?')) return;
    
    try {
      await bloodBankAPI.updateInventory(user?.id, { id, action: 'delete' });
      toast.success('Inventory item deleted successfully');
      fetchInventory(pagination?.page);
    } catch (error) {
      toast.error('Failed to delete inventory item');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        units_available: parseInt(formData.units_available),
      };

      if (editingItem) {
        await bloodBankAPI.updateInventory(user?.id, { 
          ...data, 
          id: editingItem.id,
          action: 'update' 
        });
        toast.success('Inventory updated successfully');
      } else {
        await bloodBankAPI.updateInventory(user?.id, { 
          ...data, 
          action: 'add' 
        });
        toast.success('Inventory added successfully');
      }
      
      setShowModal(false);
      resetForm();
      fetchInventory(pagination?.page);
    } catch (error) {
      toast.error(editingItem ? 'Failed to update inventory' : 'Failed to add inventory');
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      blood_type: '',
      units_available: '',
      expiry_date: '',
      storage_location: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Inventory</h1>
          <p className="text-gray-600">Track and update blood inventory</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Inventory
        </Button>
      </div>

      {/* Low Stock Alert */}
      {inventory.some(item => item.units_available < 10) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Low Stock Alert</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Some blood types are running low. Consider placing orders soon.
              </p>
            </div>
          </div>
        </div>
      )}

      <Table
        columns={columns}
        data={inventory}
        pagination={pagination}
        onPageChange={fetchInventory}
        loading={loading}
      />

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingItem ? 'Edit Inventory' : 'Add New Inventory'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Blood Type"
            options={BLOOD_TYPES.map(type => ({ value: type, label: type }))}
            value={formData.blood_type}
            onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
            required
          />
          
          <Input
            label="Units Available"
            type="number"
            min="0"
            value={formData.units_available}
            onChange={(e) => setFormData({ ...formData, units_available: e.target.value })}
            required
          />
          
          <Input
            label="Expiry Date"
            type="date"
            value={formData.expiry_date}
            onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            required
          />
          
          <Input
            label="Storage Location"
            value={formData.storage_location}
            onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
            placeholder="e.g., Refrigerator A, Shelf 2"
            required
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingItem ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageInventory;