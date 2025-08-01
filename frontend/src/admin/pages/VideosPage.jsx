// src/admin/pages/VideosPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { PlusCircle, X, PlayCircle, Edit2, Trash2, ExternalLink } from 'lucide-react';

/* ------------ config ------------ */
const TYPES = [
  { value: 'intro', label: 'Introduction Video' },
  { value: 'case', label: 'Case Study Video' }
];
const BLANK_FORM = { type: TYPES[0].value, url: '' };

const api = axios.create({
  baseURL: 'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin',
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export default function VideosPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(BLANK_FORM);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ------------ helpers ------------ */
  const loadRows = async () => {
    setLoading(true);
    const list = [];
    for (const type of TYPES) {
      try {
        const { data } = await api.get(`/video/${type.value}`);
        list.push(data);
      } catch (err) {
        if (err.response?.status !== 404) toast.error('Load error');
        else list.push({ type: type.value, url: '' });
      }
    }
    setRows(list);
    setLoading(false);
  };

  const save = async () => {
    if (!form.url.trim()) return toast.error('Please enter a valid video URL');
    
    try {
      toast.loading('Saving...');
      await api.post('/video', form);
      toast.success('Video saved successfully');
      setOpen(false);
      setForm(BLANK_FORM);
      loadRows();
    } catch (error) {
      toast.error('Failed to save video');
    } finally {
      toast.dismiss();
    }
  };

  const del = async (type) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    
    try {
      toast.loading('Deleting...');
      await api.delete(`/video/${type}`);
      toast.success('Video deleted');
      loadRows();
    } catch (error) {
      toast.error('Failed to delete video');
    } finally {
      toast.dismiss();
    }
  };

  const extractVideoId = (url) => {
    // Extract YouTube ID from various URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  useEffect(() => { loadRows(); }, []);

  const hasAllVideos = rows.length && rows.every(v => v.url);

  /* ------------ UI ------------ */
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <Toaster position="top-center" />
      
      {/* Header with Add button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Video Management</h1>
          <p className="text-gray-600">Manage your introduction and case study videos</p>
        </div>
        
        <button
          onClick={() => { setForm(BLANK_FORM); setOpen(true); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all
            ${hasAllVideos
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}
          `}
          disabled={hasAllVideos}
        >
          <PlusCircle size={18} />
          Add Video
        </button>
      </div>

      {/* Video Cards Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rows.map(video => (
            <div key={video.type} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800 capitalize">
                      {TYPES.find(t => t.value === video.type)?.label || video.type}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {video.url ? 'Video configured' : 'No video added'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => { setForm({ type: video.type, url: video.url }); setOpen(true); }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    {video.url && (
                      <button
                        onClick={() => del(video.type)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {video.url ? (
                  <>
                    <div className="relative pt-[56.25%] bg-black rounded-lg overflow-hidden mb-3">
                      {extractVideoId(video.url) ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${extractVideoId(video.url)}`}
                          className="absolute top-0 left-0 w-full h-full"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title="Video preview"
                        />
                      ) : (
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-white">
                          <a href={video.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                            <PlayCircle size={24} />
                            <span>Play Video</span>
                          </a>
                        </div>
                      )}
                    </div>
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1 truncate"
                    >
                      <ExternalLink size={14} />
                      {video.url}
                    </a>
                  </>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-gray-400 mb-3">No video added</p>
                    <button
                      onClick={() => { setForm({ type: video.type, url: '' }); setOpen(true); }}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Add Video
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-pop-in">
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="text-xl font-semibold text-gray-800">
                {form.url ? 'Edit Video' : 'Add New Video'}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video Type</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                >
                  {TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Paste YouTube or video URL here"
                  value={form.url}
                  onChange={e => setForm({ ...form, url: e.target.value })}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Supports YouTube, Vimeo, and other embeddable video URLs
                </p>
              </div>

              {form.url && extractVideoId(form.url) && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  <div className="relative pt-[56.25%] bg-black rounded overflow-hidden">
                    <iframe
                      src={`https://www.youtube.com/embed/${extractVideoId(form.url)}`}
                      className="absolute top-0 left-0 w-full h-full"
                      frameBorder="0"
                      allowFullScreen
                      title="Video preview"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-5 border-t">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md"
              >
                Save Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}