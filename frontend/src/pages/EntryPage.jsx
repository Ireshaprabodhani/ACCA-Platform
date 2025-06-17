import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const EntryPage = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    setIsLoaded(true);
    
    // Generate floating particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2,
    }));
    setParticles(newParticles);
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
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
      <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
      <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-pink-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping animation-delay-150"></div>
    </button>
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-500 to-yellow-400">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-yellow-200 rounded-full animate-bounce animation-delay-300"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-pink-200 rounded-full animate-ping animation-delay-500"></div>
        <div className="absolute bottom-40 right-40 w-20 h-20 bg-purple-200 rounded-full animate-pulse animation-delay-700"></div>
      </div>

      {/* Floating Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 bg-white rounded-full opacity-60 animate-float"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        ></div>
      ))}

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center text-white relative z-10">
        <div className={`
          text-center px-6 max-w-4xl transform transition-all duration-1000
          ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
        `}>
          {/* Main Title with Staggered Animation */}
          <div className="mb-8">
            <h1 className={`
              text-6xl md:text-7xl font-extrabold mb-4 
              bg-gradient-to-r from-white via-yellow-200 to-pink-200 bg-clip-text text-transparent
              transform transition-all duration-1000 animation-delay-300
              ${isLoaded ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}
            `}>
              Welcome to the
            </h1>
            <h2 className={`
              text-4xl md:text-5xl font-bold 
              bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent
              transform transition-all duration-1000 animation-delay-500
              ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
            `}>
              ACCA Real World Challenge
            </h2>
          </div>

          {/* Subtitle with fade-in animation */}
          <p className={`
            text-xl md:text-2xl mb-12 font-medium leading-relaxed
            transform transition-all duration-1000 animation-delay-700
            ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}
          `}>
            Experience the power of learning, competition, and real-world skills.
            <br />
            <span className="text-yellow-200 font-semibold">Challenge yourself. Master the future.</span>
          </p>

          {/* Animated Features */}
          <div className={`
            flex flex-wrap justify-center gap-4 mb-12 transform transition-all duration-1000 animation-delay-900
            ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}
          `}>
            {['🎯 Smart Challenges', '🏆 Real Competition', '📚 Skill Building', '⚡ Instant Results'].map((feature, index) => (
              <div
                key={index}
                className={`
                  bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-full
                  text-sm font-semibold hover:bg-opacity-30 transition-all duration-300
                  hover:scale-105 cursor-default animate-slideIn
                `}
                style={{ animationDelay: `${1000 + index * 200}ms` }}
              >
                {feature}
              </div>
            ))}
          </div>

          {/* Call to Action Button */}
          <div className={`
            transform transition-all duration-1000 animation-delay-1100
            ${isLoaded ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-95'}
          `}>
            <Button 
              label="🚀 Get in the Game" 
              onClick={() => navigate('/login')}
              className="mb-6"
            />
            <p className="text-sm opacity-80 font-medium">
              Join thousands of students already playing!
            </p>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(120deg); }
          66% { transform: translateY(-10px) rotate(240deg); }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-float {
          animation: float 4s ease-in-out infinite;
        }

        .animate-slideIn {
          animation: slideIn 0.6s ease-out forwards;
          opacity: 0;
        }

        .animation-delay-150 {
          animation-delay: 150ms;
        }
        
        .animation-delay-300 {
          animation-delay: 300ms;
        }
        
        .animation-delay-500 {
          animation-delay: 500ms;
        }
        
        .animation-delay-700 {
          animation-delay: 700ms;
        }
      `}</style>
    </div>
  );
};

export default EntryPage;