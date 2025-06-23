import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE = 'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin';

export default function EntryLogoManager() {
  const [logoUrl, setLogoUrl] = useState('');
  const [logoId, setLogoId]   = useState('');
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const fileInputRef          = useRef(null);   // to open file dialog on “Edit”

  /* ------------ auth helper ------------------ */
  const getAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No auth token – please log in again.');
      return null;
    }
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  /* ------------ initial fetch ---------------- */
  useEffect(() => {
    const fetchLogo = async () => {
      const auth = getAuth();
      if (!auth) return;
      try {
        const { data } = await axios.get(`${API_BASE}/logo`, auth);
        if (data.logo) {
          setLogoUrl(data.logo.url);
          setLogoId(data.logo._id);
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error(err);
          setError(err.response?.data?.message || err.message);
        }
      }
    };
    fetchLogo();
  }, []);

  /* ------------ file select ------------------- */
  const handleFileSelect = (e) => {
    setFile(e.target.files[0]);
    setError('');
  };

  /* ------------ upload OR update -------------- */
  const saveLogo = async () => {
    if (!file) return alert('Choose an image first.');
    const auth = getAuth();
    if (!auth) return;

    const fd = new FormData();
    fd.append('logo', file);

    setLoading(true);
    setError('');
    try {
      let res;
      if (logoId) {
        /* replace existing */
        res = await axios.put(`${API_BASE}/logo/${logoId}`, fd, auth);
        alert('Logo updated.');
      } else {
        /* first-time upload */
        res = await axios.post(`${API_BASE}/logo`, fd, auth);
        alert('Logo uploaded.');
      }
      setLogoUrl(res.data.logo.url);
      setLogoId(res.data.logo._id);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* ------------ delete ------------------------ */
  const deleteLogo = async () => {
    if (!logoId) return;
    if (!window.confirm('Delete the current logo?')) return;

    const auth = getAuth();
    if (!auth) return;

    setLoading(true);
    setError('');
    try {
      await axios.delete(`${API_BASE}/logo/${logoId}`, auth);
      setLogoUrl('');
      setLogoId('');
      alert('Logo deleted.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ------------ JSX -------------------------- */
  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h2 className="text-2xl font-bold mb-4">Entry Logo Manager</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {logoUrl ? (
        <div className="mb-4">
          <p className="mb-2 font-semibold">Current Logo:</p>
          <img
            src={logoUrl}
            alt="Entry logo"
            className="max-w-full h-auto rounded shadow"
            onError={(e) => {
              e.target.style.display = 'none';
              setError('Image not found on server.');
            }}
          />
        </div>
      ) : (
        <p className="mb-4 italic text-gray-600">No logo uploaded.</p>
      )}

      {/* hidden file input, opened by “Edit” button */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileSelect}
        hidden
      />

      {/* action buttons */}
      <div className="flex gap-3">
        {/* EDIT / UPLOAD */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
        >
          {logoId ? 'Edit Logo' : 'Upload Logo'}
        </button>

        {/* SAVE — appears only after a file is chosen */}
        {file && (
          <button
            onClick={saveLogo}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save'}
          </button>
        )}

        {/* DELETE */}
        {logoId && (
          <button
            onClick={deleteLogo}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        )}
      </div>
    </div>
  );
}
