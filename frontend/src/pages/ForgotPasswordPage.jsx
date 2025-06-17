import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import emailjs from '@emailjs/browser';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [msg, setMsg]     = useState('');
  const [err, setErr]     = useState('');
  const [loading, setLoad]= useState(false);
  const [loaded, setLoaded]=useState(false);

  useEffect(() => setLoaded(true), []);

  /** call EmailJS after backend gives us resetUrl */
  const sendResetEmail = (resetUrl) => {
    const params = { to_email: email, reset_link: resetUrl };
    emailjs
      .send('service_f1uai2r', 'template_rrwuspb', params, 'xwk1xXa00YX4a03tY')
      .then(() => setMsg('📧  Check your inbox for the reset link!'))
      .catch((err) => {
        console.error("EmailJS Error:", err);
        setErr('Could not send e‑mail. Please try again later.');
});

  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(''); setErr('');
    setLoad(true);
    try {
      const res  = await fetch(
        'http://localhost:5000/api/auth/forgot-password',
        { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email }) }
      );
      const data = await res.json();
      res.ok ? sendResetEmail(data.resetUrl)
             : setErr(data.message || 'Request failed');
    } catch { setErr('Network error, please try again.'); }
    setLoad(false);
  };

  /* tiny helpers */
  const Input = () => (
    <input
      type="email"
      required
      value={email}
      onChange={(e)=>setEmail(e.target.value)}
      placeholder="you@example.com"
      className="
        w-full px-4 py-3 rounded-lg border-2 border-white/30
        bg-white/20 backdrop-blur-sm text-white placeholder-white/70
        focus:outline-none focus:border-yellow-300 focus:bg-white/30
        transition-all
      "
    />
  );

  const Button = () => (
    <button
      disabled={loading}
      className="
        relative w-full px-6 py-3 rounded-lg font-bold text-lg
        bg-white text-purple-700 shadow-xl transition-all
        hover:scale-105 hover:shadow-2xl hover:bg-yellow-100
        active:scale-95 disabled:opacity-60
      "
    >
      {loading
        ? <span className="flex items-center justify-center">
            <span className="animate-spin h-5 w-5 border-b-2 border-purple-700 mr-2 rounded-full"></span>
            Sending…
          </span>
        : 'Send reset link'}
      <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-pink-400 opacity-0 hover:opacity-20 rounded-lg" />
    </button>
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-500 to-yellow-400">
      {/* decorative bubbles – now ignore pointer events */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-yellow-200 rounded-full animate-bounce animation-delay-300"></div>
        <div className="absolute bottom-20 left-16 w-36 h-36 bg-pink-200 rounded-full animate-ping animation-delay-500"></div>
        <div className="absolute bottom-36 right-40 w-20 h-20 bg-purple-200 rounded-full animate-pulse animation-delay-700"></div>
      </div>

      {/* floating particles */}
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-white rounded-full opacity-40 animate-float pointer-events-none"
          style={{
            left: `${Math.random()*100}%`,
            top : `${Math.random()*100}%`,
            animationDelay  : `${Math.random()*3}s`,
            animationDuration: `${4+Math.random()*2}s`,
          }}
        />
      ))}

      {/* card */}
      <div className="min-h-screen flex items-center justify-center px-4">
        <div
          className={`
            w-full max-w-md transform transition-all duration-1000
            ${loaded ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'}
          `}
        >
          <div className="relative z-10 backdrop-blur-lg bg-white/20 p-8 rounded-2xl shadow-2xl border border-white/30">
            <h2 className="text-3xl font-extrabold text-center text-white mb-6">
              Forgot Password
            </h2>

            {err && <p className="mb-4 p-3 bg-red-500/20 border border-red-400/50 text-red-100 rounded-lg animate-slideIn">⚠ {err}</p>}
            {msg && <p className="mb-4 p-3 bg-green-500/20 border border-green-400/50 text-green-100 rounded-lg animate-slideIn">✅ {msg}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-white/90 font-semibold text-sm mb-1">📧 Your Email</label>
              <Input />
              <Button />
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-white/80 hover:text-white font-medium transition-colors">
                ← Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* custom CSS */}
      <style jsx="true">{`
        @keyframes float {
          0%,100%{transform:translateY(0) rotate(0deg);}
          33%   {transform:translateY(-15px) rotate(120deg);}
          66%   {transform:translateY(-8px)  rotate(240deg);}
        }
        @keyframes slideIn {
          from {opacity:0; transform:translateY(-10px);}
          to   {opacity:1; transform:translateY(0);}
        }
        .animate-float  {animation: float 5s ease-in-out infinite;}
        .animate-slideIn{animation: slideIn 0.4s ease-out;}
      `}</style>
    </div>
  );
};

export default ForgotPasswordPage;
