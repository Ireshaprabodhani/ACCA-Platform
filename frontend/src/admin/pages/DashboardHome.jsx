import React, { useEffect, useState } from 'react';
import { Users, ListTodo, BookOpen, Video, LogOut } from 'lucide-react';
import axios from 'axios';

const StatCard = ({ icon, label, value, color }) => (
  <div className="flex items-center gap-4 bg-white shadow-sm rounded-xl p-5 border border-purple-100 hover:shadow-md transition-all duration-300">
    <div className={`p-3 rounded-lg ${color} text-white`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-purple-600 font-medium">{label}</p>
      <p className="text-2xl font-bold text-purple-900 mt-1">{value}</p>
    </div>
  </div>
);

const DashboardHome = () => {
  const [stats, setStats] = useState({
    users: 0,
    quizQ: 0,
    caseQ: 0,
    videos: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    axios.get('https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/stats', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then(({ data }) => setStats(data))
    .catch(err => {
      console.error('Failed to fetch stats:', err);
    });
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post('https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/logout', {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      window.location.href = 'https://main.d1vjhvv9srhnme.amplifyapp.com/';
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 min-h-screen">
      {/* Header with Logout */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-purple-900">Dashboard Overview</h2>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg hover:from-purple-700 hover:to-pink-600 transition-all shadow-md"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users size={20} />}
          label="Registered Users"
          value={stats.users}
          color="bg-gradient-to-r from-purple-500 to-purple-400"
        />
        <StatCard
          icon={<ListTodo size={20} />}
          label="Quiz Questions"
          value={stats.quizQ}
          color="bg-gradient-to-r from-pink-500 to-pink-400"
        />
        <StatCard
          icon={<BookOpen size={20} />}
          label="Case Questions"
          value={stats.caseQ}
          color="bg-gradient-to-r from-indigo-500 to-indigo-400"
        />
        <StatCard
          icon={<Video size={20} />}
          label="Videos"
          value={stats.videos}
          color="bg-gradient-to-r from-red-500 to-red-400"
        />
      </div>

      {/* Additional content can be added here */}
      <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-purple-100">
        <h3 className="text-xl font-semibold text-purple-800 mb-4">Recent Activity</h3>
        <p className="text-purple-600">Your admin dashboard is ready to use. More analytics coming soon!</p>
      </div>
    </div>
  );
};

export default DashboardHome;