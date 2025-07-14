import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AddUserModal = ({ onClose, onUserAdded }) => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    whatsappNumber: '',
    schoolName: '',
    grade: '',
    gender: '',
    age: '',
  });

  const [members, setMembers] = useState([]);
  const tokenHeader = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddMember = () => {
    setMembers([...members, { firstName: '', lastName: '', email: '', whatsappNumber: '', grade: '', gender: '', age: '' }]);
  };

  const handleMemberChange = (index, e) => {
    const updated = [...members];
    updated[index][e.target.name] = e.target.value;
    setMembers(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        age: parseInt(form.age),
        members: members.map((m) => ({ ...m, age: parseInt(m.age) })),
      };
      await axios.post('https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/users', payload, {
        headers: tokenHeader,
      });
      toast.success('User added');
      onUserAdded();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add user');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-[95%] max-w-2xl overflow-auto max-h-[90%]">
        <h3 className="text-xl font-bold mb-4">Add User</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input name="firstName" placeholder="First Name" required onChange={handleChange} className="border p-2 rounded" />
            <input name="lastName" placeholder="Last Name" onChange={handleChange} className="border p-2 rounded" />
            <input name="email" placeholder="Email" required onChange={handleChange} className="border p-2 rounded" />
            <input name="password" type="password" placeholder="Password" required onChange={handleChange} className="border p-2 rounded" />
            <input name="whatsappNumber" placeholder="WhatsApp Number" onChange={handleChange} className="border p-2 rounded" />
            <input name="schoolName" placeholder="School Name" onChange={handleChange} className="border p-2 rounded" />
            <input name="grade" placeholder="Grade" onChange={handleChange} className="border p-2 rounded" />
            <input name="gender" placeholder="Gender" onChange={handleChange} className="border p-2 rounded" />
            <input name="age" placeholder="Age" type="number" onChange={handleChange} className="border p-2 rounded" />
          </div>

          <div>
            <h4 className="font-semibold mb-2">Team Members</h4>
            {members.map((m, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                <input name="firstName" placeholder="First Name" onChange={(e) => handleMemberChange(i, e)} className="border p-2 rounded" />
                <input name="lastName" placeholder="Last Name" onChange={(e) => handleMemberChange(i, e)} className="border p-2 rounded" />
                <input name="email" placeholder="Email" onChange={(e) => handleMemberChange(i, e)} className="border p-2 rounded" />
                <input name="whatsappNumber" placeholder="WhatsApp Number" onChange={(e) => handleMemberChange(i, e)} className="border p-2 rounded" />
                <input name="grade" placeholder="Grade" onChange={(e) => handleMemberChange(i, e)} className="border p-2 rounded" />
                <input name="gender" placeholder="Gender" onChange={(e) => handleMemberChange(i, e)} className="border p-2 rounded" />
                <input name="age" type="number" placeholder="Age" onChange={(e) => handleMemberChange(i, e)} className="border p-2 rounded" />
              </div>
            ))}
            <button type="button" onClick={handleAddMember} className="text-sm text-blue-600 hover:underline">
              + Add Member
            </button>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-1 bg-gray-300 rounded">
              Cancel
            </button>
            <button type="submit" className="px-4 py-1 bg-blue-600 text-white rounded">
              Add User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
