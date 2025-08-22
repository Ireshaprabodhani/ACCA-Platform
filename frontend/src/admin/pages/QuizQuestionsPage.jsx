import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { PlusCircle, X, ChevronLeft, ChevronRight, Edit2, Trash2, CheckCircle, Search } from 'lucide-react';

const defaultForm = {
  question: '',
  language: 'English',
  options: ['', '', '', '', ''], 
  answer: 0,
};

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export default function QuizQuestionsPage() {
  const [rows, setRows] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState({ English: 1, Sinhala: 1 });
  const [activeLang, setActiveLang] = useState('English');
  const [searchTerm, setSearchTerm] = useState('');
  const [debugMode, setDebugMode] = useState(false); // Toggle for debugging
  const rowsPerPage = 10;

  const loadRows = () => {
    setIsLoading(true);
    console.log('🔄 Frontend: Loading questions...');
    console.log('🔗 API URL:', 'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/quiz');
    
    axios
      .get('https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/quiz', authHeaders())
      .then(({ data }) => {
        console.log('✅ Frontend: Raw API response:', data);
        console.log('📊 Response type:', typeof data);
        console.log('📊 Is array?', Array.isArray(data));
        
        const questions = Array.isArray(data) ? data : data.questions || [];
        
        console.log('📝 Final questions array:', questions);
        console.log('🔢 Questions count:', questions.length);
        
        if (questions.length > 0) {
          console.log('📄 First question:', questions[0]);
          const englishCount = questions.filter(q => q.language === 'English').length;
          const sinhalaCount = questions.filter(q => q.language === 'Sinhala').length;
          console.log(`🇬🇧 English: ${englishCount}, 🇱🇰 Sinhala: ${sinhalaCount}`);
        } else {
          console.log('⚠️ No questions in final array!');
        }
        
        setRows(questions);
        setCurrentPage({ English: 1, Sinhala: 1 });
      })
      .catch((error) => {
        console.error('❌ Frontend: API Error:', error);
        console.error('❌ Error response:', error.response);
        toast.error('Failed to load questions');
      })
      .finally(() => setIsLoading(false));
  };

  const saveRow = () => {
    if (!form.question.trim()) {
      toast.error('Please enter a question');
      return;
    }
    if (form.options.some((o) => !o.trim())) {
      toast.error('Please fill all options');
      return;
    }
    if (form.answer < 0 || form.answer > 4) {
      toast.error('Please select the correct answer');
      return;
    }

    const url = editId
      ? `https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/quiz/${editId}`
      : 'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/quiz';

    const req = editId
      ? axios.put(url, form, authHeaders())
      : axios.post(url, form, authHeaders());

    toast.promise(req, {
      loading: editId ? 'Updating question...' : 'Adding new question...',
      success: editId ? 'Question updated!' : 'Question added!',
      error: 'Error saving question'
    }).then(() => {
      setModalOpen(false);
      setForm(defaultForm);
      setEditId(null);
      loadRows();
    });
  };

  const deleteRow = (id, questionText) => {
    if (!window.confirm(`Are you sure you want to delete:\n"${questionText}"?`)) return;
    
    toast.promise(
      axios.delete(`https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/quiz/${id}`, authHeaders()),
      { loading: 'Deleting question...', success: 'Question deleted!', error: 'Error deleting question' }
    ).then(loadRows);
  };

  useEffect(() => { loadRows(); }, []);

  // Enhanced search function with fuzzy matching and word-based search
  const searchQuestions = useCallback((questions, term) => {
    if (!term || !term.trim()) return questions;
    
    const searchTerm = term.toLowerCase().trim();
    const searchWords = searchTerm.split(' ').filter(word => word.length > 2); // Only words with 3+ chars
    
    if (debugMode) {
      console.log('🔍 Searching for:', `"${searchTerm}"`);
      console.log('🔍 Search words:', searchWords);
      console.log('📊 Total questions to search:', questions.length);
    }
    
    const results = questions.filter((q, index) => {
      try {
        // More robust null/undefined checking
        const questionText = q.question ? String(q.question).toLowerCase().trim() : '';
        const options = q.options || [];
        const optionsText = Array.isArray(options) 
          ? options.map(opt => opt ? String(opt).toLowerCase().trim() : '').join(' ')
          : '';
        
        // Combine all searchable text
        const allText = `${questionText} ${optionsText}`;
        
        if (debugMode) {
          console.log(`\n--- Question ${index + 1} ---`);
          console.log('Question:', questionText);
          console.log('Options:', options);
          console.log('Combined text:', allText);
        }
        
        // Try exact phrase match first
        const exactMatch = allText.includes(searchTerm);
        
        // Try word-based matching (all words must be found)
        const wordMatch = searchWords.length > 0 && searchWords.every(word => allText.includes(word));
        
        // Try partial word matching (at least one word must be found)
        const partialMatch = searchWords.length > 0 && searchWords.some(word => allText.includes(word));
        
        const finalMatch = exactMatch || wordMatch || (searchWords.length === 1 && partialMatch);
        
        if (debugMode) {
          console.log('Exact match:', exactMatch);
          console.log('Word match (all):', wordMatch);
          console.log('Partial match (some):', partialMatch);
          console.log('Final match:', finalMatch);
        }
        
        return finalMatch;
        
      } catch (error) {
        console.error('Search error for question:', q, error);
        return false;
      }
    });
    
    if (debugMode) {
      console.log('🎯 Search results count:', results.length);
    }
    
    return results;
  }, [debugMode]);

  // Filter by language and search term
  const filteredRows = React.useMemo(() => {
    const langFiltered = rows.filter(q => q.language === activeLang);
    return searchQuestions(langFiltered, searchTerm);
  }, [rows, activeLang, searchTerm, searchQuestions]);

  // Reset to first page when search term or language changes
  useEffect(() => {
    setCurrentPage(prev => ({ ...prev, [activeLang]: 1 }));
  }, [searchTerm, activeLang]);

  const indexOfLastRow = currentPage[activeLang] * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredRows.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

  const changePage = (p) => setCurrentPage((prev) => ({ ...prev, [activeLang]: p }));

  const clearSearch = () => {
    setSearchTerm('');
  };

  // Highlight search terms in text
  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  };

  return (
    <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 min-h-screen">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-purple-900">Quiz Questions</h1>
          <p className="text-purple-600">
            {filteredRows.length} {activeLang} questions
            {searchTerm && (
              <span className="text-purple-500">
                {' '}(filtered from {rows.filter(q => q.language === activeLang).length})
              </span>
            )}
          </p>
        </div>

        <div className="flex justify-between sm:flex-row gap-3 w-full sm:w-auto">
          {/* Language Tabs */}
          <div className="flex bg-purple-100 rounded-lg p-1">
            {['English', 'Sinhala'].map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeLang === lang
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-purple-600 hover:bg-purple-50'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Add Question Button */}
          <button
            onClick={() => {
              setForm(defaultForm);
              setEditId(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm"
          >
            <PlusCircle size={18} />
            Add Question
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={20} className="text-purple-400" />
          </div>
          <input
            type="text"
            placeholder="Search questions or options..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-400 hover:text-purple-600"
            >
              <X size={20} />
            </button>
          )}
        </div>
        
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center gap-4">
            {searchTerm && (
              <p className="text-sm text-purple-600">
                Searching for: "<span className="font-medium">{searchTerm}</span>"
              </p>
            )}
            
            {/* Debug Toggle Button */}
            <button
              onClick={() => setDebugMode(!debugMode)}
              className={`text-xs px-2 py-1 rounded ${
                debugMode ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {debugMode ? 'Debug ON' : 'Debug OFF'}
            </button>
          </div>
          
          {/* Search Tips */}
          {searchTerm && filteredRows.length === 0 && (
            <div className="text-xs text-purple-500 bg-purple-50 p-2 rounded-lg">
              <p className="font-medium mb-1">Search tips:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Try shorter keywords (e.g., "accounting", "environmental")</li>
                <li>Check for typos in your search term</li>
                <li>Search for key words from the question or options</li>
                <li>Use partial phrases instead of full sentences</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Questions List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {currentRows.length > 0 ? (
            currentRows.map((q, idx) => (
              <div
                key={q._id || idx}
                className="bg-white border border-purple-100 rounded-xl shadow-sm hover:shadow-md transition p-6 relative"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 flex items-center justify-center bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      {indexOfFirstRow + idx + 1}
                    </span>
                    <h3 className="text-lg font-semibold text-purple-900 break-words">
                      {searchTerm ? (
                        <span
                          dangerouslySetInnerHTML={{
                            __html: highlightSearchTerm(q.question || '', searchTerm)
                          }}
                        />
                      ) : (
                        q.question || 'No question text'
                      )}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const editForm = { ...q };
                        if (!editForm.options || editForm.options.length < 5) {
                          editForm.options = [...(editForm.options || []), ...Array(5 - (editForm.options?.length || 0)).fill('')];
                        }
                        setForm(editForm);
                        setEditId(q._id);
                        setModalOpen(true);
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
                  {(q.options || []).map((opt, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-3 p-2 rounded-lg ${
                        i === q.answer ? 'bg-green-50 border border-green-100' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 flex items-center justify-center rounded-full ${
                          i === q.answer 
                            ? 'bg-green-500 text-white' 
                            : 'bg-purple-100 text-purple-800'
                        } font-medium text-sm`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        {i === q.answer && (
                          <CheckCircle size={16} className="text-green-500" />
                        )}
                      </div>
                      <span className="flex-1 break-words">
                        {searchTerm && opt ? (
                          <span
                            dangerouslySetInnerHTML={{
                              __html: highlightSearchTerm(opt, searchTerm)
                            }}
                          />
                        ) : (
                          opt || 'Empty option'
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl border border-purple-100 p-8 text-center">
              <p className="text-purple-600">
                {searchTerm 
                  ? `No ${activeLang} questions or options found matching "${searchTerm}". Try a different search term.`
                  : `No ${activeLang} questions found. Click "Add Question" to create one.`
                }
              </p>
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="mt-2 text-purple-500 hover:text-purple-700 underline"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {filteredRows.length > rowsPerPage && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
          <div className="text-sm text-purple-600">
            Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredRows.length)} of {filteredRows.length} questions
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => changePage(Math.max(currentPage[activeLang] - 1, 1))}
              disabled={currentPage[activeLang] === 1}
              className="p-2 bg-white border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 disabled:opacity-50 transition"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-3 py-1 bg-white border border-purple-200 rounded-lg text-purple-700 text-sm">
              Page {currentPage[activeLang]} of {totalPages}
            </span>
            <button
              onClick={() => changePage(Math.min(currentPage[activeLang] + 1, totalPages))}
              disabled={currentPage[activeLang] === totalPages}
              className="p-2 bg-white border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 disabled:opacity-50 transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-purple-900">
                {editId ? 'Edit Question' : 'Add New Question'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  Question Text
                </label>
                <textarea
                  className="w-full border border-purple-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[100px]"
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  placeholder="Enter the question..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  Language
                </label>
                <select
                  className="w-full border border-purple-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                >
                  <option value="English">English</option>
                  <option value="Sinhala">Sinhala</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700 mb-2">
                  Options (select the correct answer)
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
                      <span className="text-sm font-medium text-purple-700 min-w-[20px]">
                        {String.fromCharCode(65 + i)}:
                      </span>
                      <input
                        type="text"
                        className="flex-1 border border-purple-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
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
                onClick={() => setModalOpen(false)}
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