import { getSystemMetrics } from '../../tools/system.tool.js';

export const executeMonitoringCommand = async (prompt) => {
    try {
        console.log('[Monitoring Agent] Activating live system telemetry...');
        
        return {
            agent: "Monitoring",
            status: "Live",
            message: "System monitoring activated. Establishing real-time telemetry stream to your dashboard...",
            output: "CHART_WIDGET" // This exact string triggers the React component
        };
    } catch (error) {
        throw new Error(`Monitoring Agent execution failed: ${error?.message}`);
    }
};