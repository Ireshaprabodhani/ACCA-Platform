import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function CaseStudyQuestionPage() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [index, setIndex] = useState(0);
  const [language, setLanguage] = useState('English');
  const [timeLeft, setTimeLeft] = useState(2 * 60);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const timerRef = useRef(null);
  const submittedRef = useRef(false);
  const audioRef = useRef(null);
  const answersRef = useRef([]);
  const timeLeftRef = useRef(timeLeft);
  const languageRef = useRef(language);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { languageRef.current = language; }, [language]);

  const handleSubmit = useCallback(async () => {
    if (submittedRef.current || sending) return;
    submittedRef.current = true;
    setSending(true);
    setSubmitted(true);
    if (audioRef.current) audioRef.current.pause();

    try {
      await axios.post(
        'http://localhost:5000/api/case/submit',
        {
          answers: answersRef.current,
          timeTaken: 20 * 60 - timeLeftRef.current,
          language: languageRef.current,
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

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        const { data } = await axios.get(
          `http://localhost:5000/api/case/questions?language=${language}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setQuestions(data);
        setAnswers(Array(data.length).fill(null));
        setIndex(0);
        if (audioRef.current) {
          audioRef.current.play().catch(() => {});
        }
      } catch (err) {
        if (err.response?.status === 403) navigate('/thank-you');
        else if (err.response?.status === 401) navigate('/login');
        else setError('Failed to load questions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [language, navigate]);

  useEffect(() => {
    if (isLoading || submitted) return;

    const tick = () => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return next;
      });
    };

    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [isLoading, submitted, handleSubmit]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const formatTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const allAnswered = answers.every(a => a !== null);
  const progress = questions.length ? ((index + 1) / questions.length) * 100 : 0;
  const q = questions[index];

  const canSwitchLanguage = index === 0 && answers.every(a => a === null);

  const optionStyle = (i) =>
    answers[index] === i
      ? 'border-2 border-indigo-600 bg-indigo-100'
      : 'border border-gray-300 hover:bg-indigo-50';

  if (isLoading) return <div className="p-10 text-center text-xl">Loading...</div>;
  if (!questions.length) return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-yellow-400 p-6">
      <audio ref={audioRef} loop preload="auto">
        <source src="/case-study-bgm.mp3" type="audio/mpeg" />
      </audio>

      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <select
              value={language}
              onChange={e => {
                if (canSwitchLanguage) setLanguage(e.target.value);
              }}
              className={`p-2 rounded border border-gray-300 ${
                !canSwitchLanguage ? 'bg-gray-100 cursor-not-allowed opacity-70' : 'bg-white'
              }`}
              disabled={!canSwitchLanguage}
            >
              <option value="English">
                English
              </option>
              <option value="Sinhala">
                Sinhala
              </option>
            </select>
            {!canSwitchLanguage && (
              <span className="text-sm text-gray-500">
                (Language cannot be changed after starting)
              </span>
            )}
          </div>

          <div className={`text-md font-medium px-4 py-1 rounded ${timeLeft < 60 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
            ⏱ Time: {formatTime(timeLeft)}
          </div>
        </div>

        <div className="h-3 w-full bg-gray-200 rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

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
                    if (!submitted) {
                      const updated = [...answers];
                      updated[index] = i;
                      setAnswers(updated);
                    }
                  }}
                  className={`p-4 rounded-lg cursor-pointer transition ${optionStyle(i)}`}
                >
                  {opt}
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center mt-8">
          <button
            onClick={() => setIndex(prev => Math.max(0, prev - 1))}
            disabled={index === 0 || submitted}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          {index === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitted}
              className="px-5 py-2 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Submitting...' : 'Submit Answers'}
            </button>
          ) : (
            <button
              onClick={() => setIndex(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={submitted}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          )}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
          >
            {error}
          </motion.div>
        )}

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