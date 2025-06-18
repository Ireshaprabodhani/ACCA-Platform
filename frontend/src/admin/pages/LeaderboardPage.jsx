// pages/LeaderboardPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Loader2, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/* ----------------------- UI Components ----------------------- */
const Card = ({ className = "", children }) => (
  <div
    className={`rounded-2xl bg-white/10 backdrop-blur-md shadow-2xl border border-white/20 ${className}`}
  >
    {children}
  </div>
);

const CardContent = ({ className = "", children }) => (
  <div className={`p-8 ${className}`}>{children}</div>
);

const Badge = ({ children, className = "" }) => (
  <span
    className={`inline-block rounded-full bg-white/20 text-white px-3 py-1 text-sm font-semibold shadow-md ${className}`}
  >
    {children}
  </span>
);

/* -------------------- Main Component ----------------------- */
export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [leaderboard, setBoard] = useState([]);
  const [error, setError] = useState(null);

  /* ─────────── Fetch leaderboard once ─────────── */
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(
          "http://localhost:5000/api/admin/leaderboard",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setBoard(data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch leaderboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ─────────── Build an Excel workbook & download ─────────── */
  const exportToExcel = () => {
    if (!leaderboard.length) {
      alert("No data to export");
      return;
    }

    const rows = leaderboard.map((item, idx) => ({
      Rank: idx + 1,
      Name: item.userName,
      Email: item.email,
      School: item.schoolName,
      QuizMarks: item.quizMarks,
      CaseMarks: item.caseMarks,
      TotalMarks: item.totalMarks,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leaderboard");

    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([buf], { type: "application/octet-stream" }),
      "leaderboard.xlsx"
    );
  };

  const rankBadge = (idx) => {
    const styles = [
      "bg-yellow-400 text-black shadow-lg",
      "bg-gray-400 text-black shadow-lg",
      "bg-orange-500 text-white shadow-lg",
    ];
    return idx < 3 ? (
      <span
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${styles[idx]}`}
      >
        {idx + 1}
      </span>
    ) : (
      <span className="font-semibold text-white">{idx + 1}</span>
    );
  };

  const columnHead = [
    { label: "Rank", align: "left" },
    { label: "Name", align: "left" },
    { label: "Email", align: "left" },
    { label: "School", align: "left" },
    { label: "Quiz", align: "center" },
    { label: "Case", align: "center" },
    { label: "Total", align: "center" },
  ];

  /* ─────────── Loading & error states ─────────── */
  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );

  if (error)
    return (
      <p className="text-center mt-10 text-red-300 font-medium">{error}</p>
    );

  /* ─────────── UI ─────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-yellow-400 py-10 px-4 text-white">
      <Card className="max-w-6xl mx-auto">
        <CardContent>
          {/* header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-300 shrink-0" />
              <h2 className="text-3xl font-extrabold tracking-tight text-white drop-shadow">
                Competition Leaderboard
              </h2>
            </div>

            {/* Download Excel button */}
            <button
              onClick={exportToExcel}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-500 hover:bg-green-600 text-white font-semibold shadow-md transition-colors"
            >
              <Download size={18} /> Download Excel
            </button>
          </div>

          {/* ---------- table wrapper ---------- */}
          <div className="overflow-x-auto rounded-lg shadow-inner border border-white/10">
            <table className="w-full whitespace-nowrap text-white">
              {/* ----- head ----- */}
              <thead className="text-sm bg-white/10 text-white uppercase">
                <tr>
                  {columnHead.map(({ label, align }) => (
                    <th key={label} className={`px-6 py-4 text-${align}`}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* ----- body ----- */}
              <tbody className="divide-y divide-white/10">
                <AnimatePresence>
                  {leaderboard.map((item, idx) => (
                    <motion.tr
                      key={item.userId || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25, delay: idx * 0.03 }}
                      className="hover:bg-white/10 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium">
                        {rankBadge(idx)}
                      </td>
                      <td className="px-6 py-4">{item.userName}</td>
                      <td className="px-6 py-4 underline underline-offset-2">
                        {item.email}
                      </td>
                      <td className="px-6 py-4">{item.schoolName}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge>{item.quizMarks}</Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge>{item.caseMarks}</Badge>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-lg">
                        {item.totalMarks}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
