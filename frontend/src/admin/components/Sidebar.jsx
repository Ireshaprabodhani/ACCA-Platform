import React from "react";
import { NavLink } from "react-router-dom";
import {
  Users, ListTodo, BookOpen, Video, BarChart2, FileBarChart2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { to: "/admin", label: "Dashboard", icon: <FileBarChart2 size={20} /> },
  { to: "/admin/users", label: "Users", icon: <Users size={20} /> },
  { to: "/admin/quiz-questions", label: "Quiz Qns", icon: <ListTodo size={20} /> },
  { to: "/admin/case-questions", label: "Case Qns", icon: <BookOpen size={20} /> },
  { to: "/admin/videos", label: "Videos", icon: <Video size={20} /> },
  { to: "/admin/results", label: "Results", icon: <FileBarChart2 size={20} /> },
  { to: "/admin/leaderboard", label: "Leaderboard", icon: <BarChart2 size={20} /> }
];

const Sidebar = ({ open }) => {
  return (
    <motion.aside
      initial={{ width: 64 }}
      animate={{ width: open ? 224 : 64 }}
      transition={{ type: "spring", stiffness: 210, damping: 22 }}
      className="bg-gradient-to-br from-purple-600 via-pink-500 to-yellow-400 min-h-screen text-white shadow-xl"
    >
      <div className="py-6 px-4 text-center font-bold text-white text-lg tracking-wide">
        ACCA
      </div>

      <nav className="space-y-1 px-2">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group ${
                isActive
                  ? "bg-white/20 text-white font-semibold"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            {icon}
            <AnimatePresence>
              {open && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="whitespace-nowrap text-sm"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>
    </motion.aside>
  );
};

export default Sidebar;
