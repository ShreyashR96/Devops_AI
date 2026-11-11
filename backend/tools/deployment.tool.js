import { spawn } from 'child_process';

// Use spawn instead of exec to stream data chunks in real-time
export const executeDeploymentCommand = async (commandString, onLog, projectPath = process.cwd()) => {
    return new Promise((resolve, reject) => {
        try {
            const child = spawn(commandString, { shell: true, cwd: projectPath });
            let fullOutput = '';

            // Stream standard output
            child.stdout.on('data', (data) => {
                const chunk = data?.toString();
                fullOutput += chunk;
                if (onLog) onLog(chunk);
            });

            // Stream standard error (warnings/errors)
            child.stderr.on('data', (data) => {
                const chunk = data?.toString();
                fullOutput += chunk;
                if (onLog) onLog(chunk);
                console.warn('[Deployment Tool] Stderr stream:', chunk);
            });

            // Resolve the promise only when the process finishes
            child.on('close', (code) => {
                if (code !== 0) {
                    // We still resolve instead of reject so the user sees the output and failure context
                    resolve(fullOutput || `Process exited with code ${code}`);
                } else {
                    resolve(fullOutput || 'Command executed successfully, but returned no output.');
                }
            });

            child.on('error', (error) => {
                reject(new Error(`Failed to spawn process. Details: ${error?.message}`));
            });
            
        } catch (error) {
            reject(new Error(`Deployment execution failed. Details: ${error?.message}`));
        }
    });
};