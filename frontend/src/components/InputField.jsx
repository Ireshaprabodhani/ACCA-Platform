import React, { forwardRef } from 'react';

const InputField = forwardRef(({ label, type = 'text', value, onChange, name, placeholder, className = '' }, ref) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-800 mb-1">{label}</label>
      <input
        ref={ref}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-lg border border-white/40
  bg-white/70 backdrop-blur-sm text-black 
  placeholder:text-gray-700 placeholder:opacity-90
  focus:outline-none focus:border-yellow-400 focus:bg-white
  transition-all duration-300 hover:bg-white ${className}`}
      />
    </div>
  );
});

export default InputField;
