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

  // Fetch all PDFs
  useEffect(() => {
    fetchPdfs();
  }, []);

 const fetchPdfs = async () => {
  try {
    const response = await axios.get('/api/admin/pdfs');
    // Ensure response.data is an array
    setPdfs(Array.isArray(response.data) ? response.data : []);
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    setPdfs([]); // Fallback to empty array
  }
};

  // Handle file selection
  const handleFileChange = (e) => {
    setNewFile(e.target.files[0]);
  };

  // Upload new PDF
  const handleUpload = async () => {
    if (!newFile) return;

    const formData = new FormData();
    formData.append('pdf', newFile);

    try {
      setIsUploading(true);
      const response = await axios.post('/api/admin/pdfs/upload', formData, {
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
      alert('Failed to upload PDF');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Open edit modal
  const openEditModal = (pdf) => {
    setSelectedPdf(pdf);
    setEditTitle(pdf.title);
    setIsEditModalOpen(true);
  };

  // Update PDF title
const handleUpdate = async () => {
  try {
    await axios.put(`/api/admin/pdfs/${selectedPdf._id}`, { title: editTitle });
    
    // Safely update state
    setPdfs(prevPdfs => {
      // Ensure prevPdfs is array before mapping
      return Array.isArray(prevPdfs) 
        ? prevPdfs.map(pdf => 
            pdf._id === selectedPdf._id ? { ...pdf, title: editTitle } : pdf
          )
        : []; // Fallback to empty array
    });
    
    setIsEditModalOpen(false);
    alert('PDF updated successfully!');
  } catch (error) {
    console.error('Update error:', error);
    alert('Failed to update PDF');
  }
};

// Delete PDF
const handleDelete = async (id) => {
    try {
        await axios.delete(`/api/admin/pdfs/${id}`);
        setPdfs(pdfs.filter(pdf => pdf._id !== id));
        alert('PDF deleted successfully!');
    } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete PDF');
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pdf.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pdf.filename}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(pdf.size / 1024).toFixed(2)} KB
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(pdf.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <a
                        href={`/api/pdfs/${pdf._id}`}
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