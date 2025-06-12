import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import InputField from '../components/InputField';
import Button from '../components/Button';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setSuccess('');

  try {
    const response = await fetch('http://localhost:5000/api/auth/login', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || 'Login failed'); 
      return;
    }

    setSuccess('Login successful! Redirecting...');

    localStorage.setItem('token', data.token); 

    setTimeout(() => {
      navigate('/introduction-video');
    }, 1800);
  } catch (err) {
    setError('Something went wrong. Please try again.');
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-8 border shadow-lg rounded-xl">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        {error && <div className="mb-4 text-red-600 font-semibold">{error}</div>}
        {success && <div className="mb-4 text-green-600 font-semibold">{success}</div>}

        <form onSubmit={handleSubmit}>
          <InputField label="Email" type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} />
          <InputField label="Password" type="password" name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} />
          <Button label="Login" type="submit" className="w-full mt-4" />
        </form>

        <div className="mt-4 text-center text-sm">
          <Link to="/forgot-password" className="text-blue-600 hover:underline">Forgot Password?</Link>
        </div>
        <div className="mt-2 text-center text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">Register here</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
