import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const EntryPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-400 text-white">
      <div className="text-center px-6 max-w-2xl">
        <h1 className="text-5xl font-extrabold mb-6 drop-shadow-lg">Welcome to the ACCA Real World Challenge</h1>
        <p className="text-lg mb-8 font-medium">Experience the power of learning, competition, and real-world skills.</p>
        <Button label="Get in the Game" onClick={() => navigate('/login')} className="bg-white text-purple-700 hover:bg-gray-100 font-bold px-6 py-3" />
      </div>
    </div>
  );
};

export default EntryPage;