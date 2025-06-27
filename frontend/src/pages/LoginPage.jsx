import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import InputField from '../components/InputField'; // update path based on your file structure

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

  const particles = useMemo(
    () =>
      Array.from({ length: 15 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 4 + Math.random() * 2,
      })),
    []
  );

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
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

        try {
          jwtDecode(data.token);
        } catch (_) {}

        setSuccess('Login successful! Redirecting…');

        setTimeout(() => {
          navigate(data.role === 'admin' ? '/admin' : '/introduction-video');
        }, 800);
      } catch {
        setError('Network error. Please try again.');
        setIsLoading(false);
      }
    },
    [formData, navigate]
  );

  const Button = useCallback(
    ({ label, type, className }) => (
      <button
        type={type}
        disabled={isLoading}
        className={`relative overflow-hidden px-6 py-3 rounded-lg font-bold text-lg
          bg-white text-purple-700 shadow-xl transition-all duration-300
          hover:scale-105 hover:shadow-2xl hover:bg-yellow-100 active:scale-95 group
          disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
      >
        <span className="relative z-10 flex items-center justify-center">
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-700 mr-2" />
              Logging in...
            </>
          ) : (
            label
          )}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
      </button>
    ),
    [isLoading]
  );

  const ParticleBackground = useMemo(
    () => (
      <>
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full animate-pulse" />
          <div className="absolute top-40 right-20 w-24 h-24 bg-yellow-200 rounded-full animate-bounce animation-delay-300" />
          <div className="absolute bottom-20 left-20 w-40 h-40 bg-pink-200 rounded-full animate-ping animation-delay-500" />
          <div className="absolute bottom-40 right-40 w-20 h-20 bg-purple-200 rounded-full animate-pulse animation-delay-700" />
        </div>
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-40 animate-float pointer-events-none"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </>
    ),
    [particles]
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#616a7c]">
      {ParticleBackground}

      <div className="min-h-screen flex items-center justify-center px-4">
        <div
          className={`w-full max-w-md transform transition-all duration-1000 ${
            isLoaded ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'
          }`}
        >
          <div className="backdrop-blur-xl bg-white/30 p-8 rounded-2xl shadow-2xl border border-white/40">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
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

            <form onSubmit={handleSubmit} className="space-y-2">
              <InputField
                ref={emailInputRef}
                label="📧 Email Address"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />

              <InputField
                ref={passwordInputRef}
                label="🔒 Password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />

              <Button label="🚀 Login to start" type="submit" className="w-full mt-6" />
            </form>

            <div className="mt-8 space-y-4 text-center">
              <Link
                to="/forgot-password"
                className="text-yellow-200 hover:text-yellow-100 font-semibold hover:underline transition-colors duration-300"
              >
                🔑 Forgot Password?
              </Link>

              <p className="text-white text-opacity-80">
                New to the challenge?{' '}
                <Link
                  to="/register"
                  className="text-yellow-200 hover:text-yellow-100 font-bold hover:underline transition-colors duration-300"
                >
                  🎯 Register here
                </Link>
              </p>

              <Link
                to="/"
                className="inline-flex items-center text-white text-opacity-70 hover:text-opacity-100 font-medium transition-colors duration-300"
              >
                ← Back to Home
              </Link>
            </div>

            <p className="mt-6 text-center text-white text-opacity-60 text-sm">
              🎮 Join thousands of students in the ultimate learning challenge
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          33% {
            transform: translateY(-15px) rotate(120deg);
          }
          66% {
            transform: translateY(-8px) rotate(240deg);
          }
        }
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
        .animate-float {
          animation: float 5s ease-in-out infinite;
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
