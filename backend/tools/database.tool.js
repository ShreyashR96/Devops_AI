import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export const executeDbShellCommand = async (commandString) => {
    try {
        const { stdout, stderr } = await execPromise(commandString);
        
        // Some DB CLIs output warnings to stderr even when successful
        if (stderr && !stdout) {
            console.warn('[Database Tool] Stderr output:', stderr);
        }
        
        return stdout || 'Command executed successfully, but returned no output.';
    } catch (error) {
        throw new Error(`Database execution failed. Ensure the CLI tools (mongosh, redis-cli, pg_isready, etc.) are installed and the database is running. Details: ${error?.message}`);
    }
};