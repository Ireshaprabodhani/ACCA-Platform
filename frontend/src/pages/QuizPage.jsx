import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

const QuizPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
  const [hasAttempted, setHasAttempted] = useState(false); // NEW: track if user already attempted

  const language = new URLSearchParams(location.search).get('language') || 'English';

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('You must be logged in.');
          navigate('/login');
          return;
        }

        const res = await axios.get(
          `http://localhost:5000/api/quiz/questions?language=${language}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setQuestions(res.data);
      } catch (err) {
        console.error('Failed to load quiz:', err);
        if (err.response?.status === 403) {
          // User already attempted
          setHasAttempted(true);
        } else if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Failed to load quiz. Try again.');
        }
      }
    };

    fetchQuestions();
  }, [language, navigate]);

  // Timer logic: only runs if quiz not submitted and user has not already attempted
  useEffect(() => {
    if (submitted || timeLeft <= 0 || hasAttempted) {
      if (!submitted && !hasAttempted && timeLeft <= 0) handleSubmit(); // Auto-submit on timer end only if allowed
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted, hasAttempted]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (index, option) => {
    if (submitted || hasAttempted) return; // prevent selecting if already attempted
    setAnswers({ ...answers, [index]: option });
  };

  const handleSubmit = () => {
    setSubmitted(true);
    console.log('User answers:', answers);
    // TODO: send answers to backend, save attempt
  };

  const handleContinue = () => {
    navigate('/case-video');
  };

  const currentQ = questions[currentQuestion];

  // If user already attempted, show message and block quiz UI
  if (hasAttempted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-pink-100 to-blue-100">
        <div className="max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">You have already attempted this quiz.</h2>
          <p className="text-gray-700 mb-4">
            You cannot attempt the quiz more than once. Please contact support if you believe this is a mistake.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-blue-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white shadow-lg rounded-lg p-6 relative">
        <div className="absolute top-4 right-4 text-sm font-bold bg-black text-white px-3 py-1 rounded">
          ⏳ {formatTime(timeLeft)}
        </div>

        <h1 className="text-3xl font-extrabold text-center mb-4 text-purple-700">
          Quiz - {language}
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded text-center mb-4">
            {error}
          </div>
        )}

        {questions.length > 0 && currentQ ? (
          <div className="space-y-4">
            <div className="text-xl font-semibold text-indigo-800">
              Question {currentQuestion + 1} of {questions.length}
            </div>

            <div className="bg-yellow-100 p-5 rounded-lg shadow-inner border-2 border-yellow-400">
              <p className="text-lg font-bold">{currentQ.question}</p>
              <div className="mt-4 grid gap-3">
                {currentQ.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleOptionSelect(currentQuestion, opt)}
                    disabled={submitted}
                    className={`px-4 py-2 rounded-lg text-left transition-all border-2 ${
                      answers[currentQuestion] === opt
                        ? 'bg-green-300 border-green-600 text-black font-bold'
                        : 'bg-white hover:bg-blue-100 border-gray-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentQuestion((prev) => Math.max(prev - 1, 0))}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                disabled={currentQuestion === 0 || submitted}
              >
                ⬅ Previous
              </button>

              {currentQuestion < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestion((prev) => prev + 1)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  disabled={submitted}
                >
                  Next ➡
                </button>
              ) : (
                !submitted && (
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Submit Quiz
                  </button>
                )
              )}
            </div>

            {submitted && (
              <div className="text-center mt-6 space-y-4">
                <div className="text-green-700 font-semibold">
                  ✅ Quiz submitted successfully!
                </div>
                <button
                  onClick={handleContinue}
                  className="px-6 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700"
                >
                  🚀 Continue to Case Study Video
                </button>
              </div>
            )}
          </div>
        ) : !error ? (
          <p className="text-center text-gray-600">Loading questions...</p>
        ) : null}
      </div>
    </div>
  );
};

export default QuizPage;
