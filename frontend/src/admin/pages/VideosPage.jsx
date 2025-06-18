// src/admin/pages/VideosPage.jsx
import React, { useEffect, useState } from 'react';
import axios              from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { PlusCircle, X }  from 'lucide-react';

/* ------------ config ------------ */
const TYPES      = ['intro', 'case'];        // add more types here if needed
const BLANK_FORM = { type: 'intro', url: '' };

const api = axios.create({
  baseURL : 'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin',
  headers : { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } // admin token
});

export default function VideosPage () {
  /* ✨ state */
  const [rows,  setRows]  = useState([]);   // [{ type, url }]
  const [form,  setForm]  = useState(BLANK_FORM);
  const [open,  setOpen]  = useState(false);

  /* ------------ helpers ------------ */
  const loadRows = async () => {
    const list = [];
    for (const type of TYPES) {
      try {
        const { data } = await api.get(`/video/${type}`);
        list.push(data);                            // { _id, type, url }
      } catch (err) {
        if (err.response?.status !== 404) toast.error('Load error');
        else list.push({ type, url: '' });          // placeholder if none
      }
    }
    setRows(list);
  };

  const save = async () => {
    if (!form.url.trim()) return toast.error('Paste the video URL');
    toast.promise(api.post('/video', form),
      { loading: 'Saving…', success: 'Saved', error: 'Error' }
    ).then(() => {
      setOpen(false);
      setForm(BLANK_FORM);
      loadRows();
    });
  };

  const del = (type) =>
    window.confirm('Delete this video?') &&
    toast.promise(api.delete(`/video/${type}`),
      { loading: 'Deleting…', success: 'Deleted', error: 'Error' }
    ).then(loadRows);

  /* on mount */
  useEffect(() => { loadRows(); }, []);

  /* 💡 NEW: are all videos already present? */
  const hasAllVideos = rows.length && rows.every(v => v.url);

  /* ------------ UI ------------ */
  return (
    <div className="max-w-3xl mx-auto p-6">
      <Toaster position="top-center" />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Videos</h2>

        {/* Add / Replace button – now disabled when both videos exist */}
        <button
          disabled={hasAllVideos}
          onClick={() => { setForm(BLANK_FORM); setOpen(true); }}
          className={`flex items-center gap-1 px-4 py-2 rounded-lg transition
            ${hasAllVideos
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'}
          `}
          title={hasAllVideos ? 'Both videos already set' : 'Add or replace a video'}
        >
          <PlusCircle size={18} />
          Add / Replace
        </button>
      </div>

      {/* table */}
      <div className="overflow-auto bg-white shadow rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">URL / Preview</th>
              <th className="px-3 py-2 text-center w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(v => (
              <tr key={v.type} className="border-t">
                <td className="px-3 py-2 capitalize">{v.type}</td>
                <td className="px-3 py-2">
                  {v.url
                    ? <a href={v.url} target="_blank" rel="noopener noreferrer"
                         className="text-blue-700 underline break-all">{v.url}</a>
                    : <span className="text-gray-400 italic">— not set —</span>}
                </td>
                <td className="px-3 py-2 text-center space-x-3">
                  <button
                    onClick={() => { setForm({ type: v.type, url: v.url }); setOpen(true); }}
                    className="text-blue-600 hover:underline"
                  >
                    {v.url ? 'Edit' : 'Add'}
                  </button>
                  {v.url && (
                    <button
                      onClick={() => del(v.type)}
                      className="text-red-600 hover:underline"
                    >
                      Del
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Save video</h3>
              <button onClick={() => setOpen(false)}><X size={20} /></button>
            </div>

            <label className="block text-sm">
              Type
              <select
                className="w-full mt-1 border rounded px-2 py-1"
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
              >
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </label>

            <label className="block text-sm">
              Video URL
              <input
                className="w-full mt-1 border rounded px-2 py-1"
                placeholder="https://youtu.be/…"
                value={form.url}
                onChange={e => setForm({ ...form, url: e.target.value })}
              />
            </label>

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={save}
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
