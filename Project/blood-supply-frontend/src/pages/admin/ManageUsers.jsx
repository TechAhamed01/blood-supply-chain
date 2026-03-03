import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import toast from 'react-hot-toast';
import { USER_ROLES } from '../../utils/constants';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: USER_ROLES.HOSPITAL,
  });

  const columns = [
    { key: 'id', title: 'ID' },
    { key: 'name', title: 'Name' },
    { key: 'email', title: 'Email' },
    { 
      key: 'role', 
      title: 'Role',
      render: (row) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          row.role === USER_ROLES.ADMIN ? 'bg-purple-100 text-purple-800' :
          row.role === USER_ROLES.HOSPITAL ? 'bg-blue-100 text-blue-800' :
          'bg-green-100 text-green-800'
        }`}>
          {row.role}
        </span>
      )
    },
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
    fetchUsers();
  }, []);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers({ page });
      setUsers(response.data);
      setPagination(response.meta.pagination);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await adminAPI.deleteUser(id);
      toast.success('User deleted successfully');
      fetchUsers(pagination?.page);
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        await adminAPI.updateUser(editingUser.id, formData);
        toast.success('User updated successfully');
      } else {
        await adminAPI.createUser(formData);
        toast.success('User created successfully');
      }
      
      setShowModal(false);
      resetForm();
      fetchUsers(pagination?.page);
    } catch (error) {
      toast.error(editingUser ? 'Failed to update user' : 'Failed to create user');
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: USER_ROLES.HOSPITAL,
    });
  };

  const roleOptions = [
    { value: USER_ROLES.ADMIN, label: 'Admin' },
    { value: USER_ROLES.HOSPITAL, label: 'Hospital' },
    { value: USER_ROLES.BLOOD_BANK, label: 'Blood Bank' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-600">Add, edit, or remove system users</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <Table
        columns={columns}
        data={users}
        pagination={pagination}
        onPageChange={fetchUsers}
        loading={loading}
      />

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingUser ? 'Edit User' : 'Create New User'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          
          {!editingUser && (
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          )}
          
          <Select
            label="Role"
            options={roleOptions}
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
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
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageUsers;