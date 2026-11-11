import ollama from 'ollama';
import fs from 'fs/promises';
import path from 'path';

function extractPathFromPrompt(rawPrompt) {
    if (!rawPrompt || typeof rawPrompt !== 'string') return null;

    const quoteMatch = rawPrompt.match(/["']([A-Za-z]:[\\/][^"']+|(?:\.{1,2}\/|~\/|\/)[^"']+)["']/);
    if (quoteMatch) {
        return quoteMatch[1].trim(); 
    }

    const winMatch = rawPrompt.match(/[A-Za-z]:[\\/].*$/);
    if (winMatch) {
        return winMatch[0]
            .trim()
            .replace(/[.,;!?]+$/, '')
            .replace(/\s+(?:please|now|thanks|thank you)$/i, '')
            .trim();
    }

    const unixMatch = rawPrompt.match(/(?:\.{1,2}\/|~\/|\/)[^\s"']+/);
    if (unixMatch) {
        return unixMatch[0].trim().replace(/[.,;!?]+$/, '');
    }

    return null;
}

// Corrected Export Name: executeDocumentationCommand
export const executeDocumentationCommand = async (prompt, onLog) => {
    try {
        if (onLog) onLog("> Parsing documentation instructions...\n");

        const extractedPath = extractPathFromPrompt(prompt);
        if (!extractedPath) {
            return {
                agent: "Documentation",
                status: "Clarification Needed",
                message: "I need to know exactly which folder to generate documentation for.",
                output: "Please provide the path in your prompt. For example: 'Generate a README in \"D:/Wall of Humanity\"'."
            };
        }

        const resolvedPath = path.resolve(extractedPath);
        if (onLog) onLog(`> Target Path Resolved: ${resolvedPath}\n`);

        try {
            const stat = await fs.stat(resolvedPath);
            if (!stat.isDirectory()) throw new Error("Not a directory.");
        } catch (err) {
            return {
                agent: "Documentation",
                status: "Failed",
                message: "Invalid Path provided.",
                output: `The directory does not exist or is inaccessible: ${resolvedPath}`
            };
        }

        let contextText = "No package.json found. Generate a generic project README.";
        try {
            const packageJsonPath = path.join(resolvedPath, 'package.json');
            const pkgData = await fs.readFile(packageJsonPath, 'utf-8');
            const parsedPkg = JSON.parse(pkgData);
            contextText = `Project Name: ${parsedPkg?.name || 'Unknown'}\nDependencies: ${Object.keys(parsedPkg?.dependencies || {}).join(', ')}`;
            if (onLog) onLog(`> Found package.json. Extracting context...\n`);
        } catch (e) {
            // It's okay if package.json doesn't exist
        }

        if (onLog) onLog(`> Generating README.md...\n`);

        const systemPrompt = `You are a Technical Writer Agent.
Generate a professional README.md file in Markdown format based on the user's prompt and the provided context.
Context:
${contextText}

RULES:
- Do NOT wrap the entire output in a \`\`\`markdown codeblock. Just output the raw markdown text starting with a # header.
- Make it professional and structured.`;

        const response = await ollama.chat({
            model: 'qwen2.5:3b', 
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            options: { temperature: 0.3 }
        });

        let fileContent = response?.message?.content || '';
        fileContent = fileContent.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();

        const filePath = path.join(resolvedPath, 'README.md');
        await fs.writeFile(filePath, fileContent, 'utf-8');
        
        if (onLog) onLog(`> Successfully wrote README.md to disk.\n\n`);

        return {
            agent: "Documentation",
            status: "Success",
            message: "Successfully generated documentation.",
            output: `Saved README.md to ${resolvedPath}\n\nPreview:\n${fileContent.substring(0, 150)}...`
        };

    } catch (error) {
        throw new Error(`Documentation Agent execution failed: ${error?.message}`);
    }
};