import React from 'react';
import { Menu } from 'lucide-react';

const Topbar = ({ toggleSidebar }) => (
  <header className="h-14 flex items-center justify-between bg-white shadow px-4">
    <button
      onClick={toggleSidebar}
      className="p-2 rounded hover:bg-gray-100 md:hidden"
    >
      <Menu size={22} />
    </button>
    <h1 className="text-lg font-semibold">Admin Dashboard</h1>
  </header>
);

export default Topbar;
