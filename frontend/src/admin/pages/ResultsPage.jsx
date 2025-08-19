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

const fetchJSON = async (url) => {
  const jwt = localStorage.getItem('adminToken') || localStorage.getItem('token');
  if (!jwt) throw new Error('No token - please log in');

  const res = await fetch(url, { headers: { Authorization: `Bearer ${jwt}` } });

  if (res.status === 401) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('token');
    throw new Error('Unauthorized – please log in again');
  }

  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};

export default function ResultsPage() {
  const [activeTab, setActiveTab] = useState('quiz');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedAttempts, setExpandedAttempts] = useState({});
  const [currentSchoolPage, setCurrentSchoolPage] = useState(1);
  const [currentAttemptPage, setCurrentAttemptPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const SCHOOLS_PER_PAGE = 3;
  const ATTEMPTS_PER_PAGE = 5;

  const loadResults = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await fetchJSON(
        `https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/${activeTab}-status`
      );

      data.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

      const grouped = {};
      data.forEach((a) => {
        const key = a.schoolName || 'Other Schools';
        (grouped[key] = grouped[key] || []).push(a);
      });

      setResults(Object.entries(grouped));
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
  }, [activeTab]);

  // Delete attempt function
  const deleteAttempt = async (attemptId, schoolName) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      const jwt = localStorage.getItem('adminToken') || localStorage.getItem('token');
      if (!jwt) throw new Error('No token - please log in');

      const res = await fetch(
        `https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/${activeTab}-status/${attemptId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${jwt}` }
        }
      );

      if (!res.ok) throw new Error('Failed to delete record');

      // Update UI locally after deletion
      setResults(prev =>
        prev.map(([school, attempts]) => {
          if (school !== schoolName) return [school, attempts];
          return [school, attempts.filter(a => a.id !== attemptId)];
        }).filter(([_, attempts]) => attempts.length > 0) // remove empty schools
      );
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter results based on search query
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return results;
    return results.filter(([schoolName]) =>
      schoolName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [results, searchQuery]);

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentSchoolPage(1);
    setCurrentAttemptPage(1);
  }, [searchQuery]);

  const exportToExcel = () => {
    const records = filteredResults.flatMap(([school, attempts]) =>
      attempts.map(at => ({
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
    setExpandedAttempts(prev => ({
      ...prev,
      [attemptId]: !prev[attemptId]
    }));
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const paginatedSchools = filteredResults.slice(
    (currentSchoolPage - 1) * SCHOOLS_PER_PAGE,
    currentSchoolPage * SCHOOLS_PER_PAGE
  );

  const totalSchoolPages = Math.ceil(filteredResults.length / SCHOOLS_PER_PAGE);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-purple-900 mb-2">Results Dashboard</h1>
        <p className="text-purple-600">View and analyze student performance</p>
      </div>

      {/* Tabs + Export */}
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

      {/* Search */}
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
      </div>

      {/* Results */}
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
          <p className="text-purple-600">No results found.</p>
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
                  {/* School Header */}
                  <div className="bg-purple-600 text-white px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">{school}</h2>
                    <span className="bg-white text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                      {totalAttempts} attempt{totalAttempts !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Attempts */}
                  <div className="divide-y divide-purple-100">
                    {paginatedAttempts.map((attempt) => {
                      const isExpanded = expandedAttempts[attempt.id];
                      return (
                        <div key={attempt.id} className="p-4 hover:bg-purple-50 transition">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-purple-900">
                                {attempt.userName || 'Anonymous User'}
                              </h3>
                              <p className="text-sm text-purple-600">{attempt.email || 'No email'}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-lg font-bold text-purple-700">
                                  Score: {attempt.score}
                                </div>
                              </div>
                              <button
                                onClick={() => deleteAttempt(attempt.id, school)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete attempt"
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

                          {/* Expanded details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-4"
                              >
                                {/* Question list */}
                                <div className="space-y-3">
                                  {attempt.questions?.map((q, idx) => (
                                    <div key={idx} className="p-3 bg-purple-50 rounded-lg">
                                      <div className="font-medium text-purple-900 mb-2">
                                        Q{idx + 1}: {q.question}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination for attempts */}
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center p-4 border-t border-purple-100">
                      <button
                        onClick={() => setCurrentAttemptPage(p => Math.max(1, p - 1))}
                        disabled={currentAttemptPage === 1}
                        className="flex items-center gap-1 px-3 py-1 text-purple-700 hover:bg-purple-100 rounded disabled:opacity-50"
                      >
                        <ChevronLeft size={16} /> Previous
                      </button>
                      <span className="text-sm text-purple-600">
                        Page {currentAttemptPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentAttemptPage(p => Math.min(totalPages, p + 1))}
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
        </>
      )}
    </div>
  );
}
