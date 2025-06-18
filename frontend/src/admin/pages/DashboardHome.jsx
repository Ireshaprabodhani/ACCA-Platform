import React, { useEffect, useState } from 'react';
import { Users, ListTodo, BookOpen, Video } from 'lucide-react';
import axios from 'axios';

const StatCard = ({ icon, label, value, color }) => (
  <div className="flex items-center gap-4 bg-white shadow rounded-lg p-5">
    <div className={`p-3 rounded-full text-white ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
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
      // optionally, set error state here
    });
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Quick Stats</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users size={20} />}
          label="Registered Users"
          value={stats.users}
          color="bg-purple-500"
        />
        <StatCard
          icon={<ListTodo size={20} />}
          label="Quiz Questions"
          value={stats.quizQ}
          color="bg-blue-500"
        />
        <StatCard
          icon={<BookOpen size={20} />}
          label="Case Questions"
          value={stats.caseQ}
          color="bg-green-500"
        />
        <StatCard
          icon={<Video size={20} />}
          label="Videos"
          value={stats.videos}
          color="bg-red-500"
        />
      </div>
    </div>
  );
};

export default DashboardHome;
