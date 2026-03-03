import React from 'react';
import { getStatusColor } from '../../utils/helpers';

const StatusBadge = ({ status }) => {
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
      {status}
    </span>
  );
};

export default StatusBadge;