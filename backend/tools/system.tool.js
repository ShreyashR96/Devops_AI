import os from 'os';

export const getSystemMetrics = async (type) => {
    try {
        if (type === 'ram') {
            const total = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
            const free = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
            const used = (total - free).toFixed(2);
            const percentage = ((used / total) * 100).toFixed(1);
            
            return `RAM Usage: ${used} GB / ${total} GB (${percentage}%)`;
        }
        
        if (type === 'cpu') {
            const cpus = os.cpus();
            // Calculate a rough average of CPU load using loadavg (1, 5, 15 min averages)
            const load = os.loadavg(); 
            return `CPU: ${cpus.length} Cores | Model: ${cpus[0]?.model} | 1m Load Average: ${load[0]?.toFixed(2)}`;
        }
        
        if (type === 'os') {
            return `OS: ${os.type()} ${os.release()} (${os.arch()}) | Uptime: ${(os.uptime() / 3600).toFixed(2)} Hours`;
        }

        throw new Error('Unsupported metric type requested.');
    } catch (error) {
        throw new Error(`Failed to retrieve system metrics: ${error.message}`);
    }
};