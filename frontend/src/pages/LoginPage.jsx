import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import InputField from '../components/InputField';
import RedBackground from '../assets/background.jpg';

const LoginPage = () => {
  const navigate = useNavigate();
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      const res = await fetch(
        'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Login failed');
        setIsLoading(false);
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      try { jwtDecode(data.token); } catch {}
      setSuccess('Login successful! Redirecting…');
      setTimeout(() => {
        navigate(data.role === 'admin' ? '/admin' : '/introduction-video');
      }, 800);
    } catch {
      setError('Network error. Please try again.');
      setIsLoading(false);
    }
  }, [formData, navigate]);

  const Button = useCallback(({ label, type, className }) => (
    <button
      type={type}
      disabled={isLoading}
      className={`relative overflow-hidden px-6 py-3 rounded-lg font-bold text-lg
        text-white shadow-xl transition-all duration-300
        hover:scale-105 hover:shadow-2xl active:scale-95 group
        disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
      style={{
        background: 'linear-gradient(45deg, #9a0000, #ff0034 50%, maroon)',
      }}
    >
      <span className="relative z-10 flex items-center justify-center">
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
            Logging in...
          </>
        ) : (
          label
        )}
      </span>
    </button>
  ), [isLoading]);

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-black bg-cover bg-center"
      style={{ backgroundImage: `url(${RedBackground})` }}
    >
      <div className="min-h-screen flex items-center justify-center px-4">
        <div
          className={`w-full max-w-md transform transition-all duration-1000 ${
            isLoaded ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'
          }`}
        >
          <div className="bg-[#000000b3] p-8 rounded-2xl shadow-2xl border border-red-500/30 backdrop-blur-sm">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-white mb-2 text-4xl font-extrabold mb-6 text-white text-transparent text-transparent">
                Welcome Back!
              </h2>
              <p className="text-white text-opacity-80 font-medium">
                Ready to continue your challenge?
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-400 border-opacity-50 rounded-lg text-red-100 font-semibold backdrop-blur-sm animate-slideIn">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-green-500 bg-opacity-20 border border-green-400 border-opacity-50 rounded-lg text-green-100 font-semibold backdrop-blur-sm animate-slideIn">
                ✅ {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <InputField
                ref={emailInputRef}
                label="📧 Email Address"
                labelClass="text-white"       // 👈 make labels white
                inputClass="bg-black bg-opacity-60 text-white placeholder-gray-300" // styled input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />

              <InputField
                ref={passwordInputRef}
                label="🔒 Password"
                labelClass="text-white"
                inputClass="bg-black bg-opacity-60 text-white placeholder-gray-300"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />

              <Button label="🚀 Login to start" type="submit" className="w-full mt-6" />
            </form>

            <p className="mt-6 text-center text-white text-opacity-60 text-sm">
              🎮 Join thousands of students in the ultimate learning challenge
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideIn {
          animation: slideIn 0.5s ease-out;
        }

        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
