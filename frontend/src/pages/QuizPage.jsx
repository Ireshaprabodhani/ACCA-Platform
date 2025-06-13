// src/pages/QuizPage.jsx
import React, { useEffect, useState } from 'react';
import axios                        from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';   // ← ASCII hyphen!

const fmt = s =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function QuizPage() {
  const loc      = useLocation();
  const navigate = useNavigate();

  const lang = new URLSearchParams(loc.search).get('language') || 'English';

  /* ─── local state ─────────────────────────────────── */
  const [questions,    setQuestions]    = useState([]);
  const [answers,      setAnswers]      = useState([]);     // NEW  array of length 15
  const [idx,          setIdx]          = useState(0);
  const [timeLeft,     setTimeLeft]     = useState(15 * 60);
  const [submitted,    setSubmitted]    = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [err,          setErr]          = useState('');

  /* ─── pull questions (and block if 403) ───────────── */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/quiz/questions?language=${lang}`,
          { headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` } }
        );
        setQuestions(data);
        setAnswers(Array(data.length).fill(null));               // NEW
      } catch (e) {
        if (e.response?.status === 403) setHasAttempted(true);
        else if (e.response?.status === 401) navigate('/login');
        else  setErr('Failed to load quiz');
      }
    })();
  }, [lang, navigate]);

  /* ─── timer ───────────────────────────────────────── */
  useEffect(() => {
    if (submitted || hasAttempted) return;
    const id = setInterval(() => setTimeLeft(t => {
      if (t <= 1) { clearInterval(id); handleSubmit(); return 0; }
      return t - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [submitted, hasAttempted]);

  /* ─── option picker ──────────────────────────────── */
  const pick = i =>
    setAnswers(a => { const c=[...a]; c[idx]=i; return c; });

  /* ─── submit to backend ───────────────────────────── */
  const handleSubmit = async () => {
    if (submitted) return;
    try {
      await axios.post(
        'http://localhost:5000/api/quiz/submit',
        { answers, timeTaken: 15*60 - timeLeft, language: lang },   // NEW payload
        { headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` } }
      );
      setSubmitted(true);
    } catch (e) {
      setErr(e.response?.data?.message || 'Submit failed');
    }
  };

  /* ─── early exit if already attempted ─────────────── */
  if (hasAttempted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md bg-white shadow p-6 text-center">
          <h2 className="text-xl font-bold mb-3">You’ve already taken this quiz</h2>
          <button onClick={()=>navigate('/')} className="px-4 py-2 bg-blue-600 text-white rounded">
            Home
          </button>
        </div>
      </div>
    );
  }

  /* ─── render normal quiz UI ───────────────────────── */
  const q = questions[idx];

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-gradient-to-br from-pink-100 to-blue-100">
      <div className="w-full max-w-3xl bg-white shadow rounded p-6 relative">
        <span className="absolute top-4 right-4 bg-black text-white text-sm px-3 py-1 rounded">
          ⏳ {fmt(timeLeft)}
        </span>

        <h1 className="text-2xl font-bold text-center mb-4">Quiz – {lang}</h1>

        {err && <p className="text-red-600 text-center mb-4">{err}</p>}

        {q ? (
          <>
            <p className="font-semibold mb-2">
              Question {idx+1} / {questions.length}
            </p>

            <div className="bg-yellow-100 border border-yellow-400 p-4 rounded">
              <p className="font-semibold mb-4">{q.question}</p>
              {q.options.map((opt,i)=>(
                <button key={i}
                        onClick={()=>pick(i)}
                        disabled={submitted}
                        className={`block w-full text-left px-4 py-2 mb-2 rounded border
                          ${answers[idx]===i ? 'bg-green-300 border-green-600 font-bold'
                                             : 'bg-white hover:bg-blue-100'}`}>
                  {opt}
                </button>
              ))}
            </div>

            {/* nav / submit */}
            <div className="flex justify-between mt-6">
              <button onClick={()=>setIdx(i=>Math.max(i-1,0))}
                      disabled={idx===0 || submitted}
                      className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50">
                ‹ Prev
              </button>

              {idx < questions.length-1 ? (
                <button onClick={()=>setIdx(i=>i+1)}
                        disabled={submitted}
                        className="px-4 py-2 bg-blue-600 text-white rounded">
                  Next ›
                </button>
              ) : !submitted && (
                <button onClick={handleSubmit}
                        className="px-4 py-2 bg-red-600 text-white rounded">
                  Submit
                </button>
              )}
            </div>

            {submitted && (
              <div className="text-center mt-6">
                <p className="text-green-700 font-semibold mb-4">✅ Submitted!</p>
                <button onClick={()=>navigate('/case-video')}
                        className="px-6 py-3 bg-purple-600 text-white rounded">
                  Continue to Case Study
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-center">Loading…</p>
        )}
      </div>
    </div>
  );
}
