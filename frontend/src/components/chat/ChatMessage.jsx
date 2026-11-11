import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MonitoringWidget from './MonitoringWidget'; // <-- Import the new widget

export default function ChatMessage({ chat }) {
  const getAgentColor = (agentName) => {
    const colors = {
      'Docker': 'bg-[#28c840]',
      'Monitoring': 'bg-[#ffe17c]',
      'Database': 'bg-[#febc2e]',
      'Documentation': 'bg-[#b7c6c2]',
      'Deployment': 'bg-[#ff5f57]',
      'Orchestrator': 'bg-white',
      'Error': 'bg-red-500'
    };
    return colors[agentName] ?? 'bg-gray-300';
  };

  if (chat?.role === 'user') {
    return (
      <div className="flex flex-col items-end">
        <div className="bg-[#b7c6c2] border-2 border-black rounded-xl p-4 max-w-[80%] shadow-[4px_4px_0px_0px_#000]">
          <p className="font-bold text-black">{chat?.message}</p>
        </div>
      </div>
    );
  }

  const isMarkdown = chat?.agent === 'Documentation' || (typeof chat?.output === 'string' && chat?.output?.includes('```'));

  return (
    <div className="flex flex-col items-start">
      <div className="bg-[#171e19] border-2 border-black rounded-xl p-6 max-w-[95%] shadow-[4px_4px_0px_0px_#000] text-white w-full transition-all">
        
        <div className="flex items-center gap-2 mb-4 border-b-2 border-[#272727] pb-3">
          <div className={`w-3 h-3 rounded-full border-2 border-black ${getAgentColor(chat?.agent)} ${chat?.isStreaming ? 'animate-bounce' : ''}`}></div>
          <span className="font-heading font-bold text-sm tracking-wide text-[#b7c6c2]">
            {chat?.agent?.toUpperCase()} AGENT
          </span>
          {chat?.status && (
            <span className={`ml-auto text-xs font-mono px-2 py-1 rounded border border-black ${chat?.isStreaming ? 'bg-[#ffe17c] text-black animate-pulse' : 'bg-[#272727] text-[#ffe17c]'}`}>
              STATUS: {chat?.status}
            </span>
          )}
        </div>
        
        <p className="font-medium text-lg mb-4">{chat?.message}</p>
        
        {/* Render the interactive chart if the output flag matches */}
        {chat?.output === "CHART_WIDGET" ? (
          <MonitoringWidget />
        ) : (
          /* Render standard text/markdown if it's not a chart */
          chat?.output !== null && chat?.output !== undefined && (
            isMarkdown ? (
              <div className="bg-white text-black border-2 border-black p-6 rounded-xl mt-4 prose prose-black max-w-none shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.05)] overflow-x-auto">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => <h1 className="font-heading font-black text-3xl border-b-2 border-black pb-2 mb-4" {...props} />,
                    h2: ({node, ...props}) => <h2 className="font-heading font-bold text-2xl mt-6 mb-3" {...props} />,
                    h3: ({node, ...props}) => <h3 className="font-heading font-bold text-xl mt-4 mb-2" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 font-medium" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 font-medium" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                    code: ({node, inline, className, children, ...props}) => {
                      return inline 
                        ? <code className="bg-[#f4f4f5] border border-black px-1 py-0.5 rounded text-sm font-bold" {...props}>{children}</code>
                        : <code className="block bg-[#171e19] text-green-400 p-4 rounded border-2 border-black font-mono text-sm overflow-x-auto my-4 whitespace-pre-wrap" {...props}>{children}</code>
                    }
                  }}
                >
                  {chat?.output}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="bg-black border-2 border-gray-700 p-4 rounded-xl mt-4 overflow-x-auto shadow-[inset_4px_4px_0px_0px_rgba(255,255,255,0.05)]">
                <pre className="font-mono text-sm text-green-400 whitespace-pre-wrap flex flex-col">
                  <span>{chat?.output}</span>
                  {chat?.isStreaming && (
                    <span className="inline-block w-2 h-4 bg-green-400 animate-pulse mt-1"></span>
                  )}
                </pre>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}