import React from 'react';
import { Outlet } from 'react-router-dom';
import MainLayout from './MainLayout';

const BloodBankLayout = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <Outlet />
      </div>
    </MainLayout>
  );
};

export default BloodBankLayout;