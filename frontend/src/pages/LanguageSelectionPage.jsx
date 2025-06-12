import React from 'react';
import { useNavigate } from 'react-router-dom';

const LanguageSelectionPage = () => {
  const navigate = useNavigate();

  const handleSelectLanguage = (lang) => {
    // Save selected language or pass it to next route
   navigate(`/quiz?language=${lang}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white p-6">
      <h1 className="text-4xl md:text-5xl font-extrabold mb-10 text-center drop-shadow-lg">
        🌐 Choose Your Language
      </h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sinhala Button */}
        <button
          onClick={() => handleSelectLanguage('Sinhala')}
          className="bg-white text-purple-700 px-8 py-4 rounded-xl shadow-xl text-2xl font-semibold hover:bg-yellow-400 hover:text-black transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          Sinhala
        </button>

        {/* English Button */}
        <button
          onClick={() => handleSelectLanguage('English')}
          className="bg-white text-pink-700 px-8 py-4 rounded-xl shadow-xl text-2xl font-semibold hover:bg-blue-400 hover:text-white transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          English
        </button>
      </div>

      <p className="mt-8 text-lg italic text-white/80 drop-shadow-sm">
        Select your preferred language to continue.
      </p>
    </div>
  );
};

export default LanguageSelectionPage;
