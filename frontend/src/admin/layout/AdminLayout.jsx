import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const AdminLayout = () => {
  const [open, setOpen] = useState(true);   // sidebar toggle

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar open={open} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar toggleSidebar={() => setOpen(!open)} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
