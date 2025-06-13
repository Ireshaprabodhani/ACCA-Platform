import React from "react";
import { NavLink } from "react-router-dom";
import {
  Users, ListTodo, BookOpen, Video, BarChart2,
  FileBarChart2, 
  FileBarChart
} from "lucide-react";

const links = [
  { to: "/admin",                label: "Dashboard",     icon: <FileBarChart2 size={18}/> },
  { to: "/admin/users",          label: "Users",         icon: <Users size={18}/> },
  { to: "/admin/quiz-questions", label: "Quiz Qns",      icon: <ListTodo size={18}/> },
  { to: "/admin/case-questions", label: "Case Qns",      icon: <BookOpen size={18}/> },
  { to: "/admin/videos",         label: "Videos",        icon: <Video size={18}/> },
  { to: "/admin/results",        label: "Results", icon: <FileBarChart2 size={18}/> },
  { to: "/admin/leaderboard",    label: "Leaderboard",   icon: <BarChart2 size={18}/> }
];

const Sidebar = ({ open }) => (
  <aside className={`bg-white shadow-lg transition-all duration-300 ${open ? "w-56" : "w-16"}`}>
    <div className="py-6 text-center font-extrabold text-purple-600">ACCA Admin</div>
    <nav className="px-2 space-y-1">
      {links.map(({ to, label, icon }) => (
        <NavLink key={to} to={to} end
          className={({ isActive }) => `flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-purple-50 ${
            isActive ? "bg-purple-100 font-semibold" : ""}`
          }>
          {icon}{open && <span>{label}</span>}
        </NavLink>
      ))}
    </nav>
  </aside>
);

export default Sidebar;
