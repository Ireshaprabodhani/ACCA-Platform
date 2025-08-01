import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const API_BASE_URL = 'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/pdf';

const PdfAdminDashboard = () => {
  const [pdfs, setPdfs] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editPdfId, setEditPdfId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const token = localStorage.getItem('token');

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchPDFs = () => {
    if (!token) return toast.error('Admin not logged in');

    axios
      .get(API_BASE_URL, axiosConfig)
      .then((res) => setPdfs(res.data.pdfs || res.data))
      .catch(() => toast.error('Failed to fetch PDFs'));
  };

  useEffect(() => {
    fetchPDFs();
  }, []);

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a PDF file');
    if (!token) return toast.error('Admin not logged in');

    const formData = new FormData();
    formData.append('pdf', file);

    setUploading(true);
    try {
      await axios.post(API_BASE_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (e) => {
          const percent = Math.round((e.loaded * 100) / e.total);
          setUploadProgress(percent);
        },
      });
      toast.success('PDF uploaded successfully');
      setFile(null);
      fetchPDFs();
    } catch (err) {
      toast.error('Upload failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUpdate = async () => {
    if (!editPdfId) return;
    try {
      await axios.put(
        `${API_BASE_URL}/${editPdfId}`,
        { title: editTitle, description: editDescription },
        axiosConfig
      );
      toast.success('PDF details updated');
      setEditPdfId(null);
      setEditTitle('');
      setEditDescription('');
      fetchPDFs();
    } catch (err) {
      toast.error('Failed to update PDF');
    }
  };

  const handleDelete = async (pdfId) => {
    if (!window.confirm('Are you sure you want to delete this PDF?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/${pdfId}`, axiosConfig);
      toast.success('PDF deleted');
      fetchPDFs();
    } catch (err) {
      toast.error('Failed to delete PDF');
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 min-h-screen">
      <Toaster position="top-center" />

      <h1 className="text-3xl font-bold mb-6 text-purple-900">PDF Admin Dashboard</h1>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
          className="border rounded px-3 py-2"
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {uploading ? `Uploading (${uploadProgress}%)...` : 'Upload PDF'}
        </button>
      </div>

      <h2 className="text-2xl font-semibold mb-4 text-purple-800">Uploaded PDFs</h2>
      <ul className="space-y-3">
        {pdfs.length === 0 && <p className="text-purple-600">No PDFs uploaded yet.</p>}
        {pdfs.map((pdf) => (
          <li
            key={pdf._id}
            className="bg-white p-4 rounded shadow flex justify-between items-center border border-purple-100"
          >
            <div>
              <strong className="text-purple-900">{pdf.originalName}</strong>
              {pdf.title && <span> - {pdf.title}</span>}
              <br />
              <a
                href={`https://pc3mcwztgh.ap-south-1.awsapprunner.com${pdf.path}`}
                target="_blank"
                rel="noreferrer"
              >
                View / Download
              </a>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditPdfId(pdf._id);
                  setEditTitle(pdf.title || '');
                  setEditDescription(pdf.description || '');
                }}
                className="bg-yellow-400 px-3 py-1 rounded hover:bg-yellow-500 text-white"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(pdf._id)}
                className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 text-white"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {editPdfId && (
        <div className="mt-6 p-4 border border-purple-300 rounded shadow bg-white max-w-lg">
          <h3 className="text-xl font-semibold mb-3 text-purple-900">Edit PDF Details</h3>
          <input
            type="text"
            placeholder="Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3"
          />
          <textarea
            placeholder="Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3 resize-y"
            rows={4}
          />
          <div className="flex gap-3">
            <button
              onClick={handleUpdate}
              className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 text-white"
            >
              Save
            </button>
            <button
              onClick={() => setEditPdfId(null)}
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfAdminDashboard;
