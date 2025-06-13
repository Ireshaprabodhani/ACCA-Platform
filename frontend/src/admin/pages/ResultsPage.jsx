
import React, { useEffect, useState } from 'react';


const fetchJSON = async (url) => {
  const jwt =
    localStorage.getItem('adminToken') || localStorage.getItem('token') || '';
  const res = await fetch(url, { headers: { Authorization: `Bearer ${jwt}` } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};

const OptCell = ({ text, isCorrect, isChosen }) => (
  <td
    className={
      'px-2 py-1 ' +
      (isCorrect
        ? 'bg-green-100 text-green-700 font-semibold'
        : isChosen
        ? 'bg-red-100 text-red-700 font-semibold'
        : '')
    }
  >
    {text ?? '—'}
  </td>
);


export default function ResultsPage() {
  const [tab, setTab] = useState('quiz'); // 'quiz' | 'case'
  const [rows, setRows] = useState([]); // [ [school, attempts[]] , … ]
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setBusy(true);
        setErr('');
        const data = await fetchJSON(
          `http://localhost:5000/api/admin/${tab}-status`
        );
        /* group by school */
        const grouped = {};
        data.forEach((a) => {
          const key = a.schoolName || 'N/A';
          (grouped[key] = grouped[key] || []).push(a);
        });
        setRows(Object.entries(grouped)); // [[school, attempts], …]
      } catch (e) {
        setErr(e.message);
      } finally {
        setBusy(false);
      }
    })();
  }, [tab]);

  return (
    <div className="p-6 overflow-x-auto">
      {/* Tabs */}
      <div className="mb-6 flex gap-4">
        {['quiz', 'case'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              'px-4 py-2 rounded-t font-semibold ' +
              (tab === t ? 'bg-blue-600 text-white' : 'bg-gray-200')
            }
          >
            {t === 'quiz' ? 'Quiz Results' : 'Case‑study Results'}
          </button>
        ))}
      </div>

      {busy && <p>Loading…</p>}
      {err && <p className="text-red-600">⚠ {err}</p>}
      {!busy && !err && rows.length === 0 && <p>No attempts yet.</p>}

      {!busy &&
        rows.map(([school, attempts]) => (
          <div key={school} className="mb-10 bg-white shadow rounded-lg">
            <div className="px-4 py-3 border-b font-bold text-lg bg-gray-50">
              {school}&nbsp;—&nbsp;{attempts.length} attempt
              {attempts.length > 1 ? 's' : ''}
            </div>

            {attempts.map((at, i) => (
              <div key={at.id || i} className="p-4 border-t">
                <div className="font-semibold mb-2">
                  {at.userName ?? 'Deleted User'}{' '}
                  <span className="text-gray-500 text-sm">
                    ({at.email ?? 'N/A'})
                  </span>
                  <span className="float-right">
                    Score:&nbsp;
                    <span className="font-mono">{at.score}</span>
                  </span>
                </div>

                {/* Questions w/ 4‑option grid */}
                {Array.isArray(at.questions) && at.questions.length ? (
                  <table className="min-w-full text-xs border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-1 w-2 text-left">#</th>
                        <th className="px-2 py-1 text-left">Question</th>
                        {[1, 2, 3, 4].map((n) => (
                          <th key={n} className="px-2 py-1 text-left">
                            Opt&nbsp;{n}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {at.questions.map((q, idx) => {
                        const selIdx =
                          Array.isArray(at.answers) && at.answers[idx] != null
                            ? at.answers[idx]
                            : undefined;
                        const corrIdx = q?.answer;
                        return (
                          <tr key={q?._id || idx} className="border-t">
                            <td className="px-2 py-1 font-mono">{idx + 1}</td>
                            <td className="px-2 py-1">{q?.question ?? '—'}</td>
                            {q?.options?.map((opt, j) => (
                              <OptCell
                                key={j}
                                text={opt}
                                isCorrect={j === corrIdx}
                                isChosen={
                                  selIdx != null && selIdx === j && selIdx !== corrIdx
                                }
                              />
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Questions not stored for this attempt.
                  </p>
                )}

                <div className="text-right text-xs mt-1 text-gray-500">
                  submitted {new Date(at.submittedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
