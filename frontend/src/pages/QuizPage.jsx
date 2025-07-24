// src/pages/QuizPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import quizBg from '../../public/1.mp3';
import RedBackground from '../assets/background.jpg';

const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function QuizPage() {
  const loc = useLocation();
  const nav = useNavigate();
  const lang = new URLSearchParams(loc.search).get('language') || 'English';

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [idx, setIdx] = useState(0);
  const [seconds, setSeconds] = useState(15 * 60);
  const [submitted, setSubmitted] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [err, setErr] = useState('');

  const endAtRef = useRef(null);
  const sentRef = useRef(false);
  const tickRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(
          `https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/quiz/questions?language=${lang}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setQuestions(data);
        setAnswers(Array(data.length).fill(null));
        endAtRef.current = Date.now() + 15 * 60 * 1000;
      } catch (e) {
        if (e.response?.status === 403) setAttempted(true);
        else if (e.response?.status === 401) nav('/login');
        else setErr('Failed to load quiz');
      }
    })();
  }, [lang, nav]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (submitted || attempted) audioRef.current.pause();
    else audioRef.current.play().catch(() => {});
  }, [submitted, attempted]);

  useEffect(() => {
    if (!endAtRef.current || questions.length === 0 || submitted || attempted) return;

    const tick = () => {
      const remain = Math.floor((endAtRef.current - Date.now()) / 1000);
      setSeconds(remain >= 0 ? remain : 0);

      if (remain <= 0 && !sentRef.current) {
        clearInterval(tickRef.current);
        doSubmit(true);
      }
    };

    tick();
    tickRef.current = setInterval(tick, 1000);
    return () => clearInterval(tickRef.current);
  }, [questions, submitted, attempted]);

  const pick = i => setAnswers(prev => { const next = [...prev]; next[idx] = i; return next; });

  const doSubmit = async (auto = true) => {
    if (sentRef.current) return;
    sentRef.current = true;
    setSubmitted(true);

    try {
      await axios.post(
        'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/quiz/submit',
        { answers, timeTaken: 15 * 60 - seconds, language: lang },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
    } catch (e) {
      if (!auto) setErr(e.response?.data?.message || 'Submit failed');
    } finally {
      audioRef.current?.pause();
      setTimeout(() => nav('/case-video'), 1200);
    }
  };

  if (attempted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#1a1a1a]">
        <div className="max-w-md bg-white bg-opacity-95 shadow-xl p-6 text-center rounded-xl">
          <h2 className="text-2xl font-extrabold mb-4 text-red-700">
            You’ve already taken this quiz
          </h2>
          <button onClick={() => nav('/')} className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium">
            Home
          </button>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  const currentAnswered = answers[idx] !== null;
  const allAnswered = answers.every(a => a !== null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-cover bg-center"
         style={{ backgroundImage: `url(${RedBackground})` }}>
      <audio ref={audioRef} src={quizBg} loop />

      <div className="w-full max-w-3xl bg-[#000000b3] shadow-2xl rounded-2xl p-8 text-white">
        <span className="absolute top-4 right-4 bg-black/90 text-white text-sm px-4 py-1 rounded-lg">
          ⏳ {fmt(seconds)}
        </span>

        <h1 className="text-4xl font-extrabold text-center mb-8 bg-gradient-to-r from-yellow-400 to-red-600 bg-clip-text text-transparent">
          Quiz – {lang}
        </h1>

        {err && <p className="text-red-400 text-center mb-4">{err}</p>}

        <AnimatePresence mode="wait">
          {q && (
            <motion.div
              key={idx}
              initial={{ x: 90, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -90, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="bg-[#1e1e1e] border-2 border-yellow-600 p-6 rounded-xl"
            >
              <p className="font-semibold mb-4">Question {idx + 1} / {questions.length}</p>
              <p className="text-lg font-bold mb-6">{q.question}</p>

              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => pick(i)}
                  disabled={submitted}
                  className={`block w-full text-left px-4 py-3 mb-3 rounded-lg border-2 transition
                    ${answers[idx] === i
                      ? 'bg-green-700 border-green-500 font-bold text-white'
                      : 'bg-[#333] hover:bg-[#444] border-gray-600 text-white'}`}
                >
                  {opt}
                </button>
              ))}

              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setIdx(p => Math.max(p - 1, 0))}
                  disabled={idx === 0 || submitted}
                  className="px-5 py-2 bg-gray-500 text-white rounded-lg disabled:opacity-40"
                >
                  ‹ Prev
                </button>

                {idx < questions.length - 1 ? (
                  <button
                    onClick={() => setIdx(p => p + 1)}
                    disabled={submitted || !currentAnswered}
                    className="px-5 py-2 bg-yellow-600 text-white rounded-lg disabled:opacity-40"
                  >
                    Next ›
                  </button>
                ) : !submitted && (
                  <button
                    onClick={() => doSubmit(false)}
                    disabled={!allAnswered}
                    className="px-5 py-2 bg-red-700 text-white rounded-lg disabled:opacity-40"
                  >
                    Submit
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {submitted && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center mt-8"
          >
            <p className="text-green-400 font-semibold mb-4 text-xl">✅ Submitted!</p>
            <p className="text-sm text-white">Redirecting to Case-study video…</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
