// src/admin/pages/EntryLogoPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { X } from 'lucide-react';

const api = axios.create({
  baseURL: 'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin',
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export default function EntryLogoPage() {
  /* --------------------------------------------------
     state
  -------------------------------------------------- */
  const [logoUrl, setLogoUrl] = useState('');
  const [logoId, setLogoId]   = useState('');
  const [file,    setFile]    = useState(null);
  const [open,    setOpen]    = useState(false);
  const fileInput              = useRef(null);

  /* --------------------------------------------------
     fetch latest logo on mount
  -------------------------------------------------- */
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/logo');         // GET latest
        if (data.logo) {
          setLogoUrl(data.logo.url);
          setLogoId(data.logo._id);
        }
      } catch (err) {
        if (err.response?.status !== 404)
          toast.error(err.response?.data?.message || 'Load error');
      }
    };
    load();
  }, []);

  /* --------------------------------------------------
     handlers
  -------------------------------------------------- */
  const choose = () => fileInput.current?.click();
  const onFile = (e) => setFile(e.target.files[0]);

  const save = async () => {
    if (!file) return toast.error('Pick an image first');

    const fd = new FormData();
    fd.append('logo', file);

    const method = logoId ? 'put' : 'post';
    const url    = logoId ? `/logo/${logoId}` : '/logo';

    toast.promise(
      api[method](url, fd, { headers: {} }),           // axios sets content‑type
      { loading: 'Saving…', success: 'Saved', error: 'Error' }
    ).then((res) => {
      setLogoUrl(res.data.logo.url);
      setLogoId(res.data.logo._id);
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
      setOpen(false);
    });
  };

  const del = () =>
    window.confirm('Delete the logo?') &&
    toast.promise(
      api.delete(`/logo/${logoId}`),
      { loading: 'Deleting…', success: 'Deleted', error: 'Error' }
    ).then(() => {
      setLogoUrl('');
      setLogoId('');
    });

  /* --------------------------------------------------
     UI
  -------------------------------------------------- */
  return (
    <div className="max-w-3xl mx-auto p-6">
      <Toaster position="top-center" />

      {/* header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Entry Logo</h2>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {logoUrl ? 'Edit / Replace' : 'Upload'}
        </button>
      </div>

      {/* preview card */}
      <div className="bg-white p-6 rounded shadow">
        {logoUrl ? (
          <>
            <img
              src={logoUrl}
              alt="Logo"
              className="max-w-xs h-auto rounded border mb-4"
              onError={(e) => {
                e.target.style.display = 'none';
                toast.error('Image not on server');
              }}
            />
            <button
              onClick={del}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete Logo
            </button>
          </>
        ) : (
          <p className="text-gray-600 italic">No logo uploaded.</p>
        )}
      </div>

      {/* modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Choose Logo</h3>
              <button onClick={() => setOpen(false)}><X size={20} /></button>
            </div>

            <input
              type="file"
              accept="image/*"
              ref={fileInput}
              onChange={onFile}
              className="w-full border rounded px-2 py-1"
            />

            {file && <p className="text-sm text-gray-600 break-all">{file.name}</p>}

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >Cancel</button>
              <button
                onClick={save}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
