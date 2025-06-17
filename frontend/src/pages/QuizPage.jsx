// src/pages/QuizPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';      // ← animation
import quizBg from '../../public/1.mp3';                // ← put any mp3 here

/* ---------- helpers ---------- */
const fmt = s =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/* ---------- component ---------- */
export default function QuizPage() {
  const loc  = useLocation();
  const nav  = useNavigate();
  const lang = new URLSearchParams(loc.search).get('language') || 'English';

  /* state */
  const [questions,    setQuestions]    = useState([]);
  const [answers,      setAnswers]      = useState([]);
  const [idx,          setIdx]          = useState(0);
  const [seconds,      setSeconds]      = useState(2 * 60);
  const [submitted,    setSubmitted]    = useState(false);
  const [attempted,    setAttempted]    = useState(false);
  const [err,          setErr]          = useState('');

  /* refs */
  const endAtRef  = useRef(null);     // epoch ms when quiz ends
  const sentRef   = useRef(false);    // guard to avoid double submit
  const tickRef   = useRef(null);     // interval id
  const audioRef  = useRef(null);

  /* -------- fetch questions -------- */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/quiz/questions?language=${lang}`,
          { headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` } }
        );
        setQuestions(data);
        setAnswers(Array(data.length).fill(null));
        endAtRef.current = Date.now() + 15 * 60 * 1000;    // start 15‑min countdown
      } catch (e) {
        if (e.response?.status === 403) setAttempted(true);
        else if (e.response?.status === 401) nav('/login');
        else setErr('Failed to load quiz');
      }
    })();
  }, [lang, nav]);

  /* -------- bg‑music -------- */
  useEffect(() => {
    if (!audioRef.current) return;
    if (submitted || attempted) audioRef.current.pause();
    else                        audioRef.current.play().catch(()=>{});
  }, [submitted, attempted]);

  /* -------- ticker -------- */
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

  tick(); // render immediately
  tickRef.current = setInterval(tick, 1000);

  return () => clearInterval(tickRef.current);
}, [questions, submitted, attempted]);


  /* -------- pick answer -------- */
  const pick = (i) =>
    setAnswers(a => { const c=[...a]; c[idx]=i; return c; });

  /* -------- submit -------- */
  const doSubmit = async (auto=true) => {
    if (sentRef.current) return;
    sentRef.current = true;
    setSubmitted(true);

    try {
      await axios.post(
        'http://localhost:5000/api/quiz/submit',
        { answers, timeTaken: 15*60 - seconds, language: lang },
        { headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` } }
      );
    } catch (e) {
      if (!auto) setErr(e.response?.data?.message || 'Submit failed');
    } finally {
      // stop music & redirect a second later
      audioRef.current?.pause();
      setTimeout(() => nav('/case-video'), 1200);
    }
  };

  /* -------- already attempted? -------- */
  if (attempted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6
                      bg-gradient-to-br from-purple-600 via-pink-500 to-yellow-400">
        <div className="max-w-md bg-white bg-opacity-95 shadow-xl p-6 text-center rounded-xl">
          <h2 className="text-2xl font-extrabold mb-4 text-purple-700">
            You’ve already taken this quiz
          </h2>
          <button onClick={()=>nav('/')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium">
            Home
          </button>
        </div>
      </div>
    );
  }

  const q = questions[idx];

  return (
    <div className="min-h-screen flex flex-col items-center p-6
                    bg-gradient-to-br from-purple-600 via-pink-500 to-yellow-400">
      {/* background music element (invisible) */}
      <audio ref={audioRef} src={quizBg} loop />

      <div className="w-full max-w-3xl bg-white bg-opacity-95 shadow-2xl
                      rounded-2xl p-6 relative overflow-hidden">
        {/* timer */}
        <span className="absolute top-4 right-4 bg-black/90 text-white text-sm px-4 py-1 rounded-lg">
          ⏳ {fmt(seconds)}
        </span>

        <h1 className="text-3xl font-extrabold text-center mb-6
                       bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Quiz – {lang}
        </h1>

        {err && <p className="text-red-600 text-center mb-4">{err}</p>}

        {/* ------------- animated question card ------------- */}
        <AnimatePresence mode="wait">
          {q && (
            <motion.div
              key={idx}
              initial={{ x: 90, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -90, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="bg-yellow-50 border-2 border-yellow-300 p-6 rounded-xl"
            >
              <p className="font-semibold mb-5">
                Question {idx + 1} / {questions.length}
              </p>

              <p className="text-lg font-bold mb-6">{q.question}</p>

              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => pick(i)}
                  disabled={submitted}
                  className={`block w-full text-left px-4 py-3 mb-3 rounded-lg border-2 transition
                    ${answers[idx] === i
                      ? 'bg-green-200 border-green-500 font-bold'
                      : 'bg-white hover:bg-purple-100 border-gray-300'}`}
                >
                  {opt}
                </button>
              ))}

              {/* navigation */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setIdx((p) => Math.max(p - 1, 0))}
                  disabled={idx === 0 || submitted}
                  className="px-5 py-2 bg-gray-300 rounded-lg disabled:opacity-40"
                >
                  ‹ Prev
                </button>

                {idx < questions.length - 1 ? (
                  <button
                    onClick={() => setIdx((p) => p + 1)}
                    disabled={submitted}
                    className="px-5 py-2 bg-purple-600 text-white rounded-lg"
                  >
                    Next ›
                  </button>
                ) : !submitted && (
                  <button
                    onClick={() => doSubmit(false)}
                    className="px-5 py-2 bg-red-600 text-white rounded-lg"
                  >
                    Submit
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* after‑submit message */}
        {submitted && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center mt-8"
          >
            <p className="text-green-700 font-semibold mb-4 text-xl">✅ Submitted!</p>
            <p className="text-sm text-gray-600">
              Redirecting to Case‑study video…
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
