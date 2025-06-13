
import React, { useEffect, useState, useRef } from 'react';


export default function QuizAttemptsPage() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [school,  setSchool]  = useState('');
  const lastServerPayload     = useRef(null);   

  const fetchAttempts = async (schoolName = '') => {
    setLoading(true); setError('');
    try {
      const query = schoolName ? `?schoolName=${encodeURIComponent(schoolName)}` : '';
      const jwt   = localStorage.getItem('adminToken') || localStorage.getItem('token') || '';
      if (!jwt) throw new Error('No admin token in localStorage');

      const res   = await fetch(
        `http://localhost:5000/api/admin/quiz-status${query}`,
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

      const data = await res.json();
      lastServerPayload.current = data;  
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Fetch error');
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => { fetchAttempts(); }, []);

 
  useEffect(() => {
    const t = setTimeout(() => fetchAttempts(school), 400);
    return () => clearTimeout(t);
  }, [school]);

  
  return (
    <div className="p-6 overflow-x-auto">
      <h2 className="text-2xl font-bold mb-4">Quiz Attempts</h2>

      {/* filter */}
      <div className="flex gap-2 items-center mb-4">
        <input
          className="border rounded px-3 py-1 w-64"
          placeholder="Filter by school"
          value={school}
          onChange={e => setSchool(e.target.value)}
        />
        <button
          onClick={() => fetchAttempts(school)}
          className="bg-blue-600 text-white px-4 py-1 rounded"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && <p className="text-red-600 mb-3">⚠ {error}</p>}

      {/* main table */}
      {!loading && rows.length > 0 && (
        <table className="min-w-full text-sm bg-white shadow rounded">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">User</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">School</th>
              <th className="px-3 py-2">Score</th>
              <th className="px-3 py-2">Lang</th>
              <th className="px-3 py-2">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.userName}</td>
                <td className="px-3 py-2 text-center">{r.email}</td>
                <td className="px-3 py-2 text-center">{r.schoolName}</td>
                <td className="px-3 py-2 text-center">{r.score}</td>
                <td className="px-3 py-2 text-center">{r.language}</td>
                <td className="px-3 py-2 text-center">
                  {new Date(r.submittedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* nothing found – show raw json to debug quick */}
      {!loading && !error && rows.length === 0 && (
        <div className="text-gray-600">
          <p>No quiz attempts found.</p>
          <details className="mt-2">
            <summary className="cursor-pointer underline">Raw payload (debug)</summary>
            <pre className="whitespace-pre-wrap text-xs bg-gray-100 p-2 rounded">
              {JSON.stringify(lastServerPayload.current, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
