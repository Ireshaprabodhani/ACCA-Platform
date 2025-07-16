import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { PlusCircle, X } from 'lucide-react';

/* ────────── constants ────────── */
const PER_PAGE = 10;
const LANGS = ['English', 'Sinhala'];
const BLANK_FORM = {
  question: '',
  language: 'English',
  options: ['', '', '', ''],
  answer: 0, // frontend uses 'answer' internally
};

const api = axios.create({
  baseURL: 'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin',
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});

export default function CaseQuestionsPage() {
  /* data */
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [langTab, setLang] = useState('English');

  /* ui */
  const [modalOpen, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);

  /* ────────── CRUD + fetch ────────── */
  const loadRows = async (p = page, lang = langTab) => {
    try {
      const { data } = await api.get('/case', {
        params: { page: p, limit: PER_PAGE, language: lang },
      });

      // Map each question's correctAnswer to answer for frontend use
      const mappedQuestions = (data.questions || []).map((q) => ({
        ...q,
        answer: q.correctAnswer,
      }));

      setRows(mappedQuestions);
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
      form.answer < 0 ||
      form.answer > 3;
    if (invalid) return toast.error('Fill question, 4 options, correct answer');

    const req = editId
      ? api.put(`/case/${editId}`, {
          ...form,
          correctAnswer: form.answer, // send as correctAnswer to backend
          // Remove 'answer' so backend doesn't get confused (optional)
          answer: undefined,
        })
      : api.post('/case', {
          ...form,
          correctAnswer: form.answer,
          answer: undefined,
        });

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

  /* lifecycle */
  useEffect(() => {
    loadRows(1, langTab);
  }, [langTab]); // eslint-disable-line

  /* pagination helpers */
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const firstIndex = (page - 1) * PER_PAGE;

  /* ────────── UI ────────── */
  return (
    <div className="max-w-6xl mx-auto p-6 font-sans text-gray-800 bg-gray-50 min-h-screen">
      <Toaster position="top-center" />

      {/* Tabs + Add button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-4">
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => {
                setLang(l);
                setPage(1);
              }}
              className={`px-5 py-2 rounded-lg font-medium transition
                ${
                  langTab === l
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-400/30'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
        >
          <PlusCircle size={20} />
          Add Question
        </button>
      </div>

      {/* Question‑paper style list */}
      <div className="space-y-6">
        {rows.length ? (
          rows.map((q, idx) => (
            <div
              key={q._id}
              className="bg-white border border-gray-200 rounded-xl shadow hover:shadow-md transition p-6"
            >
              {/* Heading row with buttons */}
              <div className="sm:flex justify-between gap-4">
                <h4 className="flex-1 text-lg font-semibold leading-snug break-words sm:pr-8">
                  {firstIndex + idx + 1}. {q.question}
                </h4>

                <div className="flex-shrink-0 flex gap-4 text-sm font-medium mt-2 sm:mt-0">
                  <button
                    onClick={() => {
                      // Map backend correctAnswer to frontend answer
                      setForm({ ...q, answer: q.correctAnswer });
                      setEditId(q._id);
                      setModal(true);
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
              </div>

              {/* options */}
              <ul className="space-y-2 ml-6 mt-4">
                {q.options.map((opt, i) => (
                  <li
                    key={i}
                    className={`flex gap-2 ${
                      i === q.correctAnswer
                        ? 'font-semibold text-green-700 bg-green-50 px-2 py-1 rounded'
                        : ''
                    }`}
                  >
                    <span className="w-5 font-bold">{String.fromCharCode(65 + i)}.</span>
                    <span className="flex-1 break-words">{opt}</span>
                    {i === q.correctAnswer && (
                      <span className="text-green-600 text-sm font-medium">✓ Correct</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p className="text-center py-10 text-gray-500 italic">No case questions found.</p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-6 mt-10 text-gray-700">
          <button
            disabled={page === 1}
            onClick={() => loadRows(page - 1)}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition"
          >
            Prev
          </button>
          <span className="font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => loadRows(page + 1)}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition"
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl p-8 space-y-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold">{editId ? 'Edit' : 'Add'} Question</h3>
              <button
                onClick={() => setModal(false)}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X size={24} />
              </button>
            </div>

            <label className="block text-sm font-medium">
              Question
              <textarea
                className="w-full mt-2 border border-gray-300 rounded-md px-3 py-2
                  focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[70px]"
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
              <legend className="text-sm font-medium mb-1">Options (select correct answer)</legend>
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correct"
                    checked={form.answer === i}
                    onChange={() => setForm({ ...form, answer: i })}
                    className="accent-blue-600 cursor-pointer"
                  />
                  <input
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                onClick={() => setModal(false)}
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
