import React, { forwardRef } from 'react';

const InputField = forwardRef(
  ({ label, type = 'text', value, onChange, name, placeholder, className = '' }, ref) => {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-white mb-1">
          {label}
        </label>
        <input
          ref={ref}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-4 py-3 rounded-lg border border-white/40
  bg-[#00000080] backdrop-blur-sm text-white 
  placeholder:text-gray-300 placeholder:opacity-90
  focus:outline-none focus:border-yellow-400 focus:bg-black
  transition-all duration-300 hover:bg-black ${className}`}
        />
      </div>
    );
  }
);

export default InputField;
