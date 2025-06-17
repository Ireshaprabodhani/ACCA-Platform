import React from 'react';
import { useNavigate } from 'react-router-dom';

const ThankYouPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-green-50 text-center p-6">
      <h1 className="text-4xl font-bold text-green-700 mb-4">🎉 Thank You!</h1>
      <p className="text-lg text-gray-800 mb-6">
        Your successfully finsh the game.
      </p>
      <button
        onClick={() => navigate('/')}
        className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
      >
        Go to Home
      </button>
    </div>
  );
};

export default ThankYouPage;
