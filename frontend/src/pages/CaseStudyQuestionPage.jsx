import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CaseStudyQuestionPage = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [language, setLanguage] = useState('English');
  const [timeLeft, setTimeLeft] = useState(20 * 60);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/case/questions?language=${language}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setQuestions(res.data);
        setAnswers(Array(res.data.length).fill(''));
      } catch (err) {
        if (err.response?.status === 403) navigate('/thank-you');
        console.error(err);
      }
    };
    fetch();
  }, [language, navigate]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleAnswerChange = (val) => {
    const updated = [...answers];
    updated[currentQuestionIndex] = val;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    try {
      await axios.post('http://localhost:5000/api/case/submit', {
        answers,
        timeTaken: 20 * 60 - timeLeft,
        language
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setSubmissionSuccess(true);
      setTimeout(() => {
        navigate('/thank-you');
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = s => {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (questions.length === 0) return <div className="p-6">Loading questions...</div>;

  const q = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen p-6 bg-white text-gray-900">
      <div className="flex justify-between mb-6">
        <div>
          <label className="mr-2 font-semibold">Language:</label>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option>English</option>
            <option>Sinhala</option>
          </select>
        </div>
        <div className="font-bold text-xl">⏳ {formatTime(timeLeft)}</div>
      </div>

      <div className="border p-6 rounded shadow max-w-2xl mx-auto">
        <h3 className="font-semibold text-lg mb-4">
          Q{currentQuestionIndex + 1}: {q.question}
        </h3>
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <label key={i} className="flex items-center">
              <input
                type="radio"
                name={`question-${currentQuestionIndex}`}
                value={opt}
                checked={answers[currentQuestionIndex] === opt}
                onChange={() => handleAnswerChange(opt)}
                className="mr-2 accent-blue-600"
              />
              {opt}
            </label>
          ))}
        </div>

        <div className="flex justify-between mt-6">
          <button
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(i => i - 1)}
            className="bg-gray-300 px-4 py-2 rounded disabled:opacity-50"
          >
            Previous
          </button>
          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Submit Answers
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestionIndex(i => i + 1)}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Next
            </button>
          )}
        </div>
        {submissionSuccess && (
          <div className="mt-4 text-green-600 font-semibold text-center">
            ✅ Answers submitted successfully! Redirecting to Thank You page...
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseStudyQuestionPage;
