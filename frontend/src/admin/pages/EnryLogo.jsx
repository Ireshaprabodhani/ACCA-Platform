import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EntryLogoManager = () => {
  const [logoUrl, setLogoUrl] = useState('');
  const [logoId, setLogoId] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token'); // Must be stored after login

  // 🔹 Fetch the existing logo
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await axios.get('https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/logo', {
           Authorization: `Bearer ${localStorage.getItem('token')}`,
        });

        setLogoUrl(res.data.logo.url);
        setLogoId(res.data.logo._id);
      } catch (error) {
        console.error('Failed to fetch logo:', error);
        setLogoUrl('');
        setLogoId('');
      }
    };

    fetchLogo();
  }, [token]);

  // 🔹 Handle file selection
  const onFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // 🔹 Upload or update logo
  const uploadOrUpdateLogo = async () => {
    if (!file) return alert('Please select a file.');

    setLoading(true);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      if (logoId) {
        // UPDATE existing logo
        const res = await axios.put(
          `https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/logo/${logoId}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setLogoUrl(res.data.logo.url);
        alert('Logo updated successfully!');
      } else {
        // UPLOAD new logo
        const res = await axios.post(
          'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/logo',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setLogoUrl(res.data.logo.url);
        setLogoId(res.data.logo._id);
        alert('Logo uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload or update logo.');
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  // 🔹 Delete logo
  const deleteLogo = async () => {
    if (!logoId) return;
    if (!window.confirm('Are you sure you want to delete the logo?')) return;

    setLoading(true);
    try {
      await axios.delete(
        `https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/logo/${logoId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setLogoUrl('');
      setLogoId('');
      alert('Logo deleted successfully!');
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete logo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h2 className="text-2xl font-bold mb-4">Entry Logo Manager</h2>

      {logoUrl ? (
        <div className="mb-4">
          <p className="mb-2 font-semibold">Current Logo Preview:</p>
          <img
            src={logoUrl}
            alt="Entry Logo"
            className="max-w-full h-auto rounded shadow"
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
        className="mb-4"
      />

      <div className="flex gap-3">
        <button
          onClick={uploadOrUpdateLogo}
          disabled={loading || !file}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {logoId ? 'Update Logo' : 'Upload Logo'}
        </button>

        {logoId && (
          <button
            onClick={deleteLogo}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            Delete Logo
          </button>
        )}
      </div>

      {loading && <p className="mt-3 text-gray-500">Processing...</p>}
    </div>
  );
};

export default EntryLogoManager;
