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
  const [isLoading, setIsLoading] = useState(true);

  const endAtRef = useRef(null);
  const sentRef = useRef(false);
  const tickRef = useRef(null);
  const audioRef = useRef(null);

  // Storage key with user token (or anonymous)
  const getQuizKey = () => {
    const token = localStorage.getItem('token');
    return `quiz_state_${lang}_${token ? token.slice(-10) : 'anonymous'}`;
  };

  // Save quiz state to localStorage
  const saveToStorage = (data) => {
    try {
      localStorage.setItem(getQuizKey(), JSON.stringify(data));
      // console.log('Quiz state saved:', data);
    } catch (error) {
      console.error('Failed to save quiz state:', error);
    }
  };

  // Load quiz state from localStorage
  const loadFromStorage = () => {
    try {
      const data = localStorage.getItem(getQuizKey());
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load quiz state:', error);
      return null;
    }
  };

  // Clear saved quiz state from localStorage
  const clearStorage = () => {
    try {
      localStorage.removeItem(getQuizKey());
    } catch (error) {
      console.error('Failed to clear quiz state:', error);
    }
  };

  // Load questions and restore state or start new quiz
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setIsLoading(true);

        const savedState = loadFromStorage();

        const { data } = await axios.get(
          `https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/quiz/questions?language=${lang}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );

        if (!mounted) return;

        setQuestions(data);

        // Restore saved quiz if valid and not submitted
        if (
          savedState &&
          savedState.quizEndTime &&
          savedState.answers &&
          savedState.answers.length === data.length &&
          !savedState.submitted
        ) {
          const now = Date.now();
          const remainingMs = savedState.quizEndTime - now;
          const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

          if (remainingSeconds > 0) {
            // Restore ongoing quiz
            setAnswers(savedState.answers);
            setIdx(savedState.currentQuestionIndex || 0);
            setSeconds(remainingSeconds);
            endAtRef.current = savedState.quizEndTime;
          } else {
            // Time expired, auto-submit
            setAnswers(savedState.answers);
            doSubmit(true, savedState.answers);
            return;
          }
        } else {
          // Start new quiz
          const newAnswers = Array(data.length).fill(null);
          const quizDuration = 15 * 60 * 1000; // 15 min
          const quizEndTime = Date.now() + quizDuration;

          setAnswers(newAnswers);
          setIdx(0);
          setSeconds(15 * 60);
          endAtRef.current = quizEndTime;

          saveToStorage({
            answers: newAnswers,
            currentQuestionIndex: 0,
            quizEndTime: quizEndTime,
            quizStartTime: Date.now(),
            submitted: false,
          });
        }

        setIsLoading(false);
      } catch (error) {
        if (!mounted) return;
        if (error.response?.status === 403) setAttempted(true);
        else if (error.response?.status === 401) nav('/login');
        else setErr('Failed to load quiz');
        setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [lang, nav]);

  // Save quiz state whenever answers, idx, or seconds change (except after submission)
  useEffect(() => {
    if (!isLoading && questions.length > 0 && endAtRef.current && !submitted && !attempted) {
      const stateToSave = {
        answers,
        currentQuestionIndex: idx,
        quizEndTime: endAtRef.current,
        quizStartTime: endAtRef.current - 15 * 60 * 1000,
        lastSaved: Date.now(),
        submitted,
      };
      saveToStorage(stateToSave);
    }
  }, [answers, idx, seconds, isLoading, questions.length, submitted, attempted]);

  // Audio control
  useEffect(() => {
    if (!audioRef.current || isLoading) return;
    if (submitted || attempted) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  }, [submitted, attempted, isLoading]);

  // Timer countdown effect
  useEffect(() => {
    if (!endAtRef.current || questions.length === 0 || submitted || attempted || isLoading) return;

    const tick = () => {
      const remainingMs = endAtRef.current - Date.now();
      const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
      setSeconds(remainingSeconds);

      if (remainingSeconds <= 0 && !sentRef.current) {
        clearInterval(tickRef.current);
        doSubmit(true);
      }
    };

    tick(); // immediate call
    tickRef.current = setInterval(tick, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [questions.length, submitted, attempted, isLoading]);

  // Handle answer selection
  const pick = (selectedIndex) => {
    setAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[idx] = selectedIndex;
      return newAnswers;
    });
  };

  // Submit quiz handler
  const doSubmit = async (isAutoSubmit = false, answersToSubmit = null) => {
    if (sentRef.current) return;

    sentRef.current = true;
    setSubmitted(true);

    const finalAnswers = answersToSubmit || answers;
    const timeTaken = 15 * 60 - seconds;

    clearStorage();

    try {
      await axios.post(
        'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/quiz/submit',
        {
          answers: finalAnswers,
          timeTaken,
          language: lang,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      // success
    } catch (error) {
      if (!isAutoSubmit) {
        setErr(error.response?.data?.message || 'Submit failed');
        sentRef.current = false;
        setSubmitted(false);
        return;
      }
    }

    if (audioRef.current) audioRef.current.pause();

    setTimeout(() => nav('/case-video'), 1200);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#1a1a1a]">
        <div className="max-w-md bg-white bg-opacity-95 shadow-xl p-6 text-center rounded-xl">
          <h2 className="text-2xl font-extrabold mb-4 text-gray-700">Loading Quiz...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (attempted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#1a1a1a]">
        <div className="max-w-md bg-white bg-opacity-95 shadow-xl p-6 text-center rounded-xl">
          <h2 className="text-2xl font-extrabold mb-4 text-red-700">
            You've already taken this quiz
          </h2>
          <button onClick={() => nav('/')} className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium">
            Home
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[idx];
  const currentAnswered = answers[idx] !== null;
  const allAnswered = answers.every((a) => a !== null);
  const answeredCount = answers.filter((a) => a !== null).length;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-cover bg-center"
      style={{ backgroundImage: `url(${RedBackground})` }}
    >
      <audio ref={audioRef} src={quizBg} loop />

      <div className="w-full max-w-3xl bg-[#000000b3] shadow-2xl rounded-2xl p-8 text-white relative">
        <span className="absolute top-4 right-4 bg-black/90 text-white text-sm px-4 py-1 rounded-lg">⏳ {fmt(seconds)}</span>

        <h1 className="text-4xl font-extrabold text-center mb-8 bg-gradient-to-r from-yellow-400 to-red-600 bg-clip-text text-transparent">
          Quiz – {lang}
        </h1>

        {err && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 mb-4 text-center">
            <p className="text-red-300">{err}</p>
          </div>
        )}

        {/* Progress */}
        <div className="bg-gray-800 rounded-lg p-3 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-300">Progress</span>
            <span className="text-sm text-gray-300">
              {answeredCount}/{questions.length} answered
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-yellow-400 to-red-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={idx}
              initial={{ x: 90, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -90, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="bg-[#1e1e1e] border-2 border-yellow-600 p-6 rounded-xl"
            >
              <p className="font-semibold mb-4 text-yellow-400">
                Question {idx + 1} of {questions.length}
              </p>

              <p className="text-lg font-bold mb-6 text-white">{currentQuestion.question}</p>

              {currentQuestion.options.map((option, optionIndex) => (
                <button
                  key={optionIndex}
                  onClick={() => pick(optionIndex)}
                  disabled={submitted}
                  className={`block w-full text-left px-4 py-3 mb-3 rounded-lg border-2 transition-all duration-200
                    ${
                      answers[idx] === optionIndex
                        ? 'bg-green-700 border-green-500 font-bold text-white shadow-lg'
                        : 'bg-[#333] hover:bg-[#444] border-gray-600 text-white hover:border-gray-500'
                    }
                    ${submitted ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                  `}
                >
                  {option}
                </button>
              ))}

              <div className="flex justify-between items-center mt-8">
                <button
                  onClick={() => setIdx(Math.max(idx - 1, 0))}
                  disabled={idx === 0 || submitted}
                  className="px-5 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  ‹ Previous
                </button>

                {idx < questions.length - 1 ? (
                  <button
                    onClick={() => setIdx(idx + 1)}
                    disabled={submitted}
                    className="px-5 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Next ›
                  </button>
                ) : (
                  <button
                    onClick={() => doSubmit(false)}
                    disabled={!allAnswered || submitted}
                    className="px-5 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Submit Quiz
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
            transition={{ duration: 0.3 }}
            className="text-center mt-8 bg-green-900/30 border border-green-500 rounded-lg p-6"
          >
            <p className="text-green-400 font-semibold mb-4 text-xl">✅ Quiz Submitted Successfully!</p>
            <p className="text-sm text-gray-300">Redirecting to Case-study video...</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
