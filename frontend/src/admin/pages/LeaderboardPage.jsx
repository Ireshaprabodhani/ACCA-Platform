// pages/LeaderboardPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Loader2, Download, Award } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/* ----------------------- UI Components ----------------------- */
const Card = ({ className = "", children }) => (
  <div
    className={`rounded-2xl bg-white shadow-lg border border-gray-200 ${className}`}
  >
    {children}
  </div>
);

const CardContent = ({ className = "", children }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

const Badge = ({ children, className = "", variant = "default" }) => {
  const variants = {
    default: "bg-blue-100 text-blue-800",
    quiz: "bg-purple-100 text-purple-800",
    case: "bg-green-100 text-green-800",
    total: "bg-yellow-100 text-yellow-800"
  };
  
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

/* -------------------- Main Component ----------------------- */
export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [leaderboard, setBoard] = useState([]);
  const [error, setError] = useState(null);

  /* ─────────── Process leaderboard data with tiebreakers ─────────── */
  const processedLeaderboard = useMemo(() => {
    if (!leaderboard.length) return [];
    
    // Sort by total marks (descending)
    const sorted = [...leaderboard].sort((a, b) => b.totalMarks - a.totalMarks);
    
    // Assign ranks with proper tie handling
    let currentRank = 1;
    return sorted.map((item, index) => {
      // If not first item and same marks as previous, same rank
      if (index > 0 && item.totalMarks === sorted[index - 1].totalMarks) {
        return { ...item, rank: currentRank };
      }
      currentRank = index + 1;
      return { ...item, rank: currentRank };
    });
  }, [leaderboard]);

  /* ─────────── Fetch leaderboard once ─────────── */
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(
          "https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/leaderboard",
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
    if (!processedLeaderboard.length) {
      alert("No data to export");
      return;
    }

    const rows = processedLeaderboard.map((item) => ({
      Rank: item.rank,
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

  const rankBadge = (rank) => {
    const styles = [
      "bg-yellow-400 text-white shadow-md", // 1st place
      "bg-gray-300 text-gray-800 shadow-md", // 2nd place
      "bg-amber-500 text-white shadow-md",   // 3rd place
      "bg-blue-50 text-blue-800"             // other ranks
    ];
    
    const style = rank <= 3 ? styles[rank - 1] : styles[3];
    
    return (
      <span
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${style}`}
      >
        {rank}
      </span>
    );
  };

  const columnHead = [
    { label: "Rank", align: "left" },
    { label: "Participant", align: "left" },
    { label: "School", align: "left" },
    { label: "Quiz", align: "center" },
    { label: "Case", align: "center" },
    { label: "Total", align: "center" },
  ];

  /* ─────────── Loading & error states ─────────── */
  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );

  if (error)
    return (
      <p className="text-center mt-10 text-red-500 font-medium">{error}</p>
    );

  /* ─────────── UI ─────────── */
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <Card className="max-w-6xl mx-auto">
        <CardContent>
          {/* header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-800">
                Competition Leaderboard
              </h2>
            </div>

            {/* Download Excel button */}
            <button
              onClick={exportToExcel}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-colors"
            >
              <Download size={16} /> Export to Excel
            </button>
          </div>

          {/* ---------- table wrapper ---------- */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full whitespace-nowrap">
              {/* ----- head ----- */}
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  {columnHead.map(({ label, align }) => (
                    <th 
                      key={label} 
                      className={`px-6 py-3 text-${align} text-sm font-semibold text-gray-700 uppercase tracking-wider`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* ----- body ----- */}
              <tbody className="divide-y divide-gray-200">
                <AnimatePresence>
                  {processedLeaderboard.map((item) => (
                    <motion.tr
                      key={item.userId || item.rank}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25, delay: item.rank * 0.03 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {rankBadge(item.rank)}
                          {item.rank <= 3 && (
                            <Award className="w-4 h-4" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{item.userName}</div>
                        <div className="text-sm text-gray-500">{item.email}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{item.schoolName}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="quiz">{item.quizMarks}</Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="case">{item.caseMarks}</Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="total">{item.totalMarks}</Badge>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
              <span className="text-gray-600">1st Place</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-300"></span>
              <span className="text-gray-600">2nd Place</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-gray-600">3rd Place</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}