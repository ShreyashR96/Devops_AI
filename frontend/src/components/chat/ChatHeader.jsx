import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ChatHeader({ isConnected, onLogout }) {
  const navigate = useNavigate();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 bg-[#ffe17c] border-2 border-black rounded-2xl p-4 mb-6 shadow-[8px_8px_0px_0px_#000]">
      
      {/* 1. Made the logo/title a clickable link back to Home */}
      <div 
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => navigate('/')}
        title="Return to Home"
      >
        <div className="w-10 h-10 bg-black border-2 border-black flex items-center justify-center group-hover:scale-105 transition-transform">
          <span className="text-[#ffe17c] font-black text-xl"> </span>
        </div>
        <h1 className="font-heading font-extrabold text-3xl tracking-tighter text-black group-hover:underline">DEVAGENT 'S DASHBOARD</h1>
      </div>
      
      <div className="flex items-center gap-3">
        {/* 2. Explicit Home Button */}
        <button 
          onClick={() => navigate('/')}
          className="px-4 py-1.5 font-bold text-sm bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] transition-all"
        >
          HOME
        </button>

        {/* Socket Status Component */}
        <div className="flex items-center gap-2 border-2 border-black bg-white px-3 py-1 rounded-full shadow-[2px_2px_0px_0px_#000]">
          <div className={`w-3 h-3 rounded-full border-2 border-black ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="font-bold text-sm text-black uppercase hidden sm:inline">
            {isConnected ? 'Socket Active' : 'Disconnected'}
          </span>
        </div>

        {/* 3. Fixed the missing Logout functionality */}
        {onLogout && (
          <button 
            onClick={onLogout}
            className="px-4 py-1.5 font-bold text-sm bg-[#ff5f57] border-2 border-black rounded-full shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] transition-all"
          >
            LOGOUT
          </button>
        )}
      </div>
    </header>
  );
}