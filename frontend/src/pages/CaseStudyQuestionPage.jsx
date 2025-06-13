// src/pages/CaseStudyQuestionPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function CaseStudyQuestionPage() {
  /* ─── state ────────────────────────────────────────── */
  const [questions, setQuestions]       = useState([]);
  const [answers,   setAnswers]         = useState([]);      // ← numeric indices (0‑3)
  const [index,     setIndex]           = useState(0);
  const [language,  setLanguage]        = useState('English');
  const [timeLeft,  setTimeLeft]        = useState(20 * 60); // 20 min
  const [sending,   setSending]         = useState(false);
  const timerRef                         = useRef(null);
  const navigate                         = useNavigate();

  /* ─── fetch questions ──────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/case/questions?language=${language}`,
          { headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` } }
        );
        setQuestions(data);
        setAnswers(Array(data.length).fill(null));    // init with nulls
        setIndex(0);                                  // reset pagination
      } catch (err) {
        if (err.response?.status === 403) navigate('/thank-you');
        else console.error(err);
      }
    })();
  }, [language, navigate]);

  /* ─── countdown ────────────────────────────────────── */
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  /* ─── helpers ──────────────────────────────────────── */
  const format = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const handlePick = optionIdx => {
    setAnswers(a => {
      const copy = [...a];
      copy[index] = optionIdx;        // save number, not string
      return copy;
    });
  };

  const allAnswered = answers.every(a => a !== null);

  /* ─── submit ───────────────────────────────────────── */
  const handleSubmit = async () => {
    if (sending) return;
    setSending(true);

    try {
      await axios.post(
        'http://localhost:5000/api/case/submit',
        {
          answers,                    // now numeric indices
          timeTaken: 20*60 - timeLeft,
          language
        },
        { headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` } }
      );
      navigate('/thank-you');
    } catch (err) {
      console.error(err);
      setSending(false);
    }
  };

  /* ─── render ───────────────────────────────────────── */
  if (!questions.length) return <p className="p-6">Loading questions…</p>;
  const q = questions[index];

  return (
    <div className="min-h-screen p-6 bg-white text-gray-900">
      {/* header */}
      <div className="flex justify-between mb-6">
        <div>
          <label className="mr-2 font-semibold">Language:</label>
          <select value={language}
                  onChange={e=>setLanguage(e.target.value)}
                  className="border px-2 py-1 rounded">
            <option>English</option>
            <option>Sinhala</option>
          </select>
        </div>
        <div className="font-bold text-xl">⏳ {format(timeLeft)}</div>
      </div>

      {/* question card */}
      <div className="border p-6 rounded shadow max-w-2xl mx-auto">
        <h3 className="font-semibold text-lg mb-4">
          Q{index+1}: {q.question}
        </h3>

        <div className="space-y-3">
          {q.options.map((opt,i)=>(
            <label key={i} className="flex items-center">
              <input
                type="radio"
                name={`q-${index}`}
                checked={answers[index] === i}
                onChange={()=>handlePick(i)}
                className="mr-2 accent-blue-600"
              />
              {opt}
            </label>
          ))}
        </div>

        {/* navigation */}
        <div className="flex justify-between mt-6">
          <button
            disabled={index===0}
            onClick={()=>setIndex(i=>i-1)}
            className="bg-gray-300 px-4 py-2 rounded disabled:opacity-50"
          >
            Previous
          </button>

          {index === questions.length-1 ? (
            <button
              disabled={!allAnswered || sending}
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50 hover:bg-blue-700"
            >
              {sending ? 'Submitting…' : 'Submit Answers'}
            </button>
          ) : (
            <button
              onClick={()=>setIndex(i=>i+1)}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
