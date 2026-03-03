export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusColor = (status) => {
  const colors = {
    'APPROVED': 'bg-green-100 text-green-800',
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'REJECTED': 'bg-red-100 text-red-800',
    'COMPLETED': 'bg-blue-100 text-blue-800',
    'URGENT': 'bg-red-100 text-red-800',
    'NORMAL': 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getBloodTypeColor = (bloodType) => {
  const colors = {
    'A+': 'bg-red-100 text-red-800',
    'A-': 'bg-red-50 text-red-700',
    'B+': 'bg-blue-100 text-blue-800',
    'B-': 'bg-blue-50 text-blue-700',
    'AB+': 'bg-purple-100 text-purple-800',
    'AB-': 'bg-purple-50 text-purple-700',
    'O+': 'bg-green-100 text-green-800',
    'O-': 'bg-green-50 text-green-700',
  };
  return colors[bloodType] || 'bg-gray-100 text-gray-800';
};