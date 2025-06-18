// pages/ResultsPage.jsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/* ─────────── Helper to fetch JSON with JWT ─────────── */
const fetchJSON = async (url) => {
  const jwt =
    localStorage.getItem('adminToken') || localStorage.getItem('token');

  if (!jwt) throw new Error('No token ‑ please log in');

  const res = await fetch(url, { headers: { Authorization: `Bearer ${jwt}` } });

  if (res.status === 401) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('token');
    throw new Error('Unauthorized – please log in again');
  }

  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};

/* ─────────── Animation variants ─────────── */
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export default function ResultsPage() {
  const [tab, setTab] = useState('quiz');         // 'quiz' | 'case'
  const [rows, setRows] = useState([]);           // [school, attempts[]][]
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [expandedRows, setExpandedRows] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const ATTEMPTS_PER_PAGE = 5;

  /* ─────────── Load attempts whenever tab changes ─────────── */
  useEffect(() => {
    (async () => {
      try {
        setBusy(true);
        setErr('');
        const data = await fetchJSON(
          `https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/${tab}-status`
        );

        // Group by school
        const grouped = {};
        data.forEach((a) => {
          const key = a.schoolName || 'N/A';
          (grouped[key] = grouped[key] || []).push(a);
        });
        setRows(Object.entries(grouped)); // [school, attempts]
      } catch (e) {
        setErr(e.message);
      } finally {
        setBusy(false);
      }
    })();
  }, [tab]);

  /* ─────────── Export current tab’s data to Excel ─────────── */
  const exportToExcel = () => {
    // Flatten into simple records
    const records = [];
    rows.forEach(([school, attempts]) => {
      attempts.forEach((at) => {
        records.push({
          School: school,
          User: at.userName ?? 'Deleted User',
          Email: at.email ?? 'N/A',
          Score: at.score,
          'Submitted At': new Date(at.submittedAt).toLocaleString(),
          Type: tab,                           // quiz | case
        });
      });
    });

    if (!records.length) return alert('No data to export');

    const ws = XLSX.utils.json_to_sheet(records);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      tab === 'quiz' ? 'QuizResults' : 'CaseResults'
    );

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(
      new Blob([buffer], { type: 'application/octet-stream' }),
      `${tab}-results.xlsx`
    );
  };

  /* ─────────── Helpers ─────────── */
  const toggleExpand = (key) =>
    setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }));

  const paginate = (items) => {
    const start = (currentPage - 1) * ATTEMPTS_PER_PAGE;
    return items.slice(start, start + ATTEMPTS_PER_PAGE);
  };

  /* ─────────── UI ─────────── */
  return (
    <div
      className="min-h-screen p-8 bg-gray-50 text-gray-900 font-sans"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Tabs */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-6">
        {['quiz', 'case'].map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setExpandedRows({});
              setCurrentPage(1);
            }}
            className={`px-8 py-3 rounded-full font-semibold text-lg shadow-md transition-colors duration-300
              ${
                tab === t
                  ? 'bg-gradient-to-br from-purple-600 via-pink-500 to-yellow-400 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gradient-to-br hover:from-purple-400 hover:via-pink-400 hover:to-yellow-300 hover:text-white'
              }`}
          >
            {t === 'quiz' ? 'Quiz Results' : 'Case‑study Results'}
          </button>
        ))}

        {/* Excel Export Button */}
        <button
          onClick={exportToExcel}
          className="px-8 py-3 rounded-full bg-green-600 text-white font-semibold shadow-md hover:bg-green-700 transition-colors"
        >
          Download Excel
        </button>
      </div>

      {busy && (
        <p className="text-center text-purple-700 font-semibold text-lg animate-pulse">
          Loading…
        </p>
      )}
      {err && (
        <p className="text-center text-red-600 font-semibold text-lg">
          ⚠ {err}
        </p>
      )}
      {!busy && !err && rows.length === 0 && (
        <p className="text-center text-gray-500 text-lg">No attempts yet.</p>
      )}

      {/* Schools & Attempts */}
      {!busy &&
        rows.map(([school, allAttempts]) => {
          const pagedAttempts = paginate(allAttempts);
          const totalPages = Math.ceil(allAttempts.length / ATTEMPTS_PER_PAGE);

          return (
            <motion.div
              key={school}
              className="mb-14 bg-white rounded-2xl shadow-lg max-w-5xl mx-auto ring-1 ring-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Header */}
              <div className="px-8 py-5 border-b border-gray-200 rounded-t-2xl bg-gradient-to-r from-purple-100 via-pink-50 to-yellow-100">
                <h2 className="text-2xl font-extrabold tracking-tight text-purple-700">
                  {school} —{' '}
                  <span className="text-gray-600 font-normal">
                    {allAttempts.length} attempt
                    {allAttempts.length > 1 ? 's' : ''}
                  </span>
                </h2>
              </div>

              {/* Attempts (paged) */}
              {pagedAttempts.map((at, i) => {
                const key = `${school}-${i}`;
                const isExpanded = expandedRows[key];

                return (
                  <motion.div
                    key={at.id || i}
                    className="p-6 border-b border-gray-100 last:border-none cursor-pointer hover:bg-purple-50 transition-colors rounded-b-xl"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={fadeInUp}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-purple-900 leading-tight">
                          {at.userName ?? 'Deleted User'}
                        </h3>
                        <p className="text-sm text-gray-500 tracking-wide">
                          {at.email ?? 'N/A'}
                        </p>
                      </div>

                      <div className="text-purple-900 font-mono font-bold text-xl tracking-wide">
                        Score: {at.score}
                      </div>
                    </div>

                    <button
                      onClick={() => toggleExpand(key)}
                      className="mt-4 text-purple-600 underline hover:text-purple-800 font-medium transition-colors"
                    >
                      {isExpanded ? 'Hide Details' : 'View More'}
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && Array.isArray(at.questions) && at.questions.length ? (
                        <motion.div
                          className="space-y-6 mt-6"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.4 }}
                        >
                          {at.questions.map((q, idx) => {
                            const selIdx = at.answers?.[idx];
                            const corrIdx = q?.answer;

                            return (
                              <div
                                key={q?._id || idx}
                                className="p-5 bg-gradient-to-r from-purple-50 via-pink-50 to-yellow-50 rounded-xl border border-purple-200 shadow-sm"
                              >
                                <div className="font-semibold mb-3 text-purple-900 text-lg tracking-wide">
                                  Q{idx + 1}. {q?.question ?? '—'}
                                </div>
                                <ul className="space-y-3">
                                  {q?.options?.map((opt, j) => {
                                    const isCorrect = j === corrIdx;
                                    const isChosenWrong = selIdx === j && selIdx !== corrIdx;

                                    let bg = '';
                                    if (isCorrect)
                                      bg = 'bg-green-200 text-green-900 font-semibold';
                                    else if (isChosenWrong)
                                      bg = 'bg-red-200 text-red-900 font-semibold';

                                    return (
                                      <li
                                        key={j}
                                        className={`px-4 py-3 rounded-lg border select-none tracking-wide ${bg}`}
                                      >
                                        {String.fromCharCode(65 + j)}. {opt ?? '—'}
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            );
                          })}
                          <div className="text-right text-purple-700 italic tracking-wide text-sm mt-3">
                            Submitted {new Date(at.submittedAt).toLocaleString()}
                          </div>
                        </motion.div>
                      ) : (
                        isExpanded && (
                          <motion.p
                            className="text-sm italic mt-4 text-purple-600 tracking-wide"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            Questions not stored for this attempt.
                          </motion.p>
                        )
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-6 p-6">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-6 py-3 rounded-full bg-white shadow-md text-purple-700 font-semibold disabled:opacity-50 hover:bg-gradient-to-br hover:from-purple-600 hover:via-pink-500 hover:to-yellow-400 hover:text-white transition"
                  >
                    Prev
                  </button>
                  <span className="text-gray-700 font-semibold text-lg tracking-wide">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-6 py-3 rounded-full bg-white shadow-md text-purple-700 font-semibold disabled:opacity-50 hover:bg-gradient-to-br hover:from-purple-600 hover:via-pink-500 hover:to-yellow-400 hover:text-white transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
    </div>
  );
}
