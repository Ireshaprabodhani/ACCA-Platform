// pages/UsersPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import AddUserModal from '../components/AddUserModal'; // ← import modal

const UsersPage = () => {
  const [rows, setRows] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [schoolFilter, setSchoolFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const tokenHeader = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  const loadRows = () => {
    axios
      .get('https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/users', {
        headers: tokenHeader,
        params: schoolFilter ? { schoolName: schoolFilter } : {},
      })
      .then((res) => setRows(res.data))
      .catch(() => toast.error('Failed to load users'));
  };

  const deleteUser = (id, name) => {
    if (!window.confirm(`Delete user “${name}” ?`)) return;

    toast
      .promise(
        axios.delete(
          `https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/users/${id}`,
          { headers: tokenHeader }
        ),
        { loading: 'Deleting…', success: 'Deleted', error: 'Error' }
      )
      .then(loadRows);
  };

  const exportToExcel = () => {
    const formattedData = rows.map((user) => ({
      Name: `${user.firstName} ${user.lastName}`,
      Email: user.email,
      School: user.schoolName,
      Registered: new Date(user.createdAt).toLocaleDateString(),
      LastLogin: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—',
      Members: user.members?.length || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'users.xlsx');
  };

  useEffect(loadRows, [schoolFilter]);

  const toggle = (id) => setExpanded((cur) => (cur === id ? null : id));

  return (
    <div className="p-6">
      <Toaster position="top-center" />

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Users</h2>
        <div className="flex items-center gap-2">
          <input
            placeholder="Filter by school…"
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="border px-3 py-1 rounded-lg"
          />
          {schoolFilter && (
            <button
              onClick={() => setSchoolFilter('')}
              className="text-sm text-red-500 underline"
            >
              Clear
            </button>
          )}
          <button
            onClick={exportToExcel}
            className="px-4 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Download Excel
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add User
          </button>
        </div>
      </div>

      <div className="overflow-auto bg-white shadow rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-center">Email</th>
              <th className="px-3 py-2 text-center">School</th>
              <th className="px-3 py-2 text-center">Registered</th>
              <th className="px-3 py-2 text-center">Last Login</th>
              <th className="px-3 py-2 text-center">Members</th>
              <th className="px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <React.Fragment key={u._id}>
                <tr className="border-t">
                  <td className="px-3 py-2">{u.firstName} {u.lastName}</td>
                  <td className="px-3 py-2 text-center">{u.email}</td>
                  <td className="px-3 py-2 text-center">{u.schoolName}</td>
                  <td className="px-3 py-2 text-center">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-center">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => toggle(u._id)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      {expanded === u._id ? <>Hide <ChevronUp size={14} /></> : <>Show <ChevronDown size={14} /></>}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => deleteUser(u._id, `${u.firstName} ${u.lastName}`)}
                      className="inline-flex items-center gap-1 text-red-600 hover:underline"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </td>
                </tr>

                {expanded === u._id && (
                  <tr className="bg-blue-50">
                    <td colSpan={7} className="px-4 py-3">
                      {u.members && u.members.length ? (
                        <div className="grid sm:grid-cols-3 gap-3">
                          {u.members.map((m, idx) => (
                            <div key={idx} className="border rounded-lg bg-white p-3 shadow-sm">
                              <p className="font-semibold">{m.firstName} {m.lastName}</p>
                              <p className="text-xs text-gray-500">{m.email}</p>
                              <p className="text-xs">Grade {m.grade} · {m.gender}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No team members listed.</p>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onUserAdded={loadRows}
        />
      )}
    </div>
  );
};

export default UsersPage;
