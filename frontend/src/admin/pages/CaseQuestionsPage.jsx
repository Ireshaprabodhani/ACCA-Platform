import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { PlusCircle, X, ChevronLeft, ChevronRight, Edit2, Trash2, CheckCircle, Loader2 } from 'lucide-react';

const PER_PAGE = 10;
const BLANK_FORM = {
  question: '',
  language: 'English',
  options: ['', '', '', ''],
  answer: 0,
};

export default function CaseQuestionsPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [modalOpen, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Create axios instance with interceptor to handle token refresh
  const api = axios.create({
    baseURL: 'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin',
  });

  // Add request interceptor to include token
  api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Add response interceptor to handle errors
  api.interceptors.response.use(
    response => response,
    error => {
      if (error.response && error.response.status === 401) {
        // Handle token expiration
        localStorage.removeItem('token');
        window.location.reload();
      }
      return Promise.reject(error);
    }
  );

  const loadRows = async (p = page) => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/case', {
        params: { page: p, limit: PER_PAGE, language: 'English' },
      });

      const mappedQuestions = (data.questions || []).map((q) => ({
        ...q,
        answer: q.correctAnswer,
      }));

      setRows(mappedQuestions);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    } catch (err) {
      toast.error('Failed to load questions. Please try again.');
      console.error('Error loading questions:', err);
      
      if (isInitialLoad) {
        setTimeout(() => loadRows(p), 1000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveRow = async () => {
    if (!form.question.trim()) {
      toast.error('Please enter a question');
      return;
    }
    if (form.options.some((o) => !o.trim())) {
      toast.error('Please fill all options');
      return;
    }
    if (form.answer < 0 || form.answer > 3) {
      toast.error('Please select the correct answer');
      return;
    }

    try {
      const payload = {
        ...form,
        correctAnswer: form.answer,
        answer: undefined,
      };

      const req = editId 
        ? api.put(`/case/${editId}`, payload)
        : api.post('/case', payload);

      await toast.promise(req, {
        loading: editId ? 'Updating question...' : 'Adding new question...',
        success: editId ? 'Question updated successfully!' : 'Question added successfully!',
        error: editId ? 'Failed to update question' : 'Failed to add question'
      });

      setModal(false);
      setForm(BLANK_FORM);
      loadRows(1);
    } catch (error) {
      console.error('Error saving question:', error);
    }
  };

  const deleteRow = async (id, questionText) => {
    if (!window.confirm(`Are you sure you want to delete:\n"${questionText}"?`)) return;
    
    try {
      await toast.promise(api.delete(`/case/${id}`), {
        loading: 'Deleting question...',
        success: 'Question deleted successfully!',
        error: 'Failed to delete question'
      });
      loadRows(page);
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  useEffect(() => {
    loadRows(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const firstIndex = (page - 1) * PER_PAGE;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
      <Toaster position="top-center" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-purple-900">Case Study Questions</h1>
          <p className="text-purple-600">
            {total} questions available
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Add Question Button */}
          <button
            onClick={() => {
              setForm(BLANK_FORM);
              setEditId(null);
              setModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm"
          >
            <PlusCircle size={18} />
            Add Question
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && isInitialLoad ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-12 w-12 text-purple-600" />
        </div>
      ) : (
        <>
          {/* Questions List */}
          <div className="space-y-4">
            {rows.length > 0 ? (
              rows.map((q, idx) => (
                <div
                  key={q._id}
                  className="bg-white border border-purple-100 rounded-xl shadow-sm hover:shadow-md transition p-6 relative"
                >
                  {/* Question Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-purple-100 text-purple-800 rounded-full text-sm font-medium mt-1">
                        {firstIndex + idx + 1}
                      </span>
                      <h3 className="text-lg font-semibold text-purple-900 break-words">
                        {q.question}
                      </h3>
                    </div>
                    <div className="flex gap-2 sm:self-center">
                      <button
                        onClick={() => {
                          setForm({ ...q, answer: q.correctAnswer });
                          setEditId(q._id);
                          setModal(true);
                        }}
                        className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-full transition"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => deleteRow(q._id, q.question)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Options List */}
                  <ul className="space-y-2 ml-2 pl-6">
                    {q.options.map((opt, i) => (
                      <li
                        key={i}
                        className={`flex items-start gap-3 p-2 rounded-lg ${
                          i === q.correctAnswer 
                            ? 'bg-green-50 border border-green-100' 
                            : 'hover:bg-purple-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 flex items-center justify-center rounded-full ${
                            i === q.correctAnswer 
                              ? 'bg-green-500 text-white' 
                              : 'bg-purple-100 text-purple-800'
                          } font-medium text-sm`}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          {i === q.correctAnswer && (
                            <CheckCircle size={16} className="text-green-500" />
                          )}
                        </div>
                        <span className="flex-1 break-words">{opt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl border border-purple-100 p-8 text-center">
                <p className="text-purple-600">
                  No case study questions found. Click "Add Question" to create one.
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
              <div className="text-sm text-purple-600">
                Showing {firstIndex + 1} to {Math.min(firstIndex + PER_PAGE, total)} of {total} questions
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => loadRows(page - 1)}
                  className="p-2 bg-white border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 disabled:opacity-50 transition"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="px-3 py-1 bg-white border border-purple-200 rounded-lg text-purple-700 text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => loadRows(page + 1)}
                  className="p-2 bg-white border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 disabled:opacity-50 transition"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-purple-900">
                {editId ? 'Edit Question' : 'Add New Question'}
              </h2>
              <button
                onClick={() => setModal(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  Case Study Question
                </label>
                <textarea
                  className="w-full border border-purple-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[100px]"
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  placeholder="Enter the case study scenario..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700 mb-2">
                  Response Options (select the correct answer)
                </label>
                <div className="space-y-3">
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={form.answer === i}
                        onChange={() => setForm({ ...form, answer: i })}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                      />
                      <input
                        type="text"
                        className="flex-1 border border-purple-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
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
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-purple-100">
              <button
                onClick={() => setModal(false)}
                className="px-4 py-2 text-purple-700 hover:bg-purple-50 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={saveRow}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-sm"
              >
                {editId ? 'Update Question' : 'Add Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}