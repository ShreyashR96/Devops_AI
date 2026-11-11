import ollama from 'ollama';
import fs from 'fs/promises';
import path from 'path';

function extractPathFromPrompt(rawPrompt) {
    if (!rawPrompt || typeof rawPrompt !== 'string') return null;

    // 1. GOLD STANDARD: Look for a path explicitly wrapped in quotes (e.g., "D:\My Folder")
    const quoteMatch = rawPrompt.match(/["']([A-Za-z]:[\\/][^"']+|(?:\.{1,2}\/|~\/|\/)[^"']+)["']/);
    if (quoteMatch) {
        return quoteMatch[1].trim(); 
    }

    // 2. FALLBACK: Windows path assumed to be at the very end of the sentence
    const winMatch = rawPrompt.match(/[A-Za-z]:[\\/].*$/);
    if (winMatch) {
        return winMatch[0]
            .trim()
            .replace(/[.,;!?]+$/, '')
            .replace(/\s+(?:please|now|thanks|thank you)$/i, '')
            .trim();
    }

    // 3. FALLBACK: Unix-style path (assumes no spaces)
    const unixMatch = rawPrompt.match(/(?:\.{1,2}\/|~\/|\/)[^\s"']+/);
    if (unixMatch) {
        return unixMatch[0].trim().replace(/[.,;!?]+$/, '');
    }

    return null;
}

// Corrected Export Name: executeDockerCommand
export const executeDockerCommand = async (prompt, onLog) => {
    try {
        if (onLog) onLog("> Parsing Docker generation instructions...\n");

        const extractedPath = extractPathFromPrompt(prompt);
        if (!extractedPath) {
            return {
                agent: "Docker",
                status: "Clarification Needed",
                message: "I need to know exactly which folder to generate the Docker files in.",
                output: "Please provide the path in your prompt. For example: 'Create a docker compose file in \"D:/Wall of Humanity/backend\"'."
            };
        }

        const resolvedPath = path.resolve(extractedPath);
        if (onLog) onLog(`> Target Path Resolved: ${resolvedPath}\n`);

        try {
            const stat = await fs.stat(resolvedPath);
            if (!stat.isDirectory()) throw new Error("Not a directory.");
        } catch (err) {
            return {
                agent: "Docker",
                status: "Failed",
                message: "Invalid Path provided.",
                output: `The directory does not exist or is inaccessible: ${resolvedPath}`
            };
        }

        const isCompose = /compose/i.test(prompt);
        const fileName = isCompose ? 'docker-compose.yml' : 'Dockerfile';
        if (onLog) onLog(`> Generating ${fileName}...\n`);

        const systemPrompt = `You are a Docker DevOps Agent. 
Generate ONLY the raw code for a ${fileName} based on the user's request.
RULES:
- Do NOT wrap the code in markdown blocks (no \`\`\`docker or \`\`\`yaml).
- Do NOT add conversational text. Output ONLY the raw file content.`;

        const response = await ollama.chat({
            model: 'qwen2.5:3b', 
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            options: { temperature: 0.2 }
        });

        let fileContent = response?.message?.content || '';
        fileContent = fileContent.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();

        const filePath = path.join(resolvedPath, fileName);
        await fs.writeFile(filePath, fileContent, 'utf-8');
        
        if (onLog) onLog(`> Successfully wrote ${fileName} to disk.\n\n`);

        return {
            agent: "Docker",
            status: "Success",
            message: `Successfully generated ${fileName}.`,
            output: `Saved ${fileName} to ${resolvedPath}`
        };

    } catch (error) {
        throw new Error(`Docker Agent execution failed: ${error?.message}`);
    }
};