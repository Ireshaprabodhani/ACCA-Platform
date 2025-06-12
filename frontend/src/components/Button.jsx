import React from 'react';

const Button = ({ label, onClick, type = 'button', className = '' }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-4 py-2 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 transition ${className}`}
    >
      {label}
    </button>
  );
};

export default Button;