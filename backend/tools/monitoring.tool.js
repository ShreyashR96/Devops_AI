import os from 'os';

let previousCpus = os.cpus();

export const getSystemMetrics = () => {
    try {
        // Calculate RAM Usage
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const ramUsage = ((usedMemory / totalMemory) * 100).toFixed(2);

        // Calculate CPU Usage Delta
        let startIdle = 0, startTotal = 0;
        let endIdle = 0, endTotal = 0;

        const currentCpus = os.cpus();

        previousCpus?.forEach(cpu => {
            for (let type in cpu?.times) startTotal += cpu.times[type];
            startIdle += cpu?.times?.idle;
        });

        currentCpus?.forEach(cpu => {
            for (let type in cpu?.times) endTotal += cpu.times[type];
            endIdle += cpu?.times?.idle;
        });

        const idleDelta = endIdle - startIdle;
        const totalDelta = endTotal - startTotal;
        const cpuUsage = totalDelta === 0 ? 0 : (100 - (100 * idleDelta / totalDelta)).toFixed(2);

        // Save current CPU state for the next tick
        previousCpus = currentCpus;

        return {
            cpu: parseFloat(cpuUsage),
            ram: parseFloat(ramUsage),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
    } catch (error) {
        console.error("Failed to read system metrics:", error);
        return { cpu: 0, ram: 0, timestamp: '00:00:00' };
    }
};