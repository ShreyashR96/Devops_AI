import React from 'react';

export default function Button({ children, onClick, disabled, type = "button", className = '' }) {
  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 bg-black text-white border-2 border-black rounded-xl font-bold tracking-wide transition-all duration-200 shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_#000] ${className}`}
    >
      {children}
    </button>
  );
}