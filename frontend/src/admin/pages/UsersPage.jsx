import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { ChevronDown, ChevronUp, Trash2, Plus, Download, Search, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import AddUserModal from '../components/AddUserModal';

const UsersPage = () => {
  const [rows, setRows] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [schoolFilter, setSchoolFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const usersPerPage = 10;

  const tokenHeader = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  const loadRows = () => {
    setIsLoading(true);
    axios
      .get('https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/users', {
        headers: tokenHeader,
        params: schoolFilter ? { schoolName: schoolFilter } : {},
      })
      .then((res) => {
        const sorted = res.data?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) || [];
        setRows(sorted);
      })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setIsLoading(false));
  };

  const deleteUser = (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;

    toast
      .promise(
        axios.delete(
          `https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/users/${id}`,
          { headers: tokenHeader }
        ),
        { 
          loading: `Deleting ${name}...`, 
          success: `${name} deleted successfully`, 
          error: 'Error deleting user' 
        }
      )
      .then(loadRows);
  };

  const exportToExcel = () => {
    const formattedData = rows.map((user) => ({
      Name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      Email: user.email || '',
      School: user.schoolName || '',
      WhatsApp: user.whatsappNumber || '',
      Grade: user.grade || '',
      Gender: user.gender || '',
      Age: user.age || '',
      Registered: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
      LastLogin: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never',
      Members: user.members?.length || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, `users_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Export started');
  };

  useEffect(loadRows, [schoolFilter]);

  const toggle = (id) => setExpanded((cur) => (cur === id ? null : id));

  const filteredUsers = rows.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.firstName?.toLowerCase() || '').includes(searchLower) ||
      (user.lastName?.toLowerCase() || '').includes(searchLower) ||
      (user.email?.toLowerCase() || '').includes(searchLower) ||
      (user.schoolName?.toLowerCase() || '').includes(searchLower) ||
      (user.whatsappNumber?.includes(searchTerm) || false)
    );
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const formatDateTime = (datetime) => {
    if (!datetime) return 'Never';
    const date = new Date(datetime);
    return date.toLocaleString();
  };

  return (
    <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 min-h-screen">
      <Toaster position="top-center" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-purple-900">User Management</h2>
          <p className="text-purple-600">{filteredUsers.length} users found</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" size={18} />
            <input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-500"
              >
                <X size={18} />
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-sm"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-sm"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add User</span>
            </button>
          </div>
        </div>
      </div>

      {/* School Filter */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" size={18} />
          <input
            type="text"
            placeholder="Filter by school name..."
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
          {schoolFilter && (
            <button
              onClick={() => setSchoolFilter('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-500 hover:text-purple-700"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <>
          <div className="overflow-auto bg-white shadow rounded-xl border border-purple-100">
            <table className="min-w-full divide-y divide-purple-100">
              <thead className="bg-purple-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">School</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">Details</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">Activity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-purple-100">
                {currentUsers.length > 0 ? (
                  currentUsers.map((u) => (
                    <React.Fragment key={u._id}>
                      <tr className="hover:bg-purple-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-purple-900">
                            {u.firstName || ''} {u.lastName || ''}
                          </div>
                          <div className="text-sm text-purple-600">{u.email || '—'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-purple-900">{u.whatsappNumber || '—'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-purple-900">{u.schoolName || '—'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm">
                            {u.grade && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                                Grade {u.grade}
                              </span>
                            )}
                            {u.gender && (
                              <span className="ml-2 text-purple-600">{u.gender}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-purple-600">
                            <div>Joined: {formatDateTime(u.createdAt)}</div>
                            <div>Last login: {formatDateTime(u.lastLoginAt)}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-3">
                            <button
                              onClick={() => toggle(u._id)}
                              className="text-purple-600 hover:text-purple-800 flex items-center gap-1"
                            >
                              {expanded === u._id ? (
                                <>
                                  <ChevronUp size={16} /> Hide
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={16} /> Team ({u.members?.length || 0})
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => deleteUser(u._id, `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User')}
                              className="text-red-600 hover:text-red-800 flex items-center gap-1"
                            >
                              <Trash2 size={16} /> 
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expanded === u._id && (
                        <tr>
                          <td colSpan={6} className="px-4 py-3 bg-purple-50">
                            <div className="p-4">
                              <h4 className="font-medium text-purple-800 mb-3">Team Members</h4>
                              {u.members?.length ? (
                                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                                  {u.members.map((m, idx) => (
                                    <div key={idx} className="border border-purple-100 rounded-lg bg-white p-3 shadow-sm">
                                      <p className="font-semibold text-purple-900">
                                        {m.firstName || ''} {m.lastName || ''}
                                      </p>
                                      <p className="text-sm text-purple-600">{m.email || '—'}</p>
                                      <div className="mt-1 flex gap-2">
                                        {m.grade && (
                                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                                            Grade {m.grade}
                                          </span>
                                        )}
                                        {m.gender && (
                                          <span className="text-xs px-2 py-1 bg-pink-100 text-pink-800 rounded-full">
                                            {m.gender}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-purple-600">No team members listed.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-purple-600">
                      {searchTerm || schoolFilter ? 'No matching users found' : 'No users available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredUsers.length > usersPerPage && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
              <div className="text-sm text-purple-600">
                Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg ${currentPage === pageNum ? 'bg-purple-600 text-white' : 'bg-white text-purple-700 hover:bg-purple-50'} transition-all`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-1">...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="w-10 h-10 rounded-lg bg-white text-purple-700 hover:bg-purple-50 transition-all"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onUserAdded={() => {
            loadRows();
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
};

export default UsersPage;