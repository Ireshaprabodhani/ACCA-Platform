import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import RedBackground from '../assets/background.jpg';

export default function CaseStudyQuestionPage() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20 * 60);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);

  const navigate = useNavigate();
  const timerRef = useRef(null);
  const submittedRef = useRef(false);
  const audioRef = useRef(null);
  const answersRef = useRef([]);
  const timeLeftRef = useRef(timeLeft);
  const language = 'English'; // Hardcoded
  const languageRef = useRef('English');

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  // Generate or retrieve session ID for this attempt
  const getSessionId = useCallback(() => {
    let sid = sessionStorage.getItem('case_study_session_id');
    if (!sid) {
      sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('case_study_session_id', sid);
    }
    return sid;
  }, []);

  // Save progress to sessionStorage
  const saveProgress = useCallback((currentAnswers, currentIndex, currentTimeLeft) => {
    if (!sessionId) return;
    
    const progressData = {
      answers: currentAnswers,
      index: currentIndex,
      timeLeft: currentTimeLeft,
      timestamp: Date.now(),
      language: languageRef.current
    };
    
    sessionStorage.setItem(`case_study_progress_${sessionId}`, JSON.stringify(progressData));
  }, [sessionId]);

  // Load progress from sessionStorage
  const loadProgress = useCallback(() => {
    if (!sessionId) return null;
    
    const savedData = sessionStorage.getItem(`case_study_progress_${sessionId}`);
    if (!savedData) return null;
    
    try {
      return JSON.parse(savedData);
    } catch (err) {
      console.error('Failed to parse saved progress:', err);
      return null;
    }
  }, [sessionId]);

  // Clear progress from sessionStorage
  const clearProgress = useCallback(() => {
    if (!sessionId) return;
    sessionStorage.removeItem(`case_study_progress_${sessionId}`);
    sessionStorage.removeItem('case_study_session_id');
  }, [sessionId]);

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
          answers: answersRef.current,
          timeTaken: 20 * 60 - timeLeftRef.current,
          language: languageRef.current,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      // Clear progress after successful submission
      clearProgress();
      navigate('/thank-you');
    } catch (err) {
      setError(err.response?.data?.message || 'Submit failed');
      setSending(false);
      setSubmitted(false);
      submittedRef.current = false;
    }
  }, [sending, navigate, clearProgress]);

  // Load questions and restore progress
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        
        // Initialize session ID
        const sid = getSessionId();
        setSessionId(sid);
        
        // Load questions
        const { data } = await axios.get(
          `https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/case/questions?language=English`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        
        setQuestions(data);
        
        // Try to load saved progress
        const savedProgress = sessionStorage.getItem(`case_study_progress_${sid}`);
        
        if (savedProgress) {
          try {
            const progressData = JSON.parse(savedProgress);
            const timeSinceLastSave = Date.now() - progressData.timestamp;
            const timeElapsedInSeconds = Math.floor(timeSinceLastSave / 1000);
            
            // Only restore if less than 30 minutes have passed (safety check)
            if (timeSinceLastSave < 30 * 60 * 1000) {
              // Calculate remaining time accounting for time elapsed since last save
              const adjustedTimeLeft = Math.max(0, (progressData.timeLeft || 20 * 60) - timeElapsedInSeconds);
              
              setAnswers(progressData.answers || Array(data.length).fill(null));
              setIndex(progressData.index || 0);
              setTimeLeft(adjustedTimeLeft);
              
              console.log(`Progress restored: ${progressData.timeLeft}s saved, ${timeElapsedInSeconds}s elapsed, ${adjustedTimeLeft}s remaining`);
              
              // If time has run out while away, auto-submit
              if (adjustedTimeLeft <= 0) {
                setTimeout(() => handleSubmit(), 1000);
              }
            } else {
              // Clear old progress if too much time has passed
              sessionStorage.removeItem(`case_study_progress_${sid}`);
              setAnswers(Array(data.length).fill(null));
              setIndex(0);
              setTimeLeft(20 * 60);
            }
          } catch (err) {
            console.error('Failed to restore progress:', err);
            setAnswers(Array(data.length).fill(null));
            setIndex(0);
            setTimeLeft(20 * 60);
          }
        } else {
          // No saved progress, start fresh
          setAnswers(Array(data.length).fill(null));
          setIndex(0);
          setTimeLeft(20 * 60);
        }
        
        audioRef.current?.play().catch(() => {});
      } catch (err) {
        if (err.response?.status === 403) navigate('/thank-you');
        else if (err.response?.status === 401) navigate('/login');
        else setError('Failed to load questions');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [navigate, getSessionId, handleSubmit]);

  // Save progress whenever answers, index, or timeLeft changes
  useEffect(() => {
    if (!isLoading && questions.length > 0 && sessionId) {
      saveProgress(answers, index, timeLeft);
    }
  }, [answers, index, timeLeft, isLoading, questions.length, sessionId, saveProgress]);

  // Timer effect
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

  // Cleanup on unmount
  useEffect(() => () => {
    clearInterval(timerRef.current);
    audioRef.current?.pause();
  }, []);

  // Handle page visibility change to save progress
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !isLoading && questions.length > 0) {
        saveProgress(answers, index, timeLeft);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [saveProgress, answers, index, timeLeft, isLoading, questions.length]);

  // Handle beforeunload to save progress
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isLoading && questions.length > 0) {
        saveProgress(answers, index, timeLeft);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveProgress, answers, index, timeLeft, isLoading, questions.length]);

  const formatTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const allAnswered = answers.every(a => a !== null);
  const currentAnswered = answers[index] !== null;
  const progress = questions.length ? ((index + 1) / questions.length) * 100 : 0;
  const q = questions[index];

  const optionStyle = i =>
    answers[index] === i
      ? 'border-2 border-yellow-500 bg-yellow-100 text-black'
      : 'border border-gray-300 bg-white/80 hover:bg-yellow-50 text-black';

  if (isLoading)
    return <div className="min-h-screen flex items-center justify-center text-xl text-white" style={{
      backgroundImage: `url(${RedBackground})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>Loading...</div>;

  if (!questions.length)
    return <div className="min-h-screen flex items-center justify-center text-xl text-red-300" style={{
      backgroundImage: `url(${RedBackground})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>{error || 'No questions'}</div>;

  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      backgroundImage: `url(${RedBackground})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      <audio ref={audioRef} loop preload="auto">
        <source src="/case-study-bgm.mp3" type="audio/mpeg" />
      </audio>

      <div className="w-full max-w-4xl mx-auto p-8 shadow-xl rounded-none bg-[#000000b3] text-white">
        {/* top bar with progress indicator */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-300">
            Question {index + 1} of {questions.length}
          </div>
          <div className={`text-md font-semibold px-4 py-1 rounded ${timeLeft < 60 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
            ⏱ Time: {formatTime(timeLeft)}
          </div>
        </div>

        {/* progress bar */}
        <div className="h-3 w-full bg-gray-300 rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-yellow-500"
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
        <div className="flex justify-between items-center mt-8 gap-4">
          <button
            onClick={() => setIndex(prev => Math.max(0, prev - 1))}
            disabled={index === 0 || submitted}
            className="px-5 py-2 rounded font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: index === 0 || submitted ? '#666' : 'linear-gradient(45deg, #555, #888 50%, #333)',
            }}
          >
            ← Previous
          </button>

          {index === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitted}
              className="px-6 py-2 rounded font-semibold text-white transition disabled:opacity-50"
              style={{
                background: !allAnswered || submitted ? '#666' : 'linear-gradient(45deg, #9a0000, #ff0034 50%, maroon)',
              }}
            >
              {sending ? 'Submitting…' : 'Submit Answers'}
            </button>
          ) : (
            <button
              onClick={() => setIndex(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={submitted}
              className="px-5 py-2 rounded font-semibold text-white transition disabled:opacity-50"
              style={{
                background: submitted ? '#666' : 'linear-gradient(45deg, #9a0000, #ff0034 50%, maroon)',
              }}
            >
              Next →
            </button>
          )}
        </div>

        {/* Answered questions indicator */}
        <div className="mt-4 text-sm text-gray-300 text-center">
          Answered: {answers.filter(a => a !== null).length} / {questions.length}
        </div>

        {/* modal */}
        {submitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50"
          >
            <div className="bg-white p-6 rounded-xl shadow-xl text-center max-w-sm w-full">
              <h2 className="text-xl font-bold text-green-700 mb-2">✅ Submission Complete</h2>
              <p className="text-gray-600">Thank you! Your answers have been recorded.</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}