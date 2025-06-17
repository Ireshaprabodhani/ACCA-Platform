import React, { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const api = axios.create({
  baseURL : "http://localhost:5000/api/admin",
  headers : { Authorization:`Bearer ${localStorage.getItem("token")}` }
});

export default function CaseAttemptsPage() {
  const [rows,  setRows]  = useState([]);
  const [school,setSchool]= useState("All");

  const load = async (sch=school) => {
    try{
      const { data } = await api.get("/case-status", sch==="All"?{}:{ params:{ schoolName:sch }});
      setRows(data);
    }catch{ toast.error("Failed to load");}
  };

  useEffect(()=>{ load(); }, []);

  const schools = Array.from(new Set(rows.map(r=>r.schoolName).filter(Boolean)));
  if (!schools.includes(school) && school!=="All") setSchool("All");

  return (
    <div>
      <Toaster position="top-center"/>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Case‑Study Attempts</h2>
        {schools.length>0 && (
          <select value={school} onChange={e=>{setSchool(e.target.value);load(e.target.value);}}
                  className="border rounded px-3 py-1">
            <option>All</option>
            {schools.map(s=><option key={s}>{s}</option>)}
          </select>
        )}
      </div>

      <div className="overflow-auto bg-white shadow rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Name / Email</th>
              <th className="px-3 py-2">School</th>
              <th className="px-3 py-2">Score / 10</th>
              <th className="px-3 py-2">Lang</th>
              <th className="px-3 py-2">Time (s)</th>
              <th className="px-3 py-2">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {rows.length
              ? rows.map(a=>(
                <tr key={a._id} className="border-t">
                  <td className="px-3 py-2">
                    {a.user.firstName} {a.user.lastName}<br/>
                    <span className="text-xs text-gray-500">{a.user.email}</span>
                  </td>
                  <td className="px-3 py-2 text-center">{a.schoolName||"—"}</td>
                  <td className="px-3 py-2 text-center font-mono">{a.score}</td>
                  <td className="px-3 py-2 text-center">{a.language}</td>
                  <td className="px-3 py-2 text-center">{a.timeTaken??"—"}</td>
                  <td className="px-3 py-2 text-center">
                    {new Date(a.submittedAt).toLocaleString()}
                  </td>
                </tr>
              ))
              : <tr><td colSpan={6} className="p-4 text-center text-gray-500">No attempts found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
