import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { socket } from '../../services/socket';

export default function MonitoringWidget() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Request the backend to start sending telemetry
    socket.emit('start_metrics');

    const handleNewMetrics = (metrics) => {
      setData((prevData) => {
        const newData = [...prevData, metrics];
        // Keep the array length to the last 20 data points for a smooth scrolling chart
        if (newData?.length > 20) newData.shift();
        return newData;
      });
    };

    socket.on('metrics_data', handleNewMetrics);

    return () => {
      // Cleanup when the user closes the dashboard or unmounts the component
      socket.emit('stop_metrics');
      socket.off('metrics_data', handleNewMetrics);
    };
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-white border-2 border-black p-3 rounded shadow-[4px_4px_0px_0px_#000]">
          <p className="font-bold text-black border-b-2 border-black pb-1 mb-2">{label}</p>
          <p className="font-mono font-bold text-[#ff5f57]">CPU: {payload[0]?.value}%</p>
          <p className="font-mono font-bold text-[#28c840]">RAM: {payload[1]?.value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border-2 border-black rounded-xl p-6 mt-4 shadow-[4px_4px_0px_0px_#000] w-full">
      <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4">
        <h3 className="font-heading font-black text-2xl text-black">LIVE SYSTEM TELEMETRY</h3>
        <div className="flex items-center gap-2">
           <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse border border-black"></div>
           <span className="font-bold text-xs uppercase tracking-wider">Recording</span>
        </div>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#272727" opacity={0.2} />
            <XAxis dataKey="timestamp" stroke="#000" tick={{fontFamily: 'Satoshi', fontWeight: 700, fontSize: 12}} />
            <YAxis stroke="#000" domain={[0, 100]} tick={{fontFamily: 'Satoshi', fontWeight: 700, fontSize: 12}} />
            <Tooltip content={<CustomTooltip />} />
            
            <Area 
              type="monotone" 
              dataKey="cpu" 
              stroke="#ff5f57" 
              strokeWidth={3}
              fill="#ff5f57" 
              fillOpacity={0.2} 
              isAnimationActive={false} // Disable default animation for real-time snap feel
            />
            <Area 
              type="monotone" 
              dataKey="ram" 
              stroke="#28c840" 
              strokeWidth={3}
              fill="#28c840" 
              fillOpacity={0.2} 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex gap-6 pt-4 border-t-2 border-black font-mono font-bold text-sm">
         <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#ff5f57] border-2 border-black"></div>
            <span>CPU Core Avg</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#28c840] border-2 border-black"></div>
            <span>System RAM</span>
         </div>
      </div>
    </div>
  );
}