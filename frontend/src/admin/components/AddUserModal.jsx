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
  const [errors, setErrors] = useState({});
  const tokenHeader = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddMember = () => {
    setMembers([
      ...members,
      { firstName: '', lastName: '', email: '', whatsappNumber: '', grade: '', gender: '', age: '' },
    ]);
  };

  const handleMemberChange = (index, e) => {
    const updated = [...members];
    updated[index][e.target.name] = e.target.value;
    setMembers(updated);
  };

  // === Frontend Validation ===
  const validate = () => {
    const newErrors = {};

    if (!form.firstName.trim()) newErrors.firstName = 'First Name is required';
    if (!form.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email format';

    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (form.whatsappNumber && !/^\d{10,15}$/.test(form.whatsappNumber))
      newErrors.whatsappNumber = 'WhatsApp number must be 10–15 digits';

    if (form.age && (isNaN(form.age) || form.age <= 0)) newErrors.age = 'Age must be a positive number';

    // validate members
    members.forEach((m, i) => {
      if (!m.firstName.trim()) newErrors[`member-${i}-firstName`] = 'First Name required';
      if (m.email && !/\S+@\S+\.\S+/.test(m.email)) newErrors[`member-${i}-email`] = 'Invalid email';
      if (m.age && (isNaN(m.age) || m.age <= 0)) newErrors[`member-${i}-age`] = 'Age must be positive';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix validation errors');
      return;
    }

    try {
      const payload = {
        ...form,
        age: form.age ? parseInt(form.age) : undefined,
        members: members.map((m) => ({
          ...m,
          age: m.age ? parseInt(m.age) : undefined,
        })),
      };

      await axios.post(
        'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin/users',
        payload,
        { headers: tokenHeader }
      );

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
            <div>
              <input
                name="firstName"
                placeholder="First Name"
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
            </div>

            <input name="lastName" placeholder="Last Name" onChange={handleChange} className="border p-2 rounded" />

            <div>
              <input
                name="email"
                placeholder="Email"
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>

            <div>
              <input
                name="password"
                type="password"
                placeholder="Password"
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
            </div>

            <div>
              <input
                name="whatsappNumber"
                placeholder="WhatsApp Number"
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              {errors.whatsappNumber && <p className="text-red-500 text-sm">{errors.whatsappNumber}</p>}
            </div>

            <input name="schoolName" placeholder="School Name" onChange={handleChange} className="border p-2 rounded" />
            <input name="grade" placeholder="Grade" onChange={handleChange} className="border p-2 rounded" />
            <input name="gender" placeholder="Gender" onChange={handleChange} className="border p-2 rounded" />

            <div>
              <input
                name="age"
                type="number"
                placeholder="Age"
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              {errors.age && <p className="text-red-500 text-sm">{errors.age}</p>}
            </div>
          </div>

          {/* Team Members */}
          <div>
            <h4 className="font-semibold mb-2">Team Members</h4>
            {members.map((m, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                <div>
                  <input
                    name="firstName"
                    placeholder="First Name"
                    onChange={(e) => handleMemberChange(i, e)}
                    className="border p-2 rounded w-full"
                  />
                  {errors[`member-${i}-firstName`] && (
                    <p className="text-red-500 text-sm">{errors[`member-${i}-firstName`]}</p>
                  )}
                </div>
                <input
                  name="lastName"
                  placeholder="Last Name"
                  onChange={(e) => handleMemberChange(i, e)}
                  className="border p-2 rounded"
                />
                <div>
                  <input
                    name="email"
                    placeholder="Email"
                    onChange={(e) => handleMemberChange(i, e)}
                    className="border p-2 rounded w-full"
                  />
                  {errors[`member-${i}-email`] && (
                    <p className="text-red-500 text-sm">{errors[`member-${i}-email`]}</p>
                  )}
                </div>
                <input
                  name="whatsappNumber"
                  placeholder="WhatsApp Number"
                  onChange={(e) => handleMemberChange(i, e)}
                  className="border p-2 rounded"
                />
                <input
                  name="grade"
                  placeholder="Grade"
                  onChange={(e) => handleMemberChange(i, e)}
                  className="border p-2 rounded"
                />
                <input
                  name="gender"
                  placeholder="Gender"
                  onChange={(e) => handleMemberChange(i, e)}
                  className="border p-2 rounded"
                />
                <div>
                  <input
                    name="age"
                    type="number"
                    placeholder="Age"
                    onChange={(e) => handleMemberChange(i, e)}
                    className="border p-2 rounded w-full"
                  />
                  {errors[`member-${i}-age`] && (
                    <p className="text-red-500 text-sm">{errors[`member-${i}-age`]}</p>
                  )}
                </div>
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
