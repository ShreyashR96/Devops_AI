import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env?.VITE_API_URL ?? 'http://localhost:3001';
      // Dynamically choose the endpoint based on the current mode
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response?.ok) {
        // This will now print the exact database crash reason on your screen
        throw new Error(data?.error ? `${data?.message}: ${data?.error}` : data?.message);
      }

      // Both register and login routes return a token and user object
      login(data?.token, data?.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ffe17c] bg-dot-pattern flex items-center justify-center p-4">
      <div className="bg-white border-2 border-black rounded-2xl p-8 max-w-md w-full shadow-[8px_8px_0px_0px_#000]">
        
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-black border-2 border-black flex items-center justify-center">
            <span className="text-[#ffe17c] font-black text-2xl">⚡</span>
          </div>
          <h1 className="font-heading font-extrabold text-4xl tracking-tighter text-black">DEVAGENTS'S</h1>
        </div>

        <h2 className="font-heading font-bold text-2xl mb-6 text-center border-b-2 border-black pb-4">
          {isRegistering ? 'INITIALIZE ADMIN' : 'AUTHORIZED PERSONNEL ONLY'}
        </h2>

        {error && (
          <div className="bg-[#ff5f57] border-2 border-black p-3 rounded font-bold text-black mb-6 shadow-[2px_2px_0px_0px_#000]">
            ERROR: {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label className="block font-bold text-sm mb-2 uppercase">Admin Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e?.target?.value)}
              className="w-full bg-[#f4f4f5] border-2 border-black p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-medium"
              placeholder="devops@flasho.ai"
              required
            />
          </div>
          <div>
            <label className="block font-bold text-sm mb-2 uppercase">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e?.target?.value)}
              className="w-full bg-[#f4f4f5] border-2 border-black p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-medium"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-black text-white font-bold text-lg py-4 border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] transition-all disabled:opacity-70 disabled:cursor-not-allowed uppercase"
          >
            {isLoading ? 'PROCESSING...' : isRegistering ? 'CREATE ACCOUNT' : 'SECURE LOGIN'}
          </button>
        </form>

        <div className="mt-6 text-center border-t-2 border-black pt-4">
          <button 
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
            }}
            className="font-bold text-sm underline decoration-2 hover:text-gray-600 transition-colors uppercase"
          >
            {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
          </button>
        </div>

      </div>
    </div>
  );
}