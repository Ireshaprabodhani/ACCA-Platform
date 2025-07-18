import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function CaseStudyQuestionPage() {
  /* ────────── state ────────── */
  const [questions, setQuestions] = useState([]);
  const [answers,   setAnswers]   = useState([]);
  const [index,     setIndex]     = useState(0);
  const [language,  setLanguage]  = useState('English');
  const [timeLeft,  setTimeLeft]  = useState(20 * 60);
  const [sending,   setSending]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const navigate     = useNavigate();
  const timerRef     = useRef(null);
  const submittedRef = useRef(false);
  const audioRef     = useRef(null);
  const answersRef   = useRef([]);
  const timeLeftRef  = useRef(timeLeft);
  const languageRef  = useRef(language);

  /* keep refs in sync */
  useEffect(() => { answersRef.current  = answers;  }, [answers]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { languageRef.current = language; }, [language]);

  /* ────────── helpers ────────── */
  const handleSubmit = useCallback(async () => {
    if (submittedRef.current || sending) return;
    submittedRef.current = true;
    setSending(true);
    setSubmitted(true);
    audioRef.current?.pause();

    try {
      await axios.post(
        'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/case/submit',
        {
          answers   : answersRef.current,
          timeTaken : 20 * 60 - timeLeftRef.current,
          language  : languageRef.current,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      navigate('/thank-you');
    } catch (err) {
      setError(err.response?.data?.message || 'Submit failed');
      setSending(false);
      setSubmitted(false);
      submittedRef.current = false;
    }
  }, [sending, navigate]);

  /* ────────── load questions ────────── */
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const { data } = await axios.get(
          `https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/case/questions?language=${language}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setQuestions(data);
        setAnswers(Array(data.length).fill(null));
        setIndex(0);
        audioRef.current?.play().catch(() => {});
      } catch (err) {
        if (err.response?.status === 403) navigate('/thank-you');
        else if (err.response?.status === 401) navigate('/login');
        else setError('Failed to load questions');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [language, navigate]);

  /* ────────── countdown ────────── */
  useEffect(() => {
    if (isLoading || submitted) return;
    const tick = () => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    };
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [isLoading, submitted, handleSubmit]);

  /* cleanup on unmount */
  useEffect(() => () => {
    clearInterval(timerRef.current);
    audioRef.current?.pause();
  }, []);

  /* ────────── derived values ────────── */
  const formatTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const allAnswered       = answers.every(a => a !== null);
  const currentAnswered   = answers[index] !== null;         // NEW
  const progress          = questions.length ? ((index + 1) / questions.length) * 100 : 0;
  const q                 = questions[index];
  const canSwitchLanguage = index === 0 && answers.every(a => a === null);
  const locked            = !canSwitchLanguage;

  const optionStyle = i =>
    answers[index] === i
      ? 'border-2 border-indigo-600 bg-indigo-100'
      : 'border border-gray-300 hover:bg-indigo-50';

  /* ────────── render ────────── */
  if (isLoading)      return <div className="p-10 text-center text-xl">Loading...</div>;
  if (!questions.length) return <div className="p-10 text-center text-red-500">{error || 'No questions'}</div>;

  return (
    <div className="min-h-screen bg-[#616a7c] p-6 flex justify-center items-center">
      <audio ref={audioRef} loop preload="auto">
        <source src="/case-study-bgm.mp3" type="audio/mpeg" />
      </audio>

      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        {/* top bar */}
        <div className="flex justify-between items-center mb-6">
          <select
            value={language}
            disabled={locked}
            onChange={e => { if (!locked) setLanguage(e.target.value); }}
            className="p-2 rounded border border-gray-300 disabled:opacity-50"
          >
            <option value="English">English</option>
            <option value="Sinhala">Sinhala</option>
          </select>

          <div className={`text-md font-medium px-4 py-1 rounded ${timeLeft < 60 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
            ⏱ Time: {formatTime(timeLeft)}
          </div>
        </div>

        {/* progress bar */}
        <div className="h-3 w-full bg-gray-200 rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-lg font-semibold mb-4">Q{index + 1}. {q.question}</h2>
            <div className="space-y-3">
              {q.options.map((opt, i) => (
                <div
                  key={i}
                  onClick={() => {
                    if (submitted) return;
                    setAnswers(prev => {
                      const updated = [...prev];
                      // NEW: toggle selection
                      updated[index] = updated[index] === i ? null : i;
                      return updated;
                    });
                  }}
                  className={`p-4 rounded-lg cursor-pointer transition ${optionStyle(i)}`}
                >
                  {opt}
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* nav buttons */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={() => setIndex(prev => Math.max(0, prev - 1))}
            disabled={index === 0 || submitted}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition disabled:opacity-50"
          >
            ← Previous
          </button>

          {index === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitted}
              className="px-5 py-2 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {sending ? 'Submitting…' : 'Submit Answers'}
            </button>
          ) : (
            <button
              onClick={() => setIndex(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={submitted || !currentAnswered}  /* NEW */
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition disabled:opacity-50"
            >
              Next →
            </button>
          )}
        </div>

        {/* modal */}
        {submitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50"
          >
            <div className="bg-white p-6 rounded-xl shadow-xl text-center max-w-sm w-full">
              <h2 className="text-xl font-bold text-indigo-700 mb-2">✅ Submission Complete</h2>
              <p className="text-gray-600">Thank you! Your answers have been recorded.</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
