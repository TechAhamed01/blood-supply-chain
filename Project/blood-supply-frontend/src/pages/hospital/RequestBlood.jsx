import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { hospitalAPI } from '../../api/hospitals';
import { bloodBankAPI } from '../../api/bloodbanks';
import { emergencyAPI } from '../../api/emergency';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import { AlertCircle } from 'lucide-react';

const BLOOD_TYPES = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
];

const RequestBlood = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [formData, setFormData] = useState({
    blood_type: '',
    units: '',
    urgency: 'NORMAL',
    hospital_id: user?.id,
    blood_bank_id: '',
    patient_name: '',
    patient_age: '',
    reason: '',
    required_by: '',
  });
  const [errors, setErrors] = useState({});
  const [inventoryCheck, setInventoryCheck] = useState(null);

  useEffect(() => {
    fetchBloodBanks();
  }, []);

  useEffect(() => {
    if (formData.blood_bank_id && formData.blood_type) {
      checkInventory();
    }
  }, [formData.blood_bank_id, formData.blood_type]);

  const fetchBloodBanks = async () => {
    try {
      const response = await bloodBankAPI.getAll();
      setBloodBanks(response.data);
    } catch (error) {
      toast.error('Failed to fetch blood banks');
    }
  };

  const checkInventory = async () => {
    try {
      const response = await bloodBankAPI.getInventory(formData.blood_bank_id);
      const inventory = response.data.find(
        item => item.blood_type === formData.blood_type
      );
      setInventoryCheck(inventory || { units_available: 0 });
    } catch (error) {
      console.error('Failed to check inventory:', error);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.blood_type) newErrors.blood_type = 'Blood type is required';
    if (!formData.units) newErrors.units = 'Units are required';
    if (parseInt(formData.units) <= 0) newErrors.units = 'Units must be greater than 0';
    if (!formData.blood_bank_id) newErrors.blood_bank_id = 'Please select a blood bank';
    if (!formData.patient_name) newErrors.patient_name = 'Patient name is required';
    if (!formData.patient_age) newErrors.patient_age = 'Patient age is required';
    if (!formData.reason) newErrors.reason = 'Reason is required';
    
    if (inventoryCheck && parseInt(formData.units) > inventoryCheck.units_available) {
      newErrors.units = `Only ${inventoryCheck.units_available} units available`;
    }
    
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      if (formData.urgency === 'EMERGENCY') {
        await emergencyAPI.create(formData);
        toast.success('Emergency request created successfully');
      } else {
        await hospitalAPI.createRequest(user?.id, formData);
        toast.success('Blood request created successfully');
      }
      
      navigate(ROUTES.HOSPITAL.REQUESTS);
    } catch (error) {
      toast.error('Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Request Blood</h1>
        <p className="text-gray-600">Create a new blood request for your hospital</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Request Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Blood Type"
              name="blood_type"
              value={formData.blood_type}
              onChange={handleChange}
              options={BLOOD_TYPES.map(type => ({ value: type, label: type }))}
              error={errors.blood_type}
              required
            />

            <Input
              label="Units Needed"
              name="units"
              type="number"
              min="1"
              value={formData.units}
              onChange={handleChange}
              error={errors.units}
              required
            />

            <Select
              label="Blood Bank"
              name="blood_bank_id"
              value={formData.blood_bank_id}
              onChange={handleChange}
              options={bloodBanks.map(bank => ({ 
                value: bank.id, 
                label: bank.name 
              }))}
              error={errors.blood_bank_id}
              required
            />

            <Select
              label="Urgency Level"
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
              options={[
                { value: 'NORMAL', label: 'Normal' },
                { value: 'URGENT', label: 'Urgent' },
                { value: 'EMERGENCY', label: 'Emergency' },
              ]}
              required
            />
          </div>

          {inventoryCheck && formData.blood_bank_id && formData.blood_type && (
            <div className={`p-4 rounded-lg ${
              inventoryCheck.units_available >= formData.units 
                ? 'bg-green-50' 
                : 'bg-yellow-50'
            }`}>
              <p className="text-sm">
                <span className="font-medium">Available units: </span>
                {inventoryCheck.units_available} units
                {inventoryCheck.units_available < formData.units && (
                  <span className="block text-yellow-700 mt-1">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Insufficient units available at selected blood bank
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        <div className="card space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Patient Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Patient Name"
              name="patient_name"
              value={formData.patient_name}
              onChange={handleChange}
              error={errors.patient_name}
              required
            />

            <Input
              label="Patient Age"
              name="patient_age"
              type="number"
              min="0"
              max="120"
              value={formData.patient_age}
              onChange={handleChange}
              error={errors.patient_age}
              required
            />

            <Input
              label="Required By"
              name="required_by"
              type="date"
              value={formData.required_by}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
            />

            <div className="md:col-span-2">
              <Input
                label="Reason for Request"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                error={errors.reason}
                placeholder="e.g., Surgery, Emergency, Regular transfusion"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(ROUTES.HOSPITAL.REQUESTS)}
          >
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Submit Request
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RequestBlood;