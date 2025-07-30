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

  const fetchPdfs = async () => {
    try {
      const response = await axios.get(API_BASE_URL, axiosConfig);
      setPdfs(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      setPdfs([]);
    }
  };

  useEffect(() => {
    fetchPdfs();
  }, []);

  const handleUpload = async () => {
    if (!file || !identifier) return;

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('identifier', identifier);

    try {
      setUploading(true);
      await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        onUploadProgress: progressEvent => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      setFile(null);
      setIdentifier('');
      setUploadProgress(0);
      setUploading(false);
      fetchPdfs();
    } catch (error) {
      console.error('Upload failed:', error);
      setUploading(false);
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
