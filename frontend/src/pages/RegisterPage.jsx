import React, { useState } from 'react';
import axios                    from 'axios';
import { useNavigate }          from 'react-router-dom';

const InputField = ({
  label,
  name,                    
  type = 'text',
  value,
  onChange,
  required = true,
  placeholder = ''
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      name={name}          
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg
                 focus:outline-none focus:ring-2 focus:ring-purple-500
                 focus:border-transparent"
    />
  </div>
);

const Dropdown = ({
  label,
  name,                   
  value,
  onChange,
  options,
  required = true
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <select
      name={name}          
      value={value}
      onChange={onChange}
      required={required}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg
                 focus:outline-none focus:ring-2 focus:ring-purple-500
                 focus:border-transparent"
    >
      <option value="">Select {label}</option>
      {options.map(o => (
        <option key={o}>{o}</option>
      ))}
    </select>
  </div>
);

const Button = ({ label, onClick, type='button', variant='primary', className='' }) => {
  const styles = {
    primary  : 'bg-purple-600 text-white hover:bg-purple-700',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
    danger   : 'bg-red-500 text-white hover:bg-red-600',
    success  : 'bg-green-500 text-white hover:bg-green-600',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition ${styles[variant]} ${className}`}
    >
      {label}
    </button>
  );
};


export default function RegisterPage() {
  const navigate = useNavigate();

  
  const emptyMember = () => ({
    firstName:'', lastName:'', whatsappNumber:'', email:'',
    gender:'', age:'', grade:''
  });

  const [form, setForm] = useState({
    firstName:'', lastName:'', whatsappNumber:'', email:'', gender:'', age:'',
    password:'', confirmPassword:'', schoolName:'', grade:'',
    members:[]
  });

  const onMainChange   = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const onMemberChange = (i, field, val) => setForm(p => {
    const m=[...p.members]; m[i][field]=val; return { ...p, members:m };
  });

  const addMember    = () => setForm(p => ({ ...p, members:[...p.members, emptyMember()] }));
  const removeMember = i => setForm(p => ({ ...p, members:p.members.filter((_,idx)=>idx!==i) }));

  /* ----- submit ----- */
  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match'); return;
    }

    try {
      await axios.post('https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/auth/register', {
        firstName     : form.firstName,
        lastName      : form.lastName,
        whatsappNumber: form.whatsappNumber,
        email         : form.email,
        gender        : form.gender,
        age           : form.age,
        password      : form.password,
        grade         : form.grade,
        schoolName    : form.schoolName,
        members       : form.members,
      });

      alert('Registration successful! Please log in.');
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
      const msg = err.response?.data?.message || 'Registration failed.';
      alert(msg);
    }
  };

  /* ----- UI ----- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-yellow-400
                    flex items-center justify-center p-6">
      <form onSubmit={handleSubmit}
            className="bg-white bg-opacity-95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl
                       max-w-5xl w-full max-h-[90vh] overflow-auto">

        {/* -------- heading -------- */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600
                         bg-clip-text text-transparent mb-2">
            🎯 Register Your Team
          </h2>
          <p className="text-gray-600 font-medium">Join the ultimate learning challenge!</p>
        </div>

        
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200 mb-8">
          <h3 className="text-2xl font-bold text-purple-700 mb-6">👑 Team Leader Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="First Name"          name="firstName"      value={form.firstName}      onChange={onMainChange}/>
            <InputField label="Last Name"           name="lastName"       value={form.lastName}       onChange={onMainChange}/>
            <InputField label="WhatsApp Number"     name="whatsappNumber" value={form.whatsappNumber} onChange={onMainChange}/>
            <InputField label="Email Address" type="email"
                        name="email"            value={form.email}        onChange={onMainChange}/>
            <Dropdown   label="Gender"              name="gender"         value={form.gender}
                        onChange={onMainChange}   options={['Male','Female','Other']}/>
            <InputField label="Age"        type="number" name="age"        value={form.age}        onChange={onMainChange}/>
            <InputField label="Password"   type="password" name="password" value={form.password}   onChange={onMainChange}/>
            <InputField label="Confirm Password" type="password"
                        name="confirmPassword"    value={form.confirmPassword} onChange={onMainChange}/>
            <InputField label="School / Institute" name="schoolName" value={form.schoolName} onChange={onMainChange}/>
            <InputField label="Grade"              name="grade"      value={form.grade}      onChange={onMainChange}/>
          </div>
        </div>

       
        <div className="bg-gradient-to-r from-yellow-50 to-pink-50 p-6 rounded-xl border-2 border-yellow-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-purple-700">👥 Team Members ({form.members.length})</h3>
            <Button label="➕ Add Member" onClick={addMember} variant="success" />
          </div>

          {form.members.length === 0 && (
            <p className="text-center text-gray-500 py-8">No members added yet.</p>
          )}

          {form.members.map((m, idx) => (
            <div key={idx}
                 className={`p-6 rounded-xl border-2 mb-6 ${
                   idx%3===0 ? 'bg-pink-50  border-pink-200'  :
                   idx%3===1 ? 'bg-yellow-50 border-yellow-200' :
                               'bg-purple-50 border-purple-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-semibold text-purple-700">👤 Member {idx+1}</h4>
                <Button label="🗑 Remove" variant="danger" onClick={()=>removeMember(idx)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="First Name" value={m.firstName}
                            onChange={e=>onMemberChange(idx,'firstName',e.target.value)} required={false}/>
                <InputField label="Last Name"  value={m.lastName}
                            onChange={e=>onMemberChange(idx,'lastName',e.target.value)}  required={false}/>
                <InputField label="WhatsApp"   value={m.whatsappNumber}
                            onChange={e=>onMemberChange(idx,'whatsappNumber',e.target.value)} required={false}/>
                <InputField label="Email" type="email" value={m.email}
                            onChange={e=>onMemberChange(idx,'email',e.target.value)} required={false}/>
                <Dropdown   label="Gender" value={m.gender}
                            onChange={e=>onMemberChange(idx,'gender',e.target.value)}
                            options={['Male','Female','Other']} required={false}/>
                <InputField label="Age" type="number" value={m.age}
                            onChange={e=>onMemberChange(idx,'age',e.target.value)} required={false}/>
                <InputField label="Grade" value={m.grade}
                            onChange={e=>onMemberChange(idx,'grade',e.target.value)} required={false}/>
              </div>
            </div>
          ))}

          {form.members.length > 0 && (
            <div className="flex justify-center gap-4">
              <Button label="➕ Add Another" onClick={addMember} variant="success"/>
              <Button label="🗑 Clear All"   onClick={()=>setForm(p=>({...p, members:[]}))} variant="danger"/>
            </div>
          )}
        </div>

        
        <div className="text-center pt-6">
          <Button
            type="submit"
            variant="primary"
            label={`🚀 Register Team${form.members.length ? ` (${form.members.length+1})` : ''}`}
            className="text-lg font-bold px-8 py-4 min-w-60"
          />
          <p className="mt-4 text-sm text-gray-600">
            Already registered?{' '}
            <button type="button"
                    onClick={()=>navigate('/login')}
                    className="text-purple-600 hover:text-purple-800 font-semibold underline">
              Log in here
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
