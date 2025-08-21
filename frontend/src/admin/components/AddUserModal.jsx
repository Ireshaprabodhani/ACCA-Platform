import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Validation helpers (updated for grades 9-13 and university)
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
const nameRegex = /^[a-zA-Z\s\-\']+$/;
const gradeRegex = /^(9|10|11|12|13|University|College)$/i;
const validGenders = ['male', 'female', 'other', 'prefer-not-to-say'];

const validateField = (name, value, isMember = false, index = null) => {
  const errors = [];
  const prefix = isMember ? `Member ${index + 1}: ` : '';

  switch (name) {
    case 'firstName':
    case 'lastName':
      if (!value || !value.trim()) {
        errors.push(`${prefix}${name === 'firstName' ? 'First' : 'Last'} name is required`);
      } else if (!nameRegex.test(value.trim())) {
        errors.push(`${prefix}${name === 'firstName' ? 'First' : 'Last'} name can only contain letters, spaces, hyphens, and apostrophes`);
      } else if (value.trim().length > 50) {
        errors.push(`${prefix}${name === 'firstName' ? 'First' : 'Last'} name cannot exceed 50 characters`);
      }
      break;

    case 'email':
      if (!value || !value.trim()) {
        errors.push(`${prefix}Email is required`);
      } else if (!emailRegex.test(value.trim())) {
        errors.push(`${prefix}Please enter a valid email address`);
      }
      break;

    case 'whatsappNumber':
      if (!value || !value.trim()) {
        errors.push(`${prefix}WhatsApp number is required`);
      } else {
        const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
        if (!phoneRegex.test(cleanPhone)) {
          errors.push(`${prefix}Please enter a valid phone number`);
        }
      }
      break;

    case 'gender':
      if (!value) {
        errors.push(`${prefix}Gender is required`);
      } else if (!validGenders.includes(value.toLowerCase())) {
        errors.push(`${prefix}Gender must be one of: male, female, other, prefer-not-to-say`);
      }
      break;

    case 'age':
      if (!value) {
        errors.push(`${prefix}Age is required`);
      } else {
        const age = Number(value);
        if (isNaN(age) || age <= 0 || age > 150 || !Number.isInteger(age)) {
          errors.push(`${prefix}Age must be a positive integer between 1 and 150`);
        }
      }
      break;

    case 'grade':
      if (!value || !value.toString().trim()) {
        errors.push(`${prefix}Grade is required`);
      } else if (!gradeRegex.test(value.toString().trim())) {
        errors.push(`${prefix}Please enter a valid grade (9-13, University, or College)`);
      }
      break;

    case 'schoolName':
      if (!value || !value.trim()) {
        errors.push('School name is required');
      } else if (value.trim().length > 100) {
        errors.push('School name cannot exceed 100 characters');
      }
      break;

    case 'password':
      if (!value) {
        errors.push('Password is required');
      } else if (value.length < 6) {
        errors.push('Password must be at least 6 characters long');
      }
      break;

    default:
      break;
  }

  return errors;
};

const validateAllFields = (formData, membersData) => {
  const errors = {};
  let hasErrors = false;

  // Validate main form fields
  Object.keys(formData).forEach(field => {
    const fieldErrors = validateField(field, formData[field]);
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
      hasErrors = true;
    }
  });

  // Validate members
  if (membersData && membersData.length > 0) {
    errors.members = [];
    
    membersData.forEach((member, index) => {
      const memberErrors = {};
      let memberHasErrors = false;
      
      Object.keys(member).forEach(field => {
        const fieldErrors = validateField(field, member[field], true, index);
        if (fieldErrors.length > 0) {
          memberErrors[field] = fieldErrors;
          memberHasErrors = true;
          hasErrors = true;
        }
      });
      
      if (memberHasErrors) {
        errors.members[index] = memberErrors;
      }
    });
  }

  return { errors, hasErrors };
};

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
  const [touched, setTouched] = useState({});
  const tokenHeader = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  // Grade options for 9-13 and university only
  const gradeOptions = [
    { value: '', label: 'Select Grade' },
    { value: '9', label: 'Grade 9' },
    { value: '10', label: 'Grade 10' },
    { value: '11', label: 'Grade 11' },
    { value: '12', label: 'Grade 12' },
    { value: '13', label: 'Grade 13' },
    { value: 'University', label: 'University' },
    { value: 'College', label: 'College' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Validate field when it changes and has been touched
    if (touched[name]) {
      const fieldErrors = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: fieldErrors
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate field when it loses focus
    const fieldErrors = validateField(name, form[name]);
    setErrors(prev => ({
      ...prev,
      [name]: fieldErrors
    }));
  };

  const handleAddMember = () => {
    setMembers([...members, { 
      firstName: '', 
      lastName: '', 
      email: '', 
      whatsappNumber: '', 
      grade: '', 
      gender: '', 
      age: '' 
    }]);
  };

  const handleMemberChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...members];
    updated[index][name] = value;
    setMembers(updated);
    
    // Validate member field when it changes and has been touched
    if (touched[`member-${index}-${name}`]) {
      const fieldErrors = validateField(name, value, true, index);
      setErrors(prev => ({
        ...prev,
        members: {
          ...prev.members,
          [index]: {
            ...(prev.members && prev.members[index]),
            [name]: fieldErrors
          }
        }
      }));
    }
  };

  const handleMemberBlur = (index, e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [`member-${index}-${name}`]: true }));
    
    // Validate member field when it loses focus
    const fieldErrors = validateField(name, members[index][name], true, index);
    setErrors(prev => ({
      ...prev,
      members: {
        ...prev.members,
        [index]: {
          ...(prev.members && prev.members[index]),
          [name]: fieldErrors
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched to show all errors
    const allTouched = {};
    Object.keys(form).forEach(key => { allTouched[key] = true; });
    members.forEach((member, index) => {
      Object.keys(member).forEach(key => {
        allTouched[`member-${index}-${key}`] = true;
      });
    });
    setTouched(allTouched);
    
    // Validate all fields
    const { errors: validationErrors, hasErrors } = validateAllFields(form, members);
    setErrors(validationErrors);
    
    if (hasErrors) {
      toast.error('Please fix the validation errors');
      return;
    }
    
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
      if (err.response?.data?.errors) {
        // Backend validation errors
        const backendErrors = err.response.data.errors;
        toast.error(backendErrors.join(', '));
      } else {
        toast.error(err.response?.data?.message || 'Failed to add user');
      }
    }
  };

  const getError = (fieldName) => {
    return errors[fieldName] && errors[fieldName][0];
  };

  const getMemberError = (index, fieldName) => {
    return errors.members && 
           errors.members[index] && 
           errors.members[index][fieldName] && 
           errors.members[index][fieldName][0];
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
                required 
                value={form.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`border p-2 rounded w-full ${getError('firstName') ? 'border-red-500' : ''}`} 
              />
              {getError('firstName') && <p className="text-red-500 text-xs mt-1">{getError('firstName')}</p>}
            </div>
            
            <div>
              <input 
                name="lastName" 
                placeholder="Last Name" 
                value={form.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`border p-2 rounded w-full ${getError('lastName') ? 'border-red-500' : ''}`} 
              />
              {getError('lastName') && <p className="text-red-500 text-xs mt-1">{getError('lastName')}</p>}
            </div>
            
            <div className="col-span-2">
              <input 
                name="email" 
                placeholder="Email" 
                required 
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`border p-2 rounded w-full ${getError('email') ? 'border-red-500' : ''}`} 
              />
              {getError('email') && <p className="text-red-500 text-xs mt-1">{getError('email')}</p>}
            </div>
            
            <div className="col-span-2">
              <input 
                name="password" 
                type="password" 
                placeholder="Password" 
                required 
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`border p-2 rounded w-full ${getError('password') ? 'border-red-500' : ''}`} 
              />
              {getError('password') && <p className="text-red-500 text-xs mt-1">{getError('password')}</p>}
            </div>
            
            <div>
              <input 
                name="whatsappNumber" 
                placeholder="WhatsApp Number" 
                value={form.whatsappNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`border p-2 rounded w-full ${getError('whatsappNumber') ? 'border-red-500' : ''}`} 
              />
              {getError('whatsappNumber') && <p className="text-red-500 text-xs mt-1">{getError('whatsappNumber')}</p>}
            </div>
            
            <div>
              <input 
                name="schoolName" 
                placeholder="School Name" 
                value={form.schoolName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`border p-2 rounded w-full ${getError('schoolName') ? 'border-red-500' : ''}`} 
              />
              {getError('schoolName') && <p className="text-red-500 text-xs mt-1">{getError('schoolName')}</p>}
            </div>
            
            <div>
              <select 
                name="grade" 
                value={form.grade}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`border p-2 rounded w-full ${getError('grade') ? 'border-red-500' : ''}`}
              >
                {gradeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {getError('grade') && <p className="text-red-500 text-xs mt-1">{getError('grade')}</p>}
            </div>
            
            <div>
              <select 
                name="gender" 
                value={form.gender}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`border p-2 rounded w-full ${getError('gender') ? 'border-red-500' : ''}`}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
              {getError('gender') && <p className="text-red-500 text-xs mt-1">{getError('gender')}</p>}
            </div>
            
            <div>
              <input 
                name="age" 
                placeholder="Age" 
                type="number" 
                value={form.age}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`border p-2 rounded w-full ${getError('age') ? 'border-red-500' : ''}`} 
              />
              {getError('age') && <p className="text-red-500 text-xs mt-1">{getError('age')}</p>}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Team Members</h4>
            {members.map((m, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 mb-4 p-3 border rounded-lg">
                <div>
                  <input 
                    name="firstName" 
                    placeholder="First Name" 
                    value={m.firstName}
                    onChange={(e) => handleMemberChange(i, e)}
                    onBlur={(e) => handleMemberBlur(i, e)}
                    className={`border p-2 rounded w-full ${getMemberError(i, 'firstName') ? 'border-red-500' : ''}`} 
                  />
                  {getMemberError(i, 'firstName') && <p className="text-red-500 text-xs mt-1">{getMemberError(i, 'firstName')}</p>}
                </div>
                
                <div>
                  <input 
                    name="lastName" 
                    placeholder="Last Name" 
                    value={m.lastName}
                    onChange={(e) => handleMemberChange(i, e)}
                    onBlur={(e) => handleMemberBlur(i, e)}
                    className={`border p-2 rounded w-full ${getMemberError(i, 'lastName') ? 'border-red-500' : ''}`} 
                  />
                  {getMemberError(i, 'lastName') && <p className="text-red-500 text-xs mt-1">{getMemberError(i, 'lastName')}</p>}
                </div>
                
                <div>
                  <input 
                    name="email" 
                    placeholder="Email" 
                    value={m.email}
                    onChange={(e) => handleMemberChange(i, e)}
                    onBlur={(e) => handleMemberBlur(i, e)}
                    className={`border p-2 rounded w-full ${getMemberError(i, 'email') ? 'border-red-500' : ''}`} 
                  />
                  {getMemberError(i, 'email') && <p className="text-red-500 text-xs mt-1">{getMemberError(i, 'email')}</p>}
                </div>
                
                <div>
                  <input 
                    name="whatsappNumber" 
                    placeholder="WhatsApp Number" 
                    value={m.whatsappNumber}
                    onChange={(e) => handleMemberChange(i, e)}
                    onBlur={(e) => handleMemberBlur(i, e)}
                    className={`border p-2 rounded w-full ${getMemberError(i, 'whatsappNumber') ? 'border-red-500' : ''}`} 
                  />
                  {getMemberError(i, 'whatsappNumber') && <p className="text-red-500 text-xs mt-1">{getMemberError(i, 'whatsappNumber')}</p>}
                </div>
                
                <div>
                  <select 
                    name="grade" 
                    value={m.grade}
                    onChange={(e) => handleMemberChange(i, e)}
                    onBlur={(e) => handleMemberBlur(i, e)}
                    className={`border p-2 rounded w-full ${getMemberError(i, 'grade') ? 'border-red-500' : ''}`}
                  >
                    {gradeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {getMemberError(i, 'grade') && <p className="text-red-500 text-xs mt-1">{getMemberError(i, 'grade')}</p>}
                </div>
                
                <div>
                  <select 
                    name="gender" 
                    value={m.gender}
                    onChange={(e) => handleMemberChange(i, e)}
                    onBlur={(e) => handleMemberBlur(i, e)}
                    className={`border p-2 rounded w-full ${getMemberError(i, 'gender') ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                  {getMemberError(i, 'gender') && <p className="text-red-500 text-xs mt-1">{getMemberError(i, 'gender')}</p>}
                </div>
                
                <div>
                  <input 
                    name="age" 
                    type="number" 
                    placeholder="Age" 
                    value={m.age}
                    onChange={(e) => handleMemberChange(i, e)}
                    onBlur={(e) => handleMemberBlur(i, e)}
                    className={`border p-2 rounded w-full ${getMemberError(i, 'age') ? 'border-red-500' : ''}`} 
                  />
                  {getMemberError(i, 'age') && <p className="text-red-500 text-xs mt-1">{getMemberError(i, 'age')}</p>}
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