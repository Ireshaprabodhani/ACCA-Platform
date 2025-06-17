import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { PlusCircle, X } from 'lucide-react';

/* ---------- helpers ---------- */
const defaultForm = {
  question: '',
  language: 'English',
  options: ['', '', '', ''],
  answer: 0,
};
const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

/* ---------- component ---------- */
export default function QuizQuestionsPage() {
  const [rows, setRows] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(defaultForm);

  // Pagination & tab state
  const [currentPage, setCurrentPage] = useState({ English: 1, Sinhala: 1 });
  const [activeLang, setActiveLang] = useState('English');
  const rowsPerPage = 10;

  /* ───────────── CRUD ───────────── */
  const loadRows = () =>
    axios
      .get('http://localhost:5000/api/admin/quiz', authHeaders())
      .then(({ data }) => {
        setRows(Array.isArray(data) ? data : data.questions || []);
        setCurrentPage({ English: 1, Sinhala: 1 });
      })
      .catch(() => toast.error('Failed to load'));

  const saveRow = () => {
    if (
      !form.question.trim() ||
      form.options.some((o) => !o.trim()) ||
      form.answer < 0 ||
      form.answer > 3
    ) {
      toast.error('Fill question, 4 options and correct answer');
      return;
    }

    const url = editId
      ? `http://localhost:5000/api/admin/quiz/${editId}`
      : 'http://localhost:5000/api/admin/quiz';

    const req = editId
      ? axios.put(url, form, authHeaders())
      : axios.post(url, form, authHeaders());

    toast
      .promise(req, { loading: 'Saving…', success: 'Saved', error: 'Error' })
      .then(() => {
        setModalOpen(false);
        setForm(defaultForm);
        setEditId(null);
        loadRows();
      });
  };

  const deleteRow = (id) =>
    window.confirm('Delete this question?') &&
    toast
      .promise(
        axios.delete(`http://localhost:5000/api/admin/quiz/${id}`, authHeaders()),
        { loading: 'Deleting…', success: 'Deleted', error: 'Error' }
      )
      .then(loadRows);
  /* ─────────────────────────────── */

  useEffect(() => {
    loadRows();
  }, []);

  // ---------- FILTER & PAGINATION ----------
  const filteredRows = rows.filter((q) => q.language === activeLang);
  const indexOfLastRow = currentPage[activeLang] * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredRows.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

  const changePage = (p) =>
    setCurrentPage((prev) => ({ ...prev, [activeLang]: p }));

  // ---------- UI ----------
  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
      <Toaster position="top-center" />

      {/* ─── Tabs & Add Button ─────────────────────────────── */}
      <div className="flex items-center space-x-4 mb-6">
        {['English', 'Sinhala'].map((lang) => (
          <button
            key={lang}
            onClick={() => setActiveLang(lang)}
            className={`px-5 py-2 rounded-lg font-medium transition
              ${
                activeLang === lang
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-400/30'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            {lang}
          </button>
        ))}

        <button
          onClick={() => {
            setForm(defaultForm);
            setEditId(null);
            setModalOpen(true);
          }}
          className="ml-auto flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition"
        >
          <PlusCircle size={20} />
          Add Question
        </button>
      </div>

      {/* ─── Question‑paper Style List ─────────────────────── */}
      <div className="space-y-6">
        {currentRows.map((q, idx) => (
          <div
            key={q._id}
            className="relative bg-white border border-gray-200 rounded-xl shadow hover:shadow-md transition p-6"
          >
            {/* action buttons */}
            <div className="absolute top-4 right-4 flex gap-4 text-sm font-medium">
              <button
                onClick={() => {
                  setForm({ ...q });
                  setEditId(q._id);
                  setModalOpen(true);
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
              <button
                onClick={() => deleteRow(q._id)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>

            {/* question text */}
            <h4 className="text-lg font-semibold leading-snug mb-4">
              {indexOfFirstRow + idx + 1}. {q.question}
            </h4>

            {/* options */}
            <ul className="space-y-2 ml-6">
              {q.options.map((opt, i) => (
                <li
                  key={i}
                  className={`flex gap-2
                    ${i === q.answer ? 'font-semibold text-blue-700' : ''}`}
                >
                  <span className="w-5 font-bold">{String.fromCharCode(65 + i)}.</span>
                  <span className="flex-1 break-words">{opt}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {currentRows.length === 0 && (
          <p className="text-center py-10 text-gray-500 italic">No questions found.</p>
        )}
      </div>

      {/* ─── Pagination ─────────────────────────────────────── */}
      {filteredRows.length > rowsPerPage && (
        <div className="flex justify-center items-center gap-6 mt-8 text-gray-700">
          <button
            onClick={() => changePage(Math.max(currentPage[activeLang] - 1, 1))}
            disabled={currentPage[activeLang] === 1}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition"
          >
            Prev
          </button>
          <span className="font-medium">
            Page {currentPage[activeLang]} of {totalPages}
          </span>
          <button
            onClick={() =>
              changePage(Math.min(currentPage[activeLang] + 1, totalPages))
            }
            disabled={currentPage[activeLang] === totalPages}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition"
          >
            Next
          </button>
        </div>
      )}

      {/* ─── Add / Edit Modal (unchanged styling) ──────────── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white max-w-lg w-full rounded-xl shadow-2xl p-8 space-y-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold">
                {editId ? 'Edit' : 'Add'} Question
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X size={24} />
              </button>
            </div>

            <label className="block text-sm font-medium">
              Question
              <textarea
                className="w-full mt-2 border border-gray-300 rounded-md px-3 py-2
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[70px]"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
              />
            </label>

            <label className="block text-sm font-medium">
              Language
              <select
                className="w-full mt-2 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
              >
                <option>English</option>
                <option>Sinhala</option>
              </select>
            </label>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium mb-1">
                Options (select correct answer)
              </legend>
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correct"
                    checked={form.answer === i}
                    onChange={() => setForm({ ...form, answer: i })}
                    className="accent-blue-600"
                  />
                  <input
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const opts = [...form.options];
                      opts[i] = e.target.value;
                      setForm({ ...form, options: opts });
                    }}
                  />
                </div>
              ))}
            </fieldset>

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveRow}
                className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
