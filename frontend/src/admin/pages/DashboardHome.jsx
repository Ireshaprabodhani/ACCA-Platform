import React, { useEffect, useState } from 'react';
import { Users, ListTodo, BookOpen, Video } from 'lucide-react';
import axios from 'axios';

const StatCard = ({ icon, label, value, color }) => (
  <div className="flex items-center gap-3 bg-white shadow-lg rounded-xl p-4 border-0 hover:shadow-xl hover:scale-105 transition-all duration-300 backdrop-blur-sm min-w-0">
    <div className={`p-3 rounded-xl ${color} text-white shadow-lg flex-shrink-0`}>
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-gray-600 font-medium uppercase tracking-wide truncate">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No auth token found. Please login.');
      setLoading(false);
      return;
    }

    axios.get('https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/stats', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(({ data }) => {
        console.log('API stats response:', data);
        if (
          data.users !== undefined &&
          data.quizQ !== undefined &&
          data.caseQ !== undefined &&
          data.videos !== undefined
        ) {
          setStats(data);
        } else if (data.stats) {
          setStats(data.stats);
        } else {
          setError('Unexpected API response structure.');
          console.warn('Unexpected API response structure:', data);
        }
      })
      .catch(err => {
        console.error('Failed to fetch stats:', err);
        setError('Failed to fetch stats. Please try again later.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 min-h-screen">

      {/* Loading or Error */}
      {loading && <p className="text-center text-gray-700">Loading stats...</p>}
      {error && <p className="text-center text-red-600">{error}</p>}

      {/* Stats Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Users size={20} />}
            label="Registered Users"
            value={stats.users.toLocaleString()}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            icon={<ListTodo size={20} />}
            label="Quiz Questions"
            value={stats.quizQ.toLocaleString()}
            color="bg-gradient-to-br from-green-500 to-green-600"
          />
          <StatCard
            icon={<BookOpen size={20} />}
            label="Case Studies"
            value={stats.caseQ.toLocaleString()}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          <StatCard
            icon={<Video size={20} />}
            label="Videos"
            value={stats.videos.toLocaleString()}
            color="bg-gradient-to-br from-orange-500 to-orange-600"
          />
        </div>
      )}

      {/* Recent Activity Section */}
      <div className="bg-white rounded-3xl p-8 shadow-xl border-0">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
            <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
            <div>
              <p className="font-medium text-gray-900">25 new users registered</p>
              <p className="text-sm text-gray-600">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl">
            <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
            <div>
              <p className="font-medium text-gray-900">12 new quiz questions added</p>
              <p className="text-sm text-gray-600">4 hours ago</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
            <div className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0"></div>
            <div>
              <p className="font-medium text-gray-900">5 case studies updated</p>
              <p className="text-sm text-gray-600">6 hours ago</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl">
            <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0"></div>
            <div>
              <p className="font-medium text-gray-900">3 videos uploaded</p>
              <p className="text-sm text-gray-600">8 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
