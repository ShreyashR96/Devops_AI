import ollama from 'ollama';
import fs from 'fs/promises';
import path from 'path';

function extractPathFromPrompt(rawPrompt) {
    if (!rawPrompt || typeof rawPrompt !== 'string') return null;

    // 1. GOLD STANDARD: Look for a path explicitly wrapped in quotes
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

export const executeDatabaseCommand = async (prompt, onLog) => {
    try {
        if (onLog) onLog("> Parsing database architecture instructions...\n");

        const extractedPath = extractPathFromPrompt(prompt);
        if (!extractedPath) {
            return {
                agent: "Database",
                status: "Clarification Needed",
                message: "I need to know exactly which folder to generate the database files in.",
                output: "Please provide the path in your prompt. For example: 'Create a MongoDB User schema in \"D:/Wall of Humanity/backend/models\"'."
            };
        }

        const resolvedPath = path.resolve(extractedPath);
        if (onLog) onLog(`> Target Path Resolved: ${resolvedPath}\n`);

        try {
            const stat = await fs.stat(resolvedPath);
            if (!stat.isDirectory()) throw new Error("Not a directory.");
        } catch (err) {
            return {
                agent: "Database",
                status: "Failed",
                message: "Invalid Path provided.",
                output: `The directory does not exist or is inaccessible: ${resolvedPath}`
            };
        }

        if (onLog) onLog(`> Designing database schema/script...\n`);

        // The system prompt explicitly trains the LLM to declare its own filename
        // on line 1, avoiding the need for brittle JSON parsing.
        const systemPrompt = `You are an Expert Database Architect Agent.
Generate the database code requested by the user (e.g., Mongoose models, Prisma schemas, SQL migration scripts, or Seed data).

RULES:
1. The VERY FIRST line of your response MUST be exactly "FILENAME: <your_file_name>". (Example: "FILENAME: user.model.js" or "FILENAME: init.sql")
2. The rest of your response must be ONLY the raw code.
3. Do NOT wrap the code in markdown blocks (no \`\`\`javascript or \`\`\`sql).
4. Do NOT add conversational text.`;

        const response = await ollama.chat({
            model: 'qwen2.5:3b', 
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            options: { temperature: 0.2 }
        });

        let rawContent = response?.message?.content || '';
        
        // Defensive cleanup in case the LLM disobeys and includes markdown anyway
        rawContent = rawContent.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();

        // Extract the filename from the first line and keep the rest as the actual code
        const lines = rawContent.split('\n');
        let fileName = 'database_output.txt'; // Safe fallback
        let codeContent = rawContent;

        if (lines[0]?.startsWith('FILENAME:')) {
            fileName = lines[0].replace('FILENAME:', '').trim();
            codeContent = lines.slice(1).join('\n').trim();
        }

        const filePath = path.join(resolvedPath, fileName);
        await fs.writeFile(filePath, codeContent, 'utf-8');
        
        if (onLog) onLog(`> Successfully wrote ${fileName} to disk.\n\n`);

        return {
            agent: "Database",
            status: "Success",
            message: `Successfully generated ${fileName}.`,
            output: `Saved ${fileName} to ${resolvedPath}\n\nPreview:\n${codeContent.substring(0, 150)}...`
        };

    } catch (error) {
        throw new Error(`Database Agent execution failed: ${error?.message}`);
    }
};