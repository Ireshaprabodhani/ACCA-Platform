import React, { useEffect, useState } from 'react';
import axios from 'axios';

const LeaderboardPage = () => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    axios
      .get('http://localhost:5000/api/admin/leaderboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((res) => setRows(res.data))
      .catch(console.error);
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Leaderboard</h2>

      <div className="overflow-auto bg-white shadow rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Team / School</th>
              <th className="px-4 py-2 text-center">Quiz Score</th>
              <th className="px-4 py-2 text-center">Case Score</th>
              <th className="px-4 py-2 text-center">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.userId} className="border-t">
                <td className="px-4 py-2">
                  <span className="font-semibold">{i + 1}. </span>
                  {r.teamName || r.schoolName}
                </td>
                <td className="px-4 py-2 text-center">{r.quizScore}</td>
                <td className="px-4 py-2 text-center">{r.caseScore}</td>
                <td className="px-4 py-2 text-center font-bold">
                  {r.quizScore + r.caseScore}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardPage;
