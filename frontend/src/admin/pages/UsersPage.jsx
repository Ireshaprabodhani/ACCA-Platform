import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { ChevronDown, ChevronUp, Trash2, Plus, Download, Search, X, AlertCircle, User, Mail, Phone, School, Calendar, Users } from 'lucide-react';
import * as XLSX from 'xlsx';

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

  // Load all users once
  const loadRows = () => {
    setIsLoading(true);
    axios
      .get('https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/users', {
        headers: tokenHeader,
      })
      .then((res) => {
        const sorted = res.data?.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        ) || [];
        setRows(sorted);
      })
      .catch((err) => {
        console.error('Failed to load users:', err);
        toast.error('Failed to load users');
      })
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
    
    // Use saveAs equivalent
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Export completed');
  };

  useEffect(loadRows, []);

  const toggle = (id) => setExpanded((cur) => (cur === id ? null : id));

  // Frontend filtering for both search and school name
  const filteredUsers = rows.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const schoolLower = schoolFilter.toLowerCase();

    const matchesSearch = 
      (user.firstName?.toLowerCase() || '').includes(searchLower) ||
      (user.lastName?.toLowerCase() || '').includes(searchLower) ||
      (user.email?.toLowerCase() || '').includes(searchLower) ||
      (user.schoolName?.toLowerCase() || '').includes(searchLower) ||
      (user.whatsappNumber?.includes(searchTerm) || false);

    const matchesSchool = 
      schoolLower ? (user.schoolName?.toLowerCase() || '').includes(schoolLower) : true;

    return matchesSearch && matchesSchool;
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

  // Validation helper functions
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(cleanPhone);
  };

  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s\-\']+$/;
    return nameRegex.test(name) && name.trim().length > 0;
  };

  const validateGrade = (grade) => {
    const validGrades = /^(K|Pre-K|[1-9]|1[0-2]|Kindergarten|Grade [1-9]|Grade 1[0-2])$/i;
    return validGrades.test(grade.toString());
  };

  const validateAge = (age) => {
    const ageNum = Number(age);
    return ageNum > 0 && ageNum <= 150 && Number.isInteger(ageNum);
  };

  // Validation status indicators
  const getValidationStatus = (user) => {
    const issues = [];

    if (!validateName(user.firstName || '')) issues.push('Invalid first name');
    if (!validateName(user.lastName || '')) issues.push('Invalid last name');
    if (!validateEmail(user.email || '')) issues.push('Invalid email');
    if (!validatePhone(user.whatsappNumber || '')) issues.push('Invalid phone');
    if (!validateAge(user.age)) issues.push('Invalid age');
    if (!validateGrade(user.grade || '')) issues.push('Invalid grade');
    if (!user.schoolName?.trim()) issues.push('Missing school name');

    // Validate members
    if (user.members?.length > 0) {
      user.members.forEach((member, index) => {
        if (!validateName(member.firstName || '')) issues.push(`Member ${index + 1}: Invalid first name`);
        if (!validateName(member.lastName || '')) issues.push(`Member ${index + 1}: Invalid last name`);
        if (!validateEmail(member.email || '')) issues.push(`Member ${index + 1}: Invalid email`);
        if (!validatePhone(member.whatsappNumber || '')) issues.push(`Member ${index + 1}: Invalid phone`);
        if (!validateAge(member.age)) issues.push(`Member ${index + 1}: Invalid age`);
        if (!validateGrade(member.grade || '')) issues.push(`Member ${index + 1}: Invalid grade`);
      });
    }

    return issues;
  };

  return (
    <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 min-h-screen">
      <Toaster position="top-center" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-purple-900 mb-2">User Management</h2>
          <div className="flex items-center gap-4 text-sm text-purple-600">
            <span className="flex items-center gap-1">
              <Users size={16} />
              {filteredUsers.length} users found
            </span>
            <span className="flex items-center gap-1">
              <AlertCircle size={16} />
              {filteredUsers.filter(u => getValidationStatus(u).length > 0).length} with validation issues
            </span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" size={18} />
            <input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-500 hover:text-purple-700"
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
      <div className="mb-6 flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <School className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" size={18} />
          <input
            type="text"
            placeholder="Filter by school name..."
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
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
          <div className="overflow-auto bg-white shadow-lg rounded-xl border border-purple-100">
            <table className="min-w-full divide-y divide-purple-100">
              <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-800 uppercase tracking-wider">User Info</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-800 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-800 uppercase tracking-wider">Academic</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-800 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-800 uppercase tracking-wider">Activity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-800 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-purple-100">
                {currentUsers.length > 0 ? (
                  currentUsers.map((u) => {
                    const validationIssues = getValidationStatus(u);
                    const hasValidationIssues = validationIssues.length > 0;
                    
                    return (
                      <React.Fragment key={u._id}>
                        <tr className={`hover:bg-purple-50 transition-colors ${hasValidationIssues ? 'border-l-4 border-l-red-400' : ''}`}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasValidationIssues ? 'bg-red-100' : 'bg-purple-100'}`}>
                                <User className={`${hasValidationIssues ? 'text-red-600' : 'text-purple-600'}`} size={20} />
                              </div>
                              <div>
                                <div className="font-semibold text-purple-900">
                                  {u.firstName || '—'} {u.lastName || '—'}
                                </div>
                                <div className="text-sm text-purple-600 flex items-center gap-1">
                                  <Mail size={14} />
                                  {u.email || '—'}
                                </div>
                                {hasValidationIssues && (
                                  <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                                    <AlertCircle size={12} />
                                    {validationIssues.length} validation issue{validationIssues.length > 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-sm text-purple-900">
                              <Phone size={14} className="text-purple-500" />
                              {u.whatsappNumber || '—'}
                            </div>
                            {u.whatsappNumber && !validatePhone(u.whatsappNumber) && (
                              <div className="text-xs text-red-600 mt-1">Invalid format</div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-sm text-purple-900 mb-1">
                              <School size={14} className="text-purple-500" />
                              {u.schoolName || '—'}
                            </div>
                            <div className="flex gap-2 items-center">
                              {u.grade && (
                                <span className={`px-2 py-1 rounded-full text-xs ${validateGrade(u.grade) ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'}`}>
                                  Grade {u.grade}
                                </span>
                              )}
                              {u.age && (
                                <span className={`px-2 py-1 rounded-full text-xs ${validateAge(u.age) ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                                  Age {u.age}
                                </span>
                              )}
                            </div>
                            {u.gender && (
                              <div className="mt-1">
                                <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-xs">
                                  {u.gender}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${hasValidationIssues ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {hasValidationIssues ? (
                                  <>
                                    <AlertCircle size={12} />
                                    Validation Issues
                                  </>
                                ) : (
                                  <>
                                    ✓ Valid
                                  </>
                                )}
                              </div>
                              {u.members?.length > 0 && (
                                <div className="flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                                  <Users size={12} />
                                  {u.members.length} member{u.members.length > 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-purple-600">
                              <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                {formatDateTime(u.createdAt)}
                              </div>
                              <div className="text-xs text-purple-500 mt-1">
                                Last: {formatDateTime(u.lastLoginAt)}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-3">
                              <button
                                onClick={() => toggle(u._id)}
                                className="text-purple-600 hover:text-purple-800 flex items-center gap-1 transition-colors"
                              >
                                {expanded === u._id ? (
                                  <>
                                    <ChevronUp size={16} /> Hide
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown size={16} /> Details
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => deleteUser(u._id, `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User')}
                                className="text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors"
                              >
                                <Trash2 size={16} /> 
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expanded === u._id && (
                          <tr>
                            <td colSpan={6} className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50">
                              <div className="p-4 space-y-4">
                                {/* Validation Issues */}
                                {hasValidationIssues && (
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                                      <AlertCircle size={16} />
                                      Validation Issues
                                    </h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                                      {validationIssues.map((issue, idx) => (
                                        <li key={idx}>{issue}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* User Details */}
                                <div className="bg-white border border-purple-200 rounded-lg p-4">
                                  <h4 className="font-semibold text-purple-800 mb-3">User Details</h4>
                                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="font-medium text-purple-700">Full Name:</span> {u.firstName} {u.lastName}
                                    </div>
                                    <div>
                                      <span className="font-medium text-purple-700">Email:</span> {u.email}
                                    </div>
                                    <div>
                                      <span className="font-medium text-purple-700">WhatsApp:</span> {u.whatsappNumber}
                                    </div>
                                    <div>
                                      <span className="font-medium text-purple-700">School:</span> {u.schoolName}
                                    </div>
                                    <div>
                                      <span className="font-medium text-purple-700">Grade:</span> {u.grade}
                                    </div>
                                    <div>
                                      <span className="font-medium text-purple-700">Age:</span> {u.age}
                                    </div>
                                    <div>
                                      <span className="font-medium text-purple-700">Gender:</span> {u.gender}
                                    </div>
                                    <div>
                                      <span className="font-medium text-purple-700">Registered:</span> {formatDateTime(u.createdAt)}
                                    </div>
                                  </div>
                                </div>

                                {/* Team Members */}
                                <div className="bg-white border border-purple-200 rounded-lg p-4">
                                  <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                                    <Users size={16} />
                                    Team Members ({u.members?.length || 0})
                                  </h4>
                                  {u.members?.length ? (
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {u.members.map((m, idx) => {
                                        const memberIssues = [];
                                        if (!validateName(m.firstName || '')) memberIssues.push('Invalid first name');
                                        if (!validateName(m.lastName || '')) memberIssues.push('Invalid last name');
                                        if (!validateEmail(m.email || '')) memberIssues.push('Invalid email');
                                        if (!validatePhone(m.whatsappNumber || '')) memberIssues.push('Invalid phone');
                                        if (!validateAge(m.age)) memberIssues.push('Invalid age');
                                        if (!validateGrade(m.grade || '')) memberIssues.push('Invalid grade');

                                        return (
                                          <div key={idx} className={`border rounded-lg bg-white p-3 shadow-sm ${memberIssues.length > 0 ? 'border-red-200' : 'border-purple-100'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                              <p className="font-semibold text-purple-900">
                                                {m.firstName || '—'} {m.lastName || '—'}
                                              </p>
                                              {memberIssues.length > 0 && (
                                                <AlertCircle size={16} className="text-red-500" />
                                              )}
                                            </div>
                                            <p className="text-sm text-purple-600 mb-2">{m.email || '—'}</p>
                                            <div className="flex gap-1 flex-wrap mb-2">
                                              {m.grade && (
                                                <span className={`text-xs px-2 py-1 rounded-full ${validateGrade(m.grade) ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'}`}>
                                                  Grade {m.grade}
                                                </span>
                                              )}
                                              {m.age && (
                                                <span className={`text-xs px-2 py-1 rounded-full ${validateAge(m.age) ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                                                  Age {m.age}
                                                </span>
                                              )}
                                              {m.gender && (
                                                <span className="text-xs px-2 py-1 bg-pink-100 text-pink-800 rounded-full">
                                                  {m.gender}
                                                </span>
                                              )}
                                            </div>
                                            {memberIssues.length > 0 && (
                                              <div className="text-xs text-red-600">
                                                <div className="font-medium">Issues:</div>
                                                <ul className="list-disc list-inside">
                                                  {memberIssues.map((issue, i) => (
                                                    <li key={i}>{issue}</li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-purple-600">No team members listed.</p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
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
                        className={`w-10 h-10 rounded-lg transition-all ${currentPage === pageNum ? 'bg-purple-600 text-white' : 'bg-white text-purple-700 hover:bg-purple-50'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-1 text-purple-500">...</span>
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

      {/* Add User Modal */}
      {showAddModal && <AddUserModal onClose={() => setShowAddModal(false)} onUserAdded={() => { loadRows(); setCurrentPage(1); }} />}
    </div>
  );
};

// Add User Modal Component
const AddUserModal = ({ onClose, onUserAdded }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    whatsappNumber: '',
    gender: '',
    age: '',
    grade: '',
    schoolName: '',
    password: '',
    members: []
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(cleanPhone);
  };

  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s\-\']+$/;
    return nameRegex.test(name) && name.trim().length > 0;
  };

  const validateGrade = (grade) => {
    const validGrades = /^(K|Pre-K|[1-9]|1[0-2]|Kindergarten|Grade [1-9]|Grade 1[0-2])$/i;
    return validGrades.test(grade.toString());
  };

  const validateAge = (age) => {
    const ageNum = Number(age);
    return ageNum > 0 && ageNum <= 150 && Number.isInteger(ageNum);
  };

  const validateForm = () => {
    const newErrors = {};

    // Main user validations
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (!validateName(formData.firstName)) {
      newErrors.firstName = 'First name can only contain letters, spaces, hyphens, and apostrophes';
    } else if (formData.firstName.trim().length > 50) {
      newErrors.firstName = 'First name cannot exceed 50 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (!validateName(formData.lastName)) {
      newErrors.lastName = 'Last name can only contain letters, spaces, hyphens, and apostrophes';
    } else if (formData.lastName.trim().length > 50) {
      newErrors.lastName = 'Last name cannot exceed 50 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.whatsappNumber.trim()) {
      newErrors.whatsappNumber = 'WhatsApp number is required';
    } else if (!validatePhone(formData.whatsappNumber)) {
      newErrors.whatsappNumber = 'Please enter a valid phone number';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (!validateAge(formData.age)) {
      newErrors.age = 'Age must be a positive integer between 1 and 150';
    }

    if (!formData.grade.trim()) {
      newErrors.grade = 'Grade is required';
    } else if (!validateGrade(formData.grade)) {
      newErrors.grade = 'Please enter a valid grade (K, Pre-K, 1-12, or Kindergarten)';
    }

    if (!formData.schoolName.trim()) {
      newErrors.schoolName = 'School name is required';
    } else if (formData.schoolName.trim().length > 100) {
      newErrors.schoolName = 'School name cannot exceed 100 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    // Member validations
    formData.members.forEach((member, index) => {
      const memberErrors = {};

      if (!member.firstName?.trim()) {
        memberErrors.firstName = 'First name is required';
      } else if (!validateName(member.firstName)) {
        memberErrors.firstName = 'First name can only contain letters, spaces, hyphens, and apostrophes';
      }

      if (!member.lastName?.trim()) {
        memberErrors.lastName = 'Last name is required';
      } else if (!validateName(member.lastName)) {
        memberErrors.lastName = 'Last name can only contain letters, spaces, hyphens, and apostrophes';
      }

      if (!member.email?.trim()) {
        memberErrors.email = 'Email is required';
      } else if (!validateEmail(member.email)) {
        memberErrors.email = 'Please enter a valid email address';
      }

      if (!member.whatsappNumber?.trim()) {
        memberErrors.whatsappNumber = 'WhatsApp number is required';
      } else if (!validatePhone(member.whatsappNumber)) {
        memberErrors.whatsappNumber = 'Please enter a valid phone number';
      }

      if (!member.gender) {
        memberErrors.gender = 'Gender is required';
      }

      if (!member.age) {
        memberErrors.age = 'Age is required';
      } else if (!validateAge(member.age)) {
        memberErrors.age = 'Age must be a positive integer between 1 and 150';
      }

      if (!member.grade?.toString().trim()) {
        memberErrors.grade = 'Grade is required';
      } else if (!validateGrade(member.grade)) {
        memberErrors.grade = 'Please enter a valid grade (K, Pre-K, 1-12, or Kindergarten)';
      }

      if (Object.keys(memberErrors).length > 0) {
        newErrors[`member_${index}`] = memberErrors;
      }
    });

    // Check for duplicate emails
    const allEmails = [formData.email, ...formData.members.map(m => m.email)].filter(Boolean);
    const uniqueEmails = new Set(allEmails.map(e => e.toLowerCase().trim()));
    if (allEmails.length !== uniqueEmails.size) {
      newErrors.duplicateEmails = 'Duplicate email addresses found';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix validation errors');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const tokenHeader = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      
      await axios.post(
        'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/users',
        formData,
        { headers: tokenHeader }
      );
      
      toast.success('User created successfully');
      onUserAdded();
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.join(', ') || 'Error creating user';
      toast.error(errorMessage);
      
      if (error.response?.data?.errors) {
        const serverErrors = {};
        error.response.data.errors.forEach(err => {
          if (err.includes('Member')) {
            const memberIndex = err.match(/Member (\d+):/)?.[1];
            if (memberIndex) {
              const index = parseInt(memberIndex) - 1;
              if (!serverErrors[`member_${index}`]) serverErrors[`member_${index}`] = {};
              serverErrors[`member_${index}`].general = err;
            }
          } else {
            serverErrors.general = err;
          }
        });
        setErrors(prev => ({ ...prev, ...serverErrors }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMember = () => {
    setFormData(prev => ({
      ...prev,
      members: [...prev.members, {
        firstName: '',
        lastName: '',
        email: '',
        whatsappNumber: '',
        gender: '',
        age: '',
        grade: ''
      }]
    }));
  };

  const removeMember = (index) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index)
    }));
    
    // Clear member errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`member_${index}`];
      return newErrors;
    });
  };

  const updateMember = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.map((member, i) => 
        i === index ? { ...member, [field]: value } : member
      )
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-purple-200 p-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-purple-900">Add New User</h3>
            <button
              onClick={onClose}
              className="text-purple-500 hover:text-purple-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Main User Information */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-800 mb-4 flex items-center gap-2">
              <User size={18} />
              Main User Information
            </h4>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.firstName ? 'border-red-500' : 'border-purple-200'}`}
                  placeholder="Enter first name"
                />
                {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.lastName ? 'border-red-500' : 'border-purple-200'}`}
                  placeholder="Enter last name"
                />
                {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.email ? 'border-red-500' : 'border-purple-200'}`}
                  placeholder="Enter email address"
                />
                {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  WhatsApp Number *
                </label>
                <input
                  type="tel"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.whatsappNumber ? 'border-red-500' : 'border-purple-200'}`}
                  placeholder="Enter WhatsApp number"
                />
                {errors.whatsappNumber && <p className="text-red-600 text-xs mt-1">{errors.whatsappNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.gender ? 'border-red-500' : 'border-purple-200'}`}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
                {errors.gender && <p className="text-red-600 text-xs mt-1">{errors.gender}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  Age *
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.age ? 'border-red-500' : 'border-purple-200'}`}
                  placeholder="Enter age"
                  min="1"
                  max="150"
                />
                {errors.age && <p className="text-red-600 text-xs mt-1">{errors.age}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  Grade *
                </label>
                <input
                  type="text"
                  value={formData.grade}
                  onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.grade ? 'border-red-500' : 'border-purple-200'}`}
                  placeholder="e.g., K, Pre-K, 1, 2, 3... 12"
                />
                {errors.grade && <p className="text-red-600 text-xs mt-1">{errors.grade}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  School Name *
                </label>
                <input
                  type="text"
                  value={formData.schoolName}
                  onChange={(e) => setFormData(prev => ({ ...prev, schoolName: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.schoolName ? 'border-red-500' : 'border-purple-200'}`}
                  placeholder="Enter school name"
                />
                {errors.schoolName && <p className="text-red-600 text-xs mt-1">{errors.schoolName}</p>}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-purple-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.password ? 'border-red-500' : 'border-purple-200'}`}
                placeholder="Enter password (min 6 characters)"
              />
              {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
            </div>
          </div>

          {/* Team Members Section */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-indigo-800 flex items-center gap-2">
                <Users size={18} />
                Team Members (Optional)
              </h4>
              <button
                type="button"
                onClick={addMember}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
              >
                <Plus size={16} />
                Add Member
              </button>
            </div>

            {formData.members.map((member, index) => (
              <div key={index} className="bg-white border border-indigo-200 rounded-lg p-4 mb-4 relative">
                <button
                  type="button"
                  onClick={() => removeMember(index)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  <X size={20} />
                </button>

                <h5 className="font-medium text-indigo-800 mb-3">Member {index + 1}</h5>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-indigo-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={member.firstName}
                      onChange={(e) => updateMember(index, 'firstName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors[`member_${index}`]?.firstName ? 'border-red-500' : 'border-indigo-200'}`}
                      placeholder="Enter first name"
                    />
                    {errors[`member_${index}`]?.firstName && <p className="text-red-600 text-xs mt-1">{errors[`member_${index}`].firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-indigo-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={member.lastName}
                      onChange={(e) => updateMember(index, 'lastName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors[`member_${index}`]?.lastName ? 'border-red-500' : 'border-indigo-200'}`}
                      placeholder="Enter last name"
                    />
                    {errors[`member_${index}`]?.lastName && <p className="text-red-600 text-xs mt-1">{errors[`member_${index}`].lastName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-indigo-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={member.email}
                      onChange={(e) => updateMember(index, 'email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors[`member_${index}`]?.email ? 'border-red-500' : 'border-indigo-200'}`}
                      placeholder="Enter email address"
                    />
                    {errors[`member_${index}`]?.email && <p className="text-red-600 text-xs mt-1">{errors[`member_${index}`].email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-indigo-700 mb-1">
                      WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      value={member.whatsappNumber}
                      onChange={(e) => updateMember(index, 'whatsappNumber', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors[`member_${index}`]?.whatsappNumber ? 'border-red-500' : 'border-indigo-200'}`}
                      placeholder="Enter WhatsApp number"
                    />
                    {errors[`member_${index}`]?.whatsappNumber && <p className="text-red-600 text-xs mt-1">{errors[`member_${index}`].whatsappNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-indigo-700 mb-1">
                      Gender *
                    </label>
                    <select
                      value={member.gender}
                      onChange={(e) => updateMember(index, 'gender', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors[`member_${index}`]?.gender ? 'border-red-500' : 'border-indigo-200'}`}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                    {errors[`member_${index}`]?.gender && <p className="text-red-600 text-xs mt-1">{errors[`member_${index}`].gender}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-indigo-700 mb-1">
                      Age *
                    </label>
                    <input
                      type="number"
                      value={member.age}
                      onChange={(e) => updateMember(index, 'age', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors[`member_${index}`]?.age ? 'border-red-500' : 'border-indigo-200'}`}
                      placeholder="Enter age"
                      min="1"
                      max="150"
                    />
                    {errors[`member_${index}`]?.age && <p className="text-red-600 text-xs mt-1">{errors[`member_${index}`].age}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-indigo-700 mb-1">
                      Grade *
                    </label>
                    <input
                      type="text"
                      value={member.grade}
                      onChange={(e) => updateMember(index, 'grade', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors[`member_${index}`]?.grade ? 'border-red-500' : 'border-indigo-200'}`}
                      placeholder="e.g., K, Pre-K, 1, 2, 3... 12"
                    />
                    {errors[`member_${index}`]?.grade && <p className="text-red-600 text-xs mt-1">{errors[`member_${index}`].grade}</p>}
                  </div>
                </div>

                {errors[`member_${index}`]?.general && (
                  <p className="text-red-600 text-sm mt-2">{errors[`member_${index}`].general}</p>
                )}
              </div>
            ))}

            {formData.members.length === 0 && (
              <p className="text-indigo-600 text-center py-4">No team members added yet. Click "Add Member" to add team members.</p>
            )}
          </div>

          {/* General Errors */}
          {errors.duplicateEmails && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 flex items-center gap-2">
                <AlertCircle size={16} />
                {errors.duplicateEmails}
              </p>
            </div>
          )}

          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 flex items-center gap-2">
                <AlertCircle size={16} />
                {errors.general}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-purple-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>