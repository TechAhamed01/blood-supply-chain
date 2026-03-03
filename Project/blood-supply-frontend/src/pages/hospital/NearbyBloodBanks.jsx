import React, { useState, useEffect } from 'react';
import { bloodBankAPI } from '../../api/bloodbanks';
import { MapPin, Droplet, Phone, Mail } from 'lucide-react';
import Input from '../../components/ui/Input';
import Loader from '../../components/ui/Loader';
import { getBloodTypeColor } from '../../utils/helpers';

const NearbyBloodBanks = () => {
  const [bloodBanks, setBloodBanks] = useState([]);
  const [filteredBanks, setFilteredBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBloodType, setSelectedBloodType] = useState('');

  const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    fetchBloodBanks();
  }, []);

  useEffect(() => {
    filterBloodBanks();
  }, [searchTerm, selectedBloodType, bloodBanks]);

  const fetchBloodBanks = async () => {
    try {
      setLoading(true);
      const response = await bloodBankAPI.getAll();
      // Add mock distance for demo
      const banksWithDistance = response.data.map(bank => ({
        ...bank,
        distance: (Math.random() * 10 + 1).toFixed(1) // Mock distance in km
      }));
      setBloodBanks(banksWithDistance);
      setFilteredBanks(banksWithDistance);
    } catch (error) {
      console.error('Failed to fetch blood banks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBloodBanks = () => {
    let filtered = [...bloodBanks];

    if (searchTerm) {
      filtered = filtered.filter(bank =>
        bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bank.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedBloodType) {
      filtered = filtered.filter(bank =>
        bank.inventory?.some(item => 
          item.blood_type === selectedBloodType && item.units_available > 0
        )
      );
    }

    // Sort by distance
    filtered.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    setFilteredBanks(filtered);
  };

  if (loading) {
    return <Loader fullPage />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nearby Blood Banks</h1>
        <p className="text-gray-600">Find blood banks near your location</p>
      </div>

      {/* Filters */}
      <div className="card grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder="Search by name or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={MapPin}
        />
        
        <select
          className="input-field"
          value={selectedBloodType}
          onChange={(e) => setSelectedBloodType(e.target.value)}
        >
          <option value="">All Blood Types</option>
          {BLOOD_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* Blood Banks Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredBanks.length > 0 ? (
          filteredBanks.map((bank) => (
            <div key={bank.id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{bank.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {bank.address || 'Address not available'} • {bank.distance} km away
                      </p>
                    </div>
                    <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-1 rounded-full">
                      {bank.distance} km
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-3 flex flex-wrap gap-4">
                    {bank.phone && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        {bank.phone}
                      </p>
                    )}
                    {bank.email && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {bank.email}
                      </p>
                    )}
                  </div>

                  {/* Blood Types Available */}
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Available Blood Types:</p>
                    <div className="flex flex-wrap gap-2">
                      {bank.inventory?.map((item) => (
                        item.units_available > 0 && (
                          <span
                            key={item.blood_type}
                            className={`px-3 py-1 text-sm font-medium rounded-full ${getBloodTypeColor(item.blood_type)}`}
                          >
                            {item.blood_type} ({item.units_available} units)
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 md:ml-6">
                  <button className="btn-primary whitespace-nowrap">
                    <Droplet className="h-4 w-4 mr-2 inline" />
                    Request Blood
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card text-center py-12">
            <Droplet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No blood banks found</h3>
            <p className="text-gray-500 mt-1">Try adjusting your filters or search term</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbyBloodBanks;