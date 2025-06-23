// src/admin/pages/EntryLogoPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { X } from 'lucide-react';

const api = axios.create({
  baseURL: 'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin',
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export default function EntryLogoPage() {
  const [logoUrl, setLogoUrl] = useState('');
  const [file, setFile] = useState(null);
  const [open, setOpen] = useState(false);

  // Load logo on mount
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/logo');
        setLogoUrl(data.logo?.url || '');
      } catch (err) {
        if (err.response?.status !== 404) toast.error('Failed to load logo');
      }
    };
    load();
  }, []);

  const onFileChange = (e) => setFile(e.target.files[0]);

  const save = async () => {
    if (!file) return toast.error('Please choose a logo image');

    const formData = new FormData();
    formData.append('logo', file);

    const method = logoUrl ? 'put' : 'post';
    toast.promise(
      api[method]('/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
      { loading: 'Saving…', success: 'Saved', error: 'Error' }
    ).then(res => {
      setLogoUrl(res.data.logo.url);
      setOpen(false);
      setFile(null);
    });
  };

  const del = async () => {
    if (!window.confirm('Delete the logo?')) return;
    toast.promise(
      api.delete('/logo'),
      { loading: 'Deleting…', success: 'Deleted', error: 'Error' }
    ).then(() => setLogoUrl(''));
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Toaster position="top-center" />

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Entry Logo</h2>

        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {logoUrl ? 'Edit' : 'Upload'}
        </button>
      </div>

      <div className="bg-white p-6 rounded shadow">
        {logoUrl ? (
          <div className="space-y-4">
            <img
              src={logoUrl}
              alt="Logo"
              className="max-w-xs h-auto rounded border"
              onError={(e) => {
                e.target.style.display = 'none';
                toast.error('Image not found');
              }}
            />
            <div>
              <button
                onClick={() => setOpen(true)}
                className="mr-4 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Edit
              </button>
              <button
                onClick={del}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-600 italic">No logo uploaded yet.</p>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Upload Logo</h3>
              <button onClick={() => setOpen(false)}><X size={20} /></button>
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="w-full border rounded px-2 py-1"
            />

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
