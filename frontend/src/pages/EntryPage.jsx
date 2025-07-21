import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../assets/Logo-ACCA.png';
import BackgroundImage from '../assets/background.jpg'; 

const EntryPage = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const Button = ({ label, onClick, className }) => (
    <button
      onClick={onClick}
      className={`
        relative overflow-hidden px-8 py-4 rounded-full font-bold text-lg
        bg-white text-purple-700 shadow-xl transform transition-all duration-300
        hover:scale-110 hover:shadow-2xl hover:bg-yellow-100
        active:scale-95 group
        ${className}
      `}
    >
      <span className="relative z-10">{label}</span>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-500 to-cyan-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
      <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
      <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-pink-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping animation-delay-150"></div>
    </button>
  );

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center px-4 py-10 relative"
      style={{ backgroundImage: `url(${BackgroundImage})` }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black opacity-60 z-0"></div>

      <div className={`
        text-center max-w-3xl w-full text-white relative z-10
        transform transition-all duration-1000
        ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
      `}>
        {/* ACCA Logo */}
        <img
          src={Logo}
          alt="ACCA Logo"
          className="mx-auto w-40 h-40 md:w-52 md:h-52 object-contain mb-8"
        />

        {/* Heading */}
        <h2 className="text-xl font-semibold mb-2">Welcome to the</h2>
        <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
          ACCA Escape The Challenge
        </h1>

        {/* Subtitle */}
        <p className="text-base md:text-lg text-white mb-8 leading-relaxed">
          Experience the power of learning, competition, and real-world skills.
          <br />
          <span className="font-bold text-white">Challenge yourself. Master the future.</span>
        </p>

        {/* Features */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {[
            '🎯 Smart Challenges',
            '🏆 Real Competition',
            '📚 Skill Building',
            '⚡ Instant Results'
          ].map((feature, index) => (
            <span
              key={index}
              className="bg-white bg-opacity-10 text-sm font-medium text-white px-4 py-2 rounded-full border border-white shadow-sm"
            >
              {feature}
            </span>
          ))}
        </div>

        {/* Get in the Game Button */}
        <div>
          <Button
            label="🚀 Get in the Game"
            onClick={() => navigate('/login')}
            className="mb-4"
          />
          <p className="text-sm text-white">Join thousands of students already playing!</p>
        </div>
      </div>

      {/* Custom CSS */}
      <style jsx>{`
        @keyframes ping {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        .animate-ping {
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animation-delay-150 {
          animation-delay: 150ms;
        }
      `}</style>
    </div>
  );
};

export default EntryPage;
