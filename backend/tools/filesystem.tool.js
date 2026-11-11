import fs from 'fs/promises';
import path from 'path';

// Safely generate a tree of the project directory
export const getProjectStructure = async (dirPath = '.', depth = 0, maxDepth = 3) => {
    try {
        if (depth > maxDepth) return '';

        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        let structure = '';

        for (const entry of entries) {
            // Ignore heavy or irrelevant directories
            if (['node_modules', '.git', 'dist', 'build', '.env'].includes(entry.name)) {
                continue;
            }

            const indent = '  '.repeat(depth);
            structure += `${indent}- ${entry.name}${entry.isDirectory() ? '/' : ''}\n`;

            if (entry.isDirectory()) {
                const subDirPath = path.join(dirPath, entry.name);
                structure += await getProjectStructure(subDirPath, depth + 1, maxDepth);
            }
        }
        return structure;
    } catch (error) {
        throw new Error(`Failed to read directory structure: ${error.message}`);
    }
};

// Safely read a specific file's content
export const readFileContent = async (filePath) => {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return content;
    } catch (error) {
        // Return null instead of throwing so a missing file doesn't crash the whole agent
        return null; 
    }
};

// Safely write the generated markdown to a file
export const writeFileContent = async (fileName, content) => {
    try {
        const filePath = path.join(process.cwd(), fileName);
        await fs.writeFile(filePath, content, 'utf-8');
        return filePath;
    } catch (error) {
        throw new Error(`Failed to write file ${fileName}: ${error.message}`);
    }
};