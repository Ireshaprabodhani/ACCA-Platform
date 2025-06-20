import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EntryLogoManager = () => {
  const [logoUrl, setLogoUrl] = useState('');
  const [logoId, setLogoId] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = 'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin';

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found. Please login again.');
      return null;
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    };
  };

  // 🔹 Fetch the existing logo
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        setError('');
        const authHeaders = getAuthHeaders();
        if (!authHeaders) return;

        console.log('Fetching logo with headers:', authHeaders);
        
        const res = await axios.get(`${API_BASE}/logo`, authHeaders);

        if (res.data.logo) {
          setLogoUrl(res.data.logo.url);
          setLogoId(res.data.logo._id);
        }
      } catch (error) {
        console.error('Failed to fetch logo:', error);
        if (error.response?.status === 401) {
          setError('Unauthorized. Please check your login credentials.');
        } else {
          setError(`Failed to fetch logo: ${error.response?.data?.message || error.message}`);
        }
        setLogoUrl('');
        setLogoId('');
      }
    };

    fetchLogo();
  }, []);

  // 🔹 Handle file selection
  const onFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(''); // Clear any previous errors
  };

  // 🔹 Upload or update logo
  const uploadOrUpdateLogo = async () => {
    if (!file) return alert('Please select a file.');

    setLoading(true);
    setError('');

    const authHeaders = getAuthHeaders();
    if (!authHeaders) {
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('logo', file);

    try {
      let res;
      
      if (logoId) {
        // UPDATE existing logo
        res = await axios.put(
          `${API_BASE}/logo/${logoId}`,
          formData,
          {
            headers: {
              ...authHeaders.headers,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        alert('Logo updated successfully!');
      } else {
        // UPLOAD new logo
        res = await axios.post(
          `${API_BASE}/logo`,
          formData,
          {
            headers: {
              ...authHeaders.headers,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        setLogoId(res.data.logo._id);
        alert('Logo uploaded successfully!');
      }
      
      setLogoUrl(res.data.logo.url);
    } catch (error) {
      console.error('Upload failed:', error);
      if (error.response?.status === 401) {
        setError('Unauthorized. Please check your login credentials.');
      } else {
        setError(`Upload failed: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
      setFile(null);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
    }
  };

  // 🔹 Delete logo
  const deleteLogo = async () => {
    if (!logoId) return;
    if (!window.confirm('Are you sure you want to delete the logo?')) return;

    setLoading(true);
    setError('');

    const authHeaders = getAuthHeaders();
    if (!authHeaders) {
      setLoading(false);
      return;
    }

    try {
      await axios.delete(`${API_BASE}/logo/${logoId}`, authHeaders);
      setLogoUrl('');
      setLogoId('');
      alert('Logo deleted successfully!');
    } catch (error) {
      console.error('Delete failed:', error);
      if (error.response?.status === 401) {
        setError('Unauthorized. Please check your login credentials.');
      } else {
        setError(`Delete failed: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

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
              console.error('Image failed to load:', logoUrl);
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
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : (logoId ? 'Update Logo' : 'Upload Logo')}
        </button>

        {logoId && (
          <button
            onClick={deleteLogo}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Delete Logo'}
          </button>
        )}
      </div>

      {loading && <p className="mt-3 text-gray-500">Processing...</p>}
    </div>
  );
};

export default EntryLogoManager;