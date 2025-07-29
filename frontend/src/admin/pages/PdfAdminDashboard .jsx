import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PdfAdminDashboard = () => {
  const [pdfs, setPdfs] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [newFile, setNewFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

 // Base API URL - Note the /pdfs (plural) to match your backend
  const API_BASE_URL = 'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/pdfs';

  // Fetch all PDFs
  useEffect(() => {
    fetchPdfs();
  }, []);

  const fetchPdfs = async () => {
    try {
      const response = await axios.get(API_BASE_URL);
      setPdfs(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      alert('Failed to fetch PDFs. Please check console for details.');
      setPdfs([]);
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    setNewFile(e.target.files[0]);
  };

  // Upload new PDF - using /upload endpoint
  const handleUpload = async () => {
    if (!newFile) {
      alert('Please select a PDF file first');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', newFile);

    try {
      setIsUploading(true);
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });
      
      setPdfs([...pdfs, response.data]);
      setNewFile(null);
      alert('PDF uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload PDF: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Update PDF title
  const handleUpdate = async () => {
    if (!selectedPdf) return;

    try {
      await axios.put(`${API_BASE_URL}/${selectedPdf._id}`, { 
        title: editTitle 
      });
      
      setPdfs(pdfs.map(pdf => 
        pdf._id === selectedPdf._id ? { ...pdf, title: editTitle } : pdf
      ));
      
      setIsEditModalOpen(false);
      alert('PDF updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
      alert(`Failed to update PDF: ${error.response?.data?.message || error.message}`);
    }
  };

  // Delete PDF
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this PDF?')) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/${id}`);
      setPdfs(pdfs.filter(pdf => pdf._id !== id));
      alert('PDF deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Failed to delete PDF: ${error.response?.data?.message || error.message}`);
    }
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">PDF Management Dashboard</h1>
      
      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Upload New PDF</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {newFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {newFile.name} ({(newFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
          <button
            onClick={handleUpload}
            disabled={!newFile || isUploading}
            className={`px-4 py-2 rounded-md text-white font-medium ${!newFile || isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload PDF'}
          </button>
        </div>
      </div>

      {/* PDF List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {pdfs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No PDFs found. Upload a PDF to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pdfs.map((pdf) => (
                  <tr key={pdf._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {pdf.title || 'Untitled'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pdf.originalName || pdf.filename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(pdf.size / 1024).toFixed(2)} KB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(pdf.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <a
                          href={`${API_BASE_URL.replace('/admin', '')}/pdf/download/${pdf._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </a>
                        <button
                          onClick={() => openEditModal(pdf)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(pdf._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit PDF Details</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter PDF title"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfAdminDashboard;