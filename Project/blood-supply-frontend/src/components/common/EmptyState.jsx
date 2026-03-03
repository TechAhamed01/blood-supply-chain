import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

const EmptyState = ({ 
  icon: Icon = Inbox, 
  title = 'No data found',
  description = 'There are no items to display at this time.',
  action,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="flex justify-center">
        <div className="bg-gray-100 p-4 rounded-2xl">
          <Icon className="h-12 w-12 text-gray-400" />
        </div>
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">{description}</p>
      {action && onAction && (
        <div className="mt-6">
          <Button onClick={onAction} variant="outline" size="sm">
            {actionText || action}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;