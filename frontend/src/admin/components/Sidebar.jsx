import React from "react";
import { NavLink } from "react-router-dom";
import {
  Users, ListTodo, BookOpen, Video, BarChart2, FileBarChart2, ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { to: "/admin", label: "Dashboard", icon: <FileBarChart2 size={20} /> },
  { to: "/admin/users", label: "Users", icon: <Users size={20} /> },
  { to: "/admin/quiz-questions", label: "Quiz Qns", icon: <ListTodo size={20} /> },
  { to: "/admin/case-questions", label: "Case Qns", icon: <BookOpen size={20} /> },
  { to: "/admin/videos", label: "Videos", icon: <Video size={20} /> },
  { to: "/admin/results", label: "Results", icon: <FileBarChart2 size={20} /> },
  { to: "/admin/leaderboard", label: "Leaderboard", icon: <BarChart2 size={20} /> },
  { to: "/admin/entry-logo", label: "Entry Logo", icon: <ImageIcon size={20} /> }
];

const Sidebar = ({ open }) => {
  return (
    <motion.aside
      initial={{ width: 64 }}
      animate={{ width: open ? 224 : 64 }}
      transition={{ type: "spring", stiffness: 210, damping: 22 }}
      className="bg-gradient-to-b from-purple-50 to-pink-50 min-h-screen text-purple-900 shadow-xl border-r border-purple-100"
    >
      <div className="py-6 px-4 text-center font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 text-lg tracking-wide">
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
                  ? "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 font-semibold border-l-4 border-purple-500"
                  : "text-purple-700 hover:bg-purple-50 hover:text-purple-900"
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