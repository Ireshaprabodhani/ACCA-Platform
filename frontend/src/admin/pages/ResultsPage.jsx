import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  Download,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  X,
  Trash2
} from 'lucide-react';

const API_BASE = 'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin';

const authHeader = () => {
  const jwt = localStorage.getItem('adminToken') || localStorage.getItem('token');
  if (!jwt) throw new Error('No token - please log in');
  return { Authorization: `Bearer ${jwt}` };
};

const fetchJSON = async (url) => {
  const res = await fetch(url, { headers: authHeader() });
  if (res.status === 401) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('token');
    throw new Error('Unauthorized – please log in again');
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};

const deleteRecord = async (url) => {
  const res = await fetch(url, { method: 'DELETE', headers: authHeader() });
  if (res.status === 401) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('token');
    throw new Error('Unauthorized – please log in again');
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};

export default function ResultsPage() {
  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' | 'case'
  const [results, setResults] = useState([]); // [ [schoolName, attempts[]], ... ]
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedAttempts, setExpandedAttempts] = useState({});
  const [currentSchoolPage, setCurrentSchoolPage] = useState(1);
  const [currentAttemptPage, setCurrentAttemptPage] = useState(1); // shared pager per-school (kept as in your original)
  const [searchQuery, setSearchQuery] = useState('');

  const SCHOOLS_PER_PAGE = 3;
  const ATTEMPTS_PER_PAGE = 5;

  const loadResults = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await fetchJSON(`${API_BASE}/${activeTab}-status`);

      // newest first
      data.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

      // group by school
      const grouped = {};
      data.forEach((a) => {
        const key = a.schoolName || 'Other Schools';
        (grouped[key] = grouped[key] || []).push(a);
      });

      setResults(Object.entries(grouped)); // [ [schoolName, attempts[]] ]
      setCurrentSchoolPage(1);
      setCurrentAttemptPage(1);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return results;
    return results.filter(([schoolName]) =>
      schoolName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [results, searchQuery]);

  useEffect(() => {
    setCurrentSchoolPage(1);
    setCurrentAttemptPage(1);
  }, [searchQuery]);

  const exportToExcel = () => {
    const records = filteredResults.flatMap(([school, attempts]) =>
      attempts.map((at) => ({
        School: school,
        User: at.userName ?? 'Deleted User',
        Email: at.email ?? 'N/A',
        Score: at.score,
        'Submitted At': new Date(at.submittedAt).toLocaleString(),
        Type: activeTab,
      }))
    );
    if (!records.length) return;
    const ws = XLSX.utils.json_to_sheet(records);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${activeTab}-results`);
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(
      new Blob([buffer], { type: 'application/octet-stream' }),
      `${activeTab}-results-${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  const toggleAttemptDetails = (attemptId) => {
    setExpandedAttempts((prev) => ({ ...prev, [attemptId]: !prev[attemptId] }));
  };

  const clearSearch = () => setSearchQuery('');

  // pagination for schools
  const totalSchoolPages = Math.ceil(filteredResults.length / SCHOOLS_PER_PAGE);
  const paginatedSchools = filteredResults.slice(
    (currentSchoolPage - 1) * SCHOOLS_PER_PAGE,
    currentSchoolPage * SCHOOLS_PER_PAGE
  );

  // delete single attempt (record)
  const handleDeleteAttempt = async (attemptId, schoolName) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;

    try {
      const attemptsPath = activeTab === 'quiz' ? 'quiz-attempts' : 'case-attempts';
      await deleteRecord(`${API_BASE}/${attemptsPath}/${attemptId}`);

      // remove from UI
      setResults((prev) => {
        const next = prev
          .map(([school, atts]) => {
            if (school !== schoolName) return [school, atts];
            const filtered = atts.filter((a) => a.id !== attemptId);
            return [school, filtered];
          })
          .filter(([, atts]) => atts.length > 0); // drop empty schools

        // if current school page goes out of range after deletion, pull it back
        const newTotalPages = Math.max(1, Math.ceil(next.length / SCHOOLS_PER_PAGE));
        if (currentSchoolPage > newTotalPages) {
          setCurrentSchoolPage(newTotalPages);
        }

        // if current attempt page goes out of range for visible schools, pull it back
        const currentCard = next.find(([school]) => school === schoolName);
        if (currentCard) {
          const totalAttempts = currentCard[1].length;
          const maxAttemptPages = Math.max(1, Math.ceil(totalAttempts / ATTEMPTS_PER_PAGE));
          if (currentAttemptPage > maxAttemptPages) {
            setCurrentAttemptPage(maxAttemptPages);
          }
        }

        // collapse details for the removed attempt
        setExpandedAttempts((prevExp) => {
          const clone = { ...prevExp };
          delete clone[attemptId];
          return clone;
        });

        return next;
      });
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-purple-900 mb-2">Results Dashboard</h1>
        <p className="text-purple-600">View and analyze student performance</p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex bg-purple-100 rounded-lg p-1">
          {['quiz', 'case'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-purple-600 hover:bg-purple-50'
              }`}
            >
              {tab === 'quiz' ? 'Quiz Results' : 'Case Study Results'}
            </button>
          ))}
        </div>

        <button
          onClick={exportToExcel}
          disabled={isLoading || filteredResults.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={18} />
          Export to Excel
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-purple-400" />
          </div>
          <input
            type="text"
            placeholder="Search schools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-10 py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-purple-900 placeholder-purple-400"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-5 w-5 text-purple-400 hover:text-purple-600" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-purple-600">
            {filteredResults.length === 0
              ? `No schools found matching "${searchQuery}"`
              : `Found ${filteredResults.length} school${
                  filteredResults.length !== 1 ? 's' : ''
                } matching "${searchQuery}"`}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-12 w-12 text-purple-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">Error loading results:</p>
          <p>{error}</p>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="bg-white rounded-xl border border-purple-100 p-8 text-center">
          <p className="text-purple-600">
            {searchQuery
              ? `No schools found matching "${searchQuery}"`
              : `No results found for ${activeTab === 'quiz' ? 'quiz' : 'case study'}.`}
          </p>
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="mt-3 text-purple-700 hover:text-purple-900 font-medium"
            >
              Clear search to see all results
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {paginatedSchools.map(([school, attempts]) => {
              const totalAttempts = attempts.length;
              const totalPages = Math.ceil(totalAttempts / ATTEMPTS_PER_PAGE);
              const paginatedAttempts = attempts.slice(
                (currentAttemptPage - 1) * ATTEMPTS_PER_PAGE,
                currentAttemptPage * ATTEMPTS_PER_PAGE
              );

              return (
                <motion.div
                  key={school}
                  className="bg-white rounded-xl shadow-sm border border-purple-100 overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-purple-600 text-white px-6 py-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold">{school}</h2>
                      <span className="bg-white text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                        {totalAttempts} attempt{totalAttempts !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-purple-100">
                    {paginatedAttempts.map((attempt) => {
                      const isExpanded = !!expandedAttempts[attempt.id];

                      // compute correct answers count (supports quiz & case payloads)
                      const correctAnswers =
                        attempt.questions?.filter((q, idx) => {
                          const correctAnswer =
                            q?.correctAnswer !== undefined ? q.correctAnswer : q?.answer;
                          return correctAnswer === attempt.answers?.[idx];
                        }).length || 0;

                      return (
                        <div key={attempt.id} className="p-4 hover:bg-purple-50 transition">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-purple-900">
                                {attempt.userName || 'Anonymous User'}
                              </h3>
                              <p className="text-sm text-purple-600">
                                {attempt.email || 'No email'}
                              </p>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-lg font-bold text-purple-700">
                                  Score: {attempt.score}
                                </div>
                                <div className="text-sm text-purple-500">
                                  {correctAnswers}/{attempt.questions?.length || 0} correct
                                </div>
                              </div>

                              {/* Delete single record */}
                              <button
                                onClick={() => handleDeleteAttempt(attempt.id, school)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete this record"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 flex justify-between items-center">
                            <button
                              onClick={() => toggleAttemptDetails(attempt.id)}
                              className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center gap-1"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp size={16} /> Hide details
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={16} /> View details
                                </>
                              )}
                            </button>
                            <span className="text-xs text-purple-500">
                              {new Date(attempt.submittedAt).toLocaleString()}
                            </span>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-4"
                              >
                                <div className="space-y-3">
                                  {attempt.questions?.map((question, idx) => {
                                    const selectedAnswer = attempt.answers?.[idx];
                                    const correctAnswer =
                                      question?.correctAnswer !== undefined
                                        ? question.correctAnswer
                                        : question?.answer;

                                    return (
                                      <div key={idx} className="p-3 bg-purple-50 rounded-lg mb-3">
                                        <div className="font-medium text-purple-900 mb-2">
                                          Q{idx + 1}: {question?.question || 'Question not available'}
                                        </div>
                                        <ul className="space-y-2">
                                          {question?.options?.map((option, optIdx) => {
                                            let optionClass = 'p-2 rounded-md border';
                                            if (optIdx === correctAnswer) {
                                              optionClass +=
                                                ' bg-green-100 border-green-300 text-green-800 font-medium';
                                            }
                                            if (optIdx === selectedAnswer && optIdx !== correctAnswer) {
                                              optionClass =
                                                'p-2 rounded-md border bg-red-100 border-red-300 text-red-800 font-medium';
                                            }
                                            if (optIdx === selectedAnswer && optIdx === correctAnswer) {
                                              optionClass =
                                                'p-2 rounded-md border bg-green-200 border-green-400 text-green-900 font-bold';
                                            }
                                            if (optIdx !== correctAnswer && optIdx !== selectedAnswer) {
                                              optionClass += ' bg-gray-50 border-gray-200 text-gray-700';
                                            }

                                            return (
                                              <li key={optIdx} className={optionClass}>
                                                {String.fromCharCode(65 + optIdx)}. {option}
                                                {optIdx === correctAnswer && optIdx !== selectedAnswer && (
                                                  <span className="ml-2 text-green-600 font-bold">
                                                    ✓ Correct
                                                  </span>
                                                )}
                                                {optIdx === selectedAnswer && optIdx !== correctAnswer && (
                                                  <span className="ml-2 text-red-600 font-bold">
                                                    ✗ Your answer
                                                  </span>
                                                )}
                                                {optIdx === selectedAnswer && optIdx === correctAnswer && (
                                                  <span className="ml-2 text-green-700 font-bold">
                                                    ✓ Correct answer
                                                  </span>
                                                )}
                                              </li>
                                            );
                                          })}
                                        </ul>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>

                  {/* Attempts pagination (shared pager, same as your original) */}
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center p-4 border-t border-purple-100">
                      <button
                        onClick={() => setCurrentAttemptPage((p) => Math.max(1, p - 1))}
                        disabled={currentAttemptPage === 1}
                        className="flex items-center gap-1 px-3 py-1 text-purple-700 hover:bg-purple-100 rounded disabled:opacity-50"
                      >
                        <ChevronLeft size={16} /> Previous
                      </button>
                      <span className="text-sm text-purple-600">
                        Page {currentAttemptPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentAttemptPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentAttemptPage === totalPages}
                        className="flex items-center gap-1 px-3 py-1 text-purple-700 hover:bg-purple-100 rounded disabled:opacity-50"
                      >
                        Next <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Schools pagination */}
          {totalSchoolPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => setCurrentSchoolPage((p) => Math.max(1, p - 1))}
                disabled={currentSchoolPage === 1}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 disabled:opacity-50"
              >
                <ChevronLeft size={18} /> Previous Schools
              </button>
              <span className="text-purple-600">
                Showing schools {(currentSchoolPage - 1) * SCHOOLS_PER_PAGE + 1}-
                {Math.min(currentSchoolPage * SCHOOLS_PER_PAGE, filteredResults.length)} of{' '}
                {filteredResults.length}
                {searchQuery && ` (filtered from ${results.length} total)`}
              </span>
              <button
                onClick={() => setCurrentSchoolPage((p) => Math.min(totalSchoolPages, p + 1))}
                disabled={currentSchoolPage === totalSchoolPages}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 disabled:opacity-50"
              >
                Next Schools <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
