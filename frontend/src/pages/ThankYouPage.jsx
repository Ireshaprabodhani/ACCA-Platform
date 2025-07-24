import React from 'react';
import { useNavigate } from 'react-router-dom';
import RedBackground from '../assets/background.jpg';

const ThankYouPage = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 bg-cover bg-center"
      style={{ backgroundImage: `url(${RedBackground})` }}
    >
      <div className="bg-[#000000b3] backdrop-blur-md rounded-3xl p-10 shadow-2xl text-center max-w-xl w-full">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-lime-500 mb-6">
          🎉 Thank You!
        </h1>

        <p className="text-lg text-white/90 mb-8">
          You've successfully finished the game. Great job!
        </p>

        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-lg font-bold text-white shadow-md transition transform hover:scale-105"
          style={{
            background: 'linear-gradient(45deg, #9a0000, #ff0034 50%, maroon)',
          }}
        >
          🔁 Go to Home
        </button>
      </div>
    </div>
  );
};

export default ThankYouPage;
