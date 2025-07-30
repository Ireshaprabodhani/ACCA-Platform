import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/pdf';

const PdfAdminDashboard = () => {
  const [pdfs, setPdfs] = useState([]);
  const [file, setFile] = useState(null);
  const [identifier, setIdentifier] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editPdfId, setEditPdfId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const token = localStorage.getItem('adminToken');

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    }
  };

  const fetchPDFs = async () => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    console.warn('No admin token found');
    return;
  }

  try {
    const res = await axios.get(
      'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/pdf',
      {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Important
        },
      }
    );
    setPdfList(res.data.pdfs);
  } catch (err) {
    console.error('Error fetching PDFs:', err);
    alert('Fetch failed: ' + (err.response?.data?.error || err.message));
  }
};


  useEffect(() => {
    fetchPdfs();
  }, []);

  const handleUpload = async () => {
  if (!pdfFile) return alert('Please select a PDF file');

  const token = localStorage.getItem('adminToken');
  if (!token) return alert('Admin not logged in');

  const formData = new FormData();
  formData.append('pdf', pdfFile);
  formData.append('title', title);
  formData.append('description', description);
  formData.append('schoolName', selectedSchool); // if needed

  try {
    await axios.post(
      'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/pdf',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`, // ✅ SEND TOKEN HERE
        },
      }
    );
    alert('PDF uploaded successfully');
    fetchPDFs(); // refresh list
    resetForm(); // optional
  } catch (err) {
    console.error('Upload error:', err);
    alert('Upload failed: ' + (err.response?.data?.error || err.message));
  }
};

  const handleUpdate = async () => {
    try {
      await axios.put(`${API_BASE_URL}/${editPdfId}`, {
        title: editTitle,
        description: editDescription
      }, axiosConfig);

      setEditPdfId(null);
      setEditTitle('');
      setEditDescription('');
      fetchPdfs();
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleDelete = async (pdfId) => {
    try {
      await axios.delete(`${API_BASE_URL}/${pdfId}`, axiosConfig);
      fetchPdfs();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <div className="pdf-dashboard">
      <h1>PDF Admin Dashboard</h1>

      <div className="upload-form">
        <input type="file" onChange={e => setFile(e.target.files[0])} />
        <input
          type="text"
          placeholder="Identifier (unique)"
          value={identifier}
          onChange={e => setIdentifier(e.target.value)}
        />
        <button onClick={handleUpload} disabled={uploading}>
          {uploading ? `Uploading (${uploadProgress}%)...` : 'Upload PDF'}
        </button>
      </div>

      <h2>Uploaded PDFs</h2>
      <ul>
        {pdfs.map(pdf => (
          <li key={pdf._id}>
            <strong>{pdf.originalName}</strong> (ID: {pdf.identifier})
            {pdf.title && <> - {pdf.title}</>}
            <br />
            <a href={`https://pc3mcwztgh.ap-south-1.awsapprunner.com/${pdf.path}`} target="_blank" rel="noreferrer">
              View / Download
            </a>
            <button onClick={() => {
              setEditPdfId(pdf._id);
              setEditTitle(pdf.title || '');
              setEditDescription(pdf.description || '');
            }}>
              Edit
            </button>
            <button onClick={() => handleDelete(pdf._id)}>Delete</button>
          </li>
        ))}
      </ul>

      {editPdfId && (
        <div className="edit-form">
          <h3>Edit PDF Details</h3>
          <input
            type="text"
            placeholder="Title"
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
          />
          <textarea
            placeholder="Description"
            value={editDescription}
            onChange={e => setEditDescription(e.target.value)}
          />
          <button onClick={handleUpdate}>Save</button>
          <button onClick={() => setEditPdfId(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default PdfAdminDashboard;
