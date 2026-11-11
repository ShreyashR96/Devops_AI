import React, { useState, useRef, useEffect, useContext } from 'react';
import { socket } from '../services/socket';
import { AuthContext } from '../context/AuthContext';
import ChatHeader from '../components/chat/ChatHeader';
import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';

export default function Dashboard() {
  const { token, logout } = useContext(AuthContext);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'system',
      agent: 'Orchestrator',
      message: 'System initialized. All DevOps agents standing by. Secured WebSocket connection established.',
      output: null
    }
  ]);
  
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Setup Socket Listeners
  useEffect(() => {
    if (!token) {
        console.warn("No token found, aborting socket connection.");
        return; 
    }

    // This MUST happen before .connect()
    socket.auth = { token }; 
    socket.connect();

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // Catch connection/authentication errors from the backend middleware
    socket.on('connect_error', (err) => {
      setIsConnected(false);
      setChatHistory((prev) => [
        ...prev, 
        { 
          role: 'system', 
          agent: 'Error',
          status: 'Auth Failed',
          message: 'WebSocket connection rejected.',
          output: err?.message,
          isStreaming: false
        }
      ]);
      
      // If the token is entirely invalid or expired, forcefully log the user out
      if (err?.message?.includes('Invalid or expired token')) {
          setTimeout(() => {
              logout();
          }, 3000);
      }
    });

    // Handle incoming terminal chunks
    socket.on('log_stream', (data) => {
      setChatHistory((prev) => {
        const newHistory = [...prev];
        const lastIndex = newHistory?.length - 1;
        
        if (newHistory[lastIndex]?.isStreaming) {
          newHistory[lastIndex] = {
            ...newHistory[lastIndex],
            output: (newHistory[lastIndex]?.output || '') + (data?.chunk || '')
          };
        }
        return newHistory;
      });
    });

    // Handle the final completion payload
    socket.on('response_complete', (payload) => {
      setChatHistory((prev) => {
        const newHistory = [...prev];
        const lastIndex = newHistory?.length - 1;
        
        newHistory[lastIndex] = {
          role: 'agent',
          agent: payload?.agent ?? 'System',
          status: payload?.status ?? 'Success',
          message: payload?.message ?? 'Action completed.',
          output: payload?.output ?? newHistory[lastIndex]?.output,
          isStreaming: false
        };
        return newHistory;
      });
      setIsLoading(false);
    });

    // Handle standard runtime backend errors
    socket.on('error', (err) => {
      setChatHistory((prev) => [
        ...prev, 
        { 
          role: 'system', 
          agent: 'Error',
          status: 'Failed',
          message: 'An error occurred during execution.',
          output: err?.message,
          isStreaming: false
        }
      ]);
      setIsLoading(false);
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('log_stream');
      socket.off('response_complete');
      socket.off('error');
      socket.disconnect();
    };
  }, [token, logout]);

  const handleSendMessage = (userPrompt) => {
    if (!userPrompt?.trim() || isLoading) return;

    setChatHistory((prev) => [
      ...prev, 
      { role: 'user', message: userPrompt },
      { 
        role: 'agent', 
        agent: 'Orchestrator', 
        status: 'Routing...', 
        message: 'Analyzing intent and connecting to local systems...', 
        output: '', 
        isStreaming: true 
      }
    ]);
    
    setIsLoading(true);

    socket.emit('send_prompt', { prompt: userPrompt });
  };

  return (
    <div className="min-h-screen bg-[#171e19] p-4 md:p-8 flex flex-col font-satoshi">
      <ChatHeader isConnected={isConnected} onLogout={logout} />

      <main className="flex-grow flex flex-col bg-white border-2 border-black rounded-2xl shadow-[8px_8px_0px_0px_#000] overflow-hidden">
        
        <div className="bg-black h-12 flex items-center px-4 gap-2 border-b-2 border-black shrink-0">
          <div className="w-4 h-4 rounded-full bg-[#ff5f57] border-2 border-black"></div>
          <div className="w-4 h-4 rounded-full bg-[#febc2e] border-2 border-black"></div>
          <div className="w-4 h-4 rounded-full bg-[#28c840] border-2 border-black"></div>
          <span className="text-white font-mono text-sm ml-4 opacity-70">bash - orchestrator-tty</span>
        </div>

        <div className="flex-grow p-6 overflow-y-auto bg-[#f4f4f5] flex flex-col gap-6">
          {chatHistory?.map((chat, idx) => (
            <ChatMessage key={idx} chat={chat} />
          ))}
          <div ref={chatEndRef} />
        </div>

        <ChatInput onSubmit={handleSendMessage} isLoading={isLoading} />
      </main>
    </div>
  );
}