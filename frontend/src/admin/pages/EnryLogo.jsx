import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EntryLogoManager = () => {
  const [logoUrl, setLogoUrl] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = 'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin';

  /* ------------------------------------------------
     Helper – return { headers:{…} } or null on error
     ------------------------------------------------ */
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found. Please login again.');
      return null;
    }
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  /* ------------------------------------------------
     Fetch current logo once
     ------------------------------------------------ */
  useEffect(() => {
    const fetchLogo = async () => {
      const auth = getAuthHeaders();
      if (!auth) return;
      try {
        setError('');
        const res = await axios.get(`${API_BASE}/logo`, auth);
        setLogoUrl(res.data.logo?.url || '');
      } catch (err) {
        console.error('Fetch logo error:', err);
        if (err.response?.status === 401) {
          setError('Unauthorized. Please log in again.');
        } else if (err.response?.status !== 404) {
          setError(`Failed to fetch logo: ${err.response?.data?.message || err.message}`);
        }
        setLogoUrl('');
      }
    };
    fetchLogo();
  }, []);

  /* ------------------------------------------------
     File input change
     ------------------------------------------------ */
  const onFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
  };

  /* ------------------------------------------------
     Upload (POST) or update (PUT)
     ------------------------------------------------ */
  const uploadOrUpdateLogo = async () => {
    if (!file) return alert('Please select a file.');

    const auth = getAuthHeaders();
    if (!auth) return;

    const formData = new FormData();
    formData.append('logo', file);

    setLoading(true);
    setError('');

    try {
      const method = logoUrl ? 'put' : 'post';         // decide by URL
      const res = await axios[method](
        `${API_BASE}/logo`,
        formData,
        {
          headers: {
            ...auth.headers,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setLogoUrl(res.data.logo.url);
      alert(`Logo ${logoUrl ? 'updated' : 'uploaded'} successfully!`);
    } catch (err) {
      console.error('Upload/update error:', err);
      if (err.response?.status === 401) {
        setError('Unauthorized. Please log in again.');
      } else {
        setError(`Operation failed: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setLoading(false);
      setFile(null);
      // reset the file input
      const input = document.querySelector('input[type="file"]');
      if (input) input.value = '';
    }
  };

  /* ------------------------------------------------
     Delete logo
     ------------------------------------------------ */
  const deleteLogo = async () => {
    if (!logoUrl) return;
    if (!window.confirm('Are you sure you want to delete the logo?')) return;

    const auth = getAuthHeaders();
    if (!auth) return;

    setLoading(true);
    setError('');

    try {
      await axios.delete(`${API_BASE}/logo`, auth);
      setLogoUrl('');
      alert('Logo deleted successfully!');
    } catch (err) {
      console.error('Delete logo error:', err);
      if (err.response?.status === 401) {
        setError('Unauthorized. Please log in again.');
      } else {
        setError(`Delete failed: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------
     JSX
     ------------------------------------------------ */
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
          <p className="mb-2 font-semibold">Current Logo Preview:</p>
          <img
            src={logoUrl}
            alt="Entry Logo"
            className="max-w-full h-auto rounded shadow"
            onError={(e) => {
              console.error('Logo image failed to load:', logoUrl);
              e.target.style.display = 'none';
            }}
          />
        </div>
      ) : (
        <p className="mb-4 italic text-gray-600">No logo uploaded yet.</p>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={onFileChange}
        disabled={loading}
        className="mb-4 w-full p-2 border border-gray-300 rounded"
      />

      <div className="flex gap-3">
        <button
          onClick={uploadOrUpdateLogo}
          disabled={loading || !file}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Processing…' : (logoUrl ? 'Update Logo' : 'Upload Logo')}
        </button>

        {logoUrl && (
          <button
            onClick={deleteLogo}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Processing…' : 'Delete Logo'}
          </button>
        )}
      </div>
    </div>
  );
};

export default EntryLogoManager;
