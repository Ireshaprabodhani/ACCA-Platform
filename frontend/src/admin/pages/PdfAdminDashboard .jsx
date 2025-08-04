import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const API_BASE_URL = 'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/pdf';

const PdfAdminDashboard = () => {
  const [pdfs, setPdfs] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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
      .then((res) => {
        const rawPdfs = res.data || [];
        const parsed = rawPdfs.map((pdf) => ({
          _id: pdf._id,
          title: pdf.title || '',
          description: pdf.description || '',
          originalName: pdf.originalName || pdf.filename,
        }));

        setPdfs(parsed);
      })
      .catch(() => toast.error('Failed to fetch PDFs'));
  };

  useEffect(() => {
    fetchPDFs();
  }, []);

  const handleUpload = async () => {
    if (!file || !title) return toast.error('File and title are required');
    if (!token) return toast.error('Admin not logged in');

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('title', title);
    formData.append('description', description);

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
      setTitle('');
      setDescription('');
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

  const handleViewPdf = (pdfId) => {
  if (!token) {
    toast.error('No authentication token found');
    return;
  }

  // Open PDF in new tab with auth token passed in URL
  const pdfUrl = `${API_BASE_URL}/view/${pdfId}?token=${token}`;
  const newWindow = window.open(pdfUrl, '_blank');

  if (!newWindow) {
    toast.error('Popup blocked. Please allow popups for this site.');
  }
};


  return (
    <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 min-h-screen">
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6 text-purple-900">PDF Admin Dashboard</h1>

      {/* Upload Section */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
          className="border rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border rounded px-3 py-2 md:col-span-2"
          rows={3}
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {uploading ? `Uploading (${uploadProgress}%)...` : 'Upload PDF'}
        </button>
      </div>

      {/* Uploaded List */}
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
              <button
                onClick={() => handleViewPdf(pdf._id)}
                className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
              >
                View / Download
              </button>
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

      {/* Edit Form */}
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
