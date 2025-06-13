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

  // Pagination state per language tab
  const [currentPage, setCurrentPage] = useState({ English: 1, Sinhala: 1 });
  const rowsPerPage = 10;

  // Tab state
  const [activeLang, setActiveLang] = useState('English');

  /* ───────────── CRUD ───────────── */
  const loadRows = () =>
    axios
      .get('http://localhost:5000/api/admin/quiz', authHeaders())
      .then((r) => {
        const payload = r.data;
        setRows(Array.isArray(payload) ? payload : payload.questions || []);
        setCurrentPage({ English: 1, Sinhala: 1 }); // Reset pages on reload
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

  const openAdd = () => {
    setForm(defaultForm);
    setEditId(null);
    setModalOpen(true);
  };
  const openEdit = (q) => {
    setForm({ ...q });
    setEditId(q._id);
    setModalOpen(true);
  };

  // Filter rows by active language tab
  const filteredRows = rows.filter((q) => q.language === activeLang);

  // Pagination calculations for current tab
  const indexOfLastRow = currentPage[activeLang] * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredRows.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

  // Change page handler per tab
  const changePage = (newPage) => {
    setCurrentPage((prev) => ({ ...prev, [activeLang]: newPage }));
  };

  // Change active tab handler
  const changeTab = (lang) => {
    setActiveLang(lang);
  };

  /* ---------- UI ---------- */
  return (
    <div>
      <Toaster position="top-center" />

      {/* Tabs */}
      <div className="mb-4 flex space-x-4">
        {['English', 'Sinhala'].map((lang) => (
          <button
            key={lang}
            onClick={() => changeTab(lang)}
            className={`px-4 py-2 rounded ${
              activeLang === lang
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {lang}
          </button>
        ))}

        <button
          onClick={openAdd}
          className="ml-auto flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          <PlusCircle size={18} /> Add
        </button>
      </div>

      {/* Table */}
      <div className="overflow-auto bg-white shadow rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Question</th>
              <th className="px-3 py-2">Options</th>
              <th className="px-3 py-2">Correct</th>
              <th className="px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.map((q) => (
              <tr key={q._id} className="border-t align-top">
                <td className="px-3 py-2">{q.question}</td>
                <td className="px-3 py-2">
                  <ol className="list-decimal list-inside space-y-1">
                    {q.options.map((opt, i) => (
                      <li key={i}>{opt}</li>
                    ))}
                  </ol>
                </td>
                <td className="px-3 py-2 text-center">{q.answer + 1}</td>
                <td className="px-3 py-2 text-center space-x-3">
                  <button
                    onClick={() => openEdit(q)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteRow(q._id)}
                    className="text-red-600 hover:underline"
                  >
                    Del
                  </button>
                </td>
              </tr>
            ))}
            {currentRows.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-4">
                  No questions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {filteredRows.length > rowsPerPage && (
        <div className="flex justify-center items-center gap-3 mt-4">
          <button
            onClick={() => changePage(Math.max(currentPage[activeLang] - 1, 1))}
            disabled={currentPage[activeLang] === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {currentPage[activeLang]} of {totalPages}
          </span>
          <button
            onClick={() => changePage(Math.min(currentPage[activeLang] + 1, totalPages))}
            disabled={currentPage[activeLang] === totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white max-w-lg w-full rounded-lg shadow-xl p-6 space-y-4">
            <div className="flex justify-between mb-2">
              <h3 className="text-xl font-semibold">{editId ? 'Edit' : 'Add'} Question</h3>
              <button onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <label className="block text-sm">
              Question
              <textarea
                className="w-full mt-1 border rounded px-2 py-1"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
              />
            </label>

            <label className="block text-sm">
              Language
              <select
                className="w-full mt-1 border rounded px-2 py-1"
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
              >
                <option>English</option>
                <option>Sinhala</option>
              </select>
            </label>

            {form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  checked={form.answer === i}
                  onChange={() => setForm({ ...form, answer: i })}
                  className="accent-blue-600"
                />
                <input
                  className="flex-1 border rounded px-2 py-1"
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

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={saveRow}
                className="px-4 py-2 bg-blue-600 text-white rounded"
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
