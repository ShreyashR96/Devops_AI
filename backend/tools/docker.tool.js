import { spawn } from 'child_process';

export const runDockerTool = async (commandType, onLog) => {
    return new Promise((resolve, reject) => {
        try {
            let cmdString = 'docker ';
            
            if (commandType === 'ps') {
                cmdString += 'ps -a';
            } else if (commandType === 'images') {
                cmdString += 'images';
            } else {
                throw new Error('Unsupported Docker command type requested.');
            }

            const child = spawn(cmdString, { shell: true });
            let fullOutput = '';

            child.stdout.on('data', (data) => {
                const chunk = data?.toString();
                fullOutput += chunk;
                if (onLog) onLog(chunk);
            });

            child.stderr.on('data', (data) => {
                const chunk = data?.toString();
                fullOutput += chunk;
                if (onLog) onLog(chunk);
            });

            child.on('close', (code) => {
                if (code !== 0) {
                    resolve(fullOutput || `Process exited with code ${code}`);
                } else {
                    resolve(fullOutput || 'Command executed successfully.');
                }
            });

            child.on('error', (error) => {
                reject(new Error(`Failed to spawn Docker process. Details: ${error?.message}`));
            });

        } catch (error) {
            reject(new Error(`System tool execution failed. System details: ${error?.message}`));
        }
    });
};