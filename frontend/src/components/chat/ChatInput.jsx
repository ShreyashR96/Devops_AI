import React, { useState } from 'react';
import Button from '../ui/Button';

export default function ChatInput({ onSubmit, isLoading }) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!prompt?.trim() || isLoading) return;
    
    onSubmit(prompt);
    setPrompt('');
  };

  return (
    <div className="p-4 bg-white border-t-2 border-black">
      <form onSubmit={handleSubmit} className="flex gap-4">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e?.target?.value)}
          placeholder="E.g., Deploy the backend, Check CPU usage, Show running containers..."
          disabled={isLoading}
          className="flex-grow bg-[#f4f4f5] border-2 border-black rounded-xl px-4 py-3 font-medium text-black focus:outline-none focus:ring-4 focus:ring-[#ffe17c] transition-all disabled:opacity-50"
        />
        <Button type="submit" disabled={isLoading || !prompt?.trim()}>
          Execute
        </Button>
      </form>
    </div>
  );
}