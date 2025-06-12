import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InputField from '../components/InputField';
import Dropdown from '../components/Dropdown';
import Button from '../components/Button';
import axios from 'axios';

const RegisterPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    whatsappNumber: '',
    email: '',
    gender: '',
    age: '',
    password: '',
    confirmPassword: '',
    schoolName: '',
    grade: '',
    members: [
      { firstName: '', lastName: '', whatsappNumber: '', email: '', gender: '', age: '', grade: '' },
      { firstName: '', lastName: '', whatsappNumber: '', email: '', gender: '', age: '', grade: '' },
      { firstName: '', lastName: '', whatsappNumber: '', email: '', gender: '', age: '', grade: '' },
    ],
  });

  const handleChange = (e, memberIndex = null, field = null) => {
    const { name, value } = e.target;

    if (memberIndex !== null && field) {
      const updatedMembers = [...formData.members];
      updatedMembers[memberIndex][field] = value;
      setFormData(prev => ({ ...prev, members: updatedMembers }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (formData.password !== formData.confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  try {
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      firstName: formData.firstName,
      lastName: formData.lastName,
      whatsappNumber: formData.whatsappNumber,
      email: formData.email,
      gender: formData.gender,
      age: formData.age,
      password: formData.password,
      grade: formData.grade,
      schoolName: formData.schoolName,
      members: formData.members,
    });

    // On successful registration
    alert('Registration successful! Please login.');
    navigate('/login');
  } catch (error) {
    console.error('Registration error:', error);
    const message = error.response?.data?.message || 'Registration failed.';
    alert(message);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg max-w-4xl w-full overflow-auto max-h-[90vh]">
        <h2 className="text-3xl font-bold mb-6 text-center text-purple-700">Register Your Team</h2>

        {/* Main User Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <InputField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
          <InputField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
          <InputField label="WhatsApp Number" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} />
          <InputField label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} />
          <Dropdown label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={['Male', 'Female', 'Other']} />
          <InputField label="Age" type="number" name="age" value={formData.age} onChange={handleChange} />
          <InputField label="Password" type="password" name="password" value={formData.password} onChange={handleChange} />
          <InputField label="Confirm Password" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} />
          <InputField label="School/Institute Name" name="schoolName" value={formData.schoolName} onChange={handleChange} />
          <InputField label="Grade" name="grade" value={formData.grade} onChange={handleChange} />
        </div>

        {/* Members */}
        {[0, 1, 2].map((idx) => (
          <div
            key={idx}
            className={`p-4 mb-6 rounded-lg ${
              idx === 0 ? 'bg-pink-100' : idx === 1 ? 'bg-yellow-100' : 'bg-purple-100'
            }`}
          >
            <h3 className="text-xl font-semibold mb-4 text-center">Member {idx + 1}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="First Name"
                value={formData.members[idx].firstName}
                onChange={(e) => handleChange(e, idx, 'firstName')}
              />
              <InputField
                label="Last Name"
                value={formData.members[idx].lastName}
                onChange={(e) => handleChange(e, idx, 'lastName')}
              />
              <InputField
                label="WhatsApp Number"
                value={formData.members[idx].whatsappNumber}
                onChange={(e) => handleChange(e, idx, 'whatsappNumber')}
              />
              <InputField
                label="Email Address"
                type="email"
                value={formData.members[idx].email}
                onChange={(e) => handleChange(e, idx, 'email')}
              />
              <Dropdown
                label="Gender"
                value={formData.members[idx].gender}
                onChange={(e) => handleChange(e, idx, 'gender')}
                options={['Male', 'Female', 'Other']}
              />
              <InputField
                label="Age"
                type="number"
                value={formData.members[idx].age}
                onChange={(e) => handleChange(e, idx, 'age')}
              />
              <InputField
                label="Grade"
                value={formData.members[idx].grade}
                onChange={(e) => handleChange(e, idx, 'grade')}
              />
            </div>
          </div>
        ))}

        <Button label="Register" type="submit" className="w-full text-lg font-bold" />
      </form>
    </div>
  );
};

export default RegisterPage;
