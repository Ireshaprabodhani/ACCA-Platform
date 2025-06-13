// src/admin/pages/CaseQuestionsPage.jsx
import React, { useEffect, useState } from 'react';
import axios               from 'axios';
import toast, { Toaster }  from 'react-hot-toast';
import { PlusCircle, X }   from 'lucide-react';

const PER_PAGE   = 10;
const LANGS      = ['English', 'Sinhala'];
const BLANK_FORM = {
  question: '',
  language: 'English',
  options : ['', '', '', ''],
  correctAnswer: 0,
};

const api = axios.create({
  baseURL : 'http://localhost:5000/api/admin',
  headers : { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export default function CaseQuestionsPage() {
  /* data & ui state */
  const [rows,      setRows]    = useState([]);
  const [total,     setTotal]   = useState(0);
  const [page,      setPage]    = useState(1);
  const [langTab,   setLang]    = useState('English');

  const [modalOpen, setModal]   = useState(false);
  const [editId,    setEditId]  = useState(null);
  const [form,      setForm]    = useState(BLANK_FORM);

  
  const loadRows = async (p = page, lang = langTab) => {
    try {
      const { data } = await api.get('/case', {
        params: { page: p, limit: PER_PAGE, language: lang },
      });
      setRows(data.questions || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
    } catch {
      toast.error('Failed to load');
    }
  };

  const saveRow = async () => {
    const invalid =
      !form.question.trim() ||
      form.options.some((o) => !o.trim()) ||
      form.correctAnswer < 0 ||
      form.correctAnswer > 3;
    if (invalid) return toast.error('Fill question, 4 options, correct answer');

    const req = editId
      ? api.put(`/case/${editId}`, form)
      : api.post('/case', form);

    toast
      .promise(req, { loading: 'Saving…', success: 'Saved', error: 'Error' })
      .then(() => {
        setModal(false);
        setForm({ ...BLANK_FORM, language: langTab });
        loadRows(1, langTab);
      });
  };

  const deleteRow = (id) =>
    window.confirm('Delete this question?') &&
    toast
      .promise(api.delete(`/case/${id}`), {
        loading: 'Deleting…',
        success: 'Deleted',
        error: 'Error',
      })
      .then(() => loadRows(page, langTab));

  
  useEffect(() => {
    loadRows(1, langTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langTab]);

  
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <Toaster position="top-center" />

      {/* Tabs & “Add” button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4">
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => {
                setLang(l);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-t-md border-b-2 ${
                langTab === l
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-500'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setForm({ ...BLANK_FORM, language: langTab });
            setEditId(null);
            setModal(true);
          }}
          className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          <PlusCircle size={18} /> Add
        </button>
      </div>

      {/* Table */}
      <div className="overflow-auto bg-white shadow rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left w-1/3">Question</th>
              <th className="px-3 py-2 text-left w-1/2">Options</th>
              <th className="px-3 py-2 text-center">Correct&nbsp;(1‑4)</th>
              <th className="px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.length ? (
              rows.map((q) => (
                <tr key={q._id} className="border-t">
                  {/* question */}
                  <td className="px-3 py-2 align-top">{q.question}</td>

                  {/* options (✓ on correct) */}
                  <td className="px-3 py-2">
                    {q.options.map((opt, i) => (
                      <div
                        key={i}
                        className={
                          i === q.correctAnswer
                            ? 'text-green-700 font-semibold'
                            : ''
                        }
                      >
                        {i + 1}. {opt} {i === q.correctAnswer && '✓'}
                      </div>
                    ))}
                  </td>

                  {/* correct index */}
                  <td className="px-3 py-2 text-center font-mono">
                    {q.correctAnswer + 1}
                  </td>

                  {/* actions */}
                  <td className="px-3 py-2 text-center space-x-3">
                    <button
                      onClick={() => {
                        setForm({ ...q });
                        setEditId(q._id);
                        setModal(true);
                      }}
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
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No case questions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={page === 1}
            onClick={() => loadRows(page - 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            ‹ Prev
          </button>
          <span className="px-3 py-1">
            {page}/{totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => loadRows(page + 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Next ›
          </button>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-xl p-6 space-y-4">
            {/* header */}
            <div className="flex justify-between mb-2">
              <h3 className="text-xl font-semibold">
                {editId ? 'Edit' : 'Add'} Question
              </h3>
              <button onClick={() => setModal(false)}>
                <X size={20} />
              </button>
            </div>

            <label className="block text-sm">
              Question
              <textarea
                className="w-full mt-1 border rounded px-2 py-1"
                value={form.question}
                onChange={(e) =>
                  setForm({ ...form, question: e.target.value })
                }
              />
            </label>

            <label className="block text-sm">
              Language
              <select
                className="w-full mt-1 border rounded px-2 py-1"
                value={form.language}
                onChange={(e) =>
                  setForm({ ...form, language: e.target.value })
                }
              >
                <option>English</option>
                <option>Sinhala</option>
              </select>
            </label>

            {/* options with radio */}
            {form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  checked={form.correctAnswer === i}
                  onChange={() => setForm({ ...form, correctAnswer: i })}
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

            {/* footer buttons */}
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setModal(false)}
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
