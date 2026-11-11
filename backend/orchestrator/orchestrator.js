import { executeDeploymentAction } from '../agents/deployment/deployment.agent.js';
import { executeDockerCommand } from '../agents/docker/docker.agent.js';
import { executeMonitoringCommand } from '../agents/monitoring/monitoring.agent.js';
import { executeDocumentationCommand } from '../agents/documentation/documentation.agent.js';
import { executeDatabaseCommand } from '../agents/database/database.agent.js';
import ollama from 'ollama';

// Fast-Path Regex Router (Order matters! More specific agents go first)
const routeConfig = [
    {
        name: 'Monitoring',
        regex: /\b(monitor|metrics|cpu|ram|telemetry|system)\b/i,
        handler: executeMonitoringCommand
    },
    {
        name: 'Deployment',
        regex: /\b(deploy|git pull|npm install|build|pm2|restart server|render)\b/i,
        handler: executeDeploymentAction
    },
    {
        name: 'Docker',
        regex: /\b(docker|dockerfile|compose|container|containers|image|images)\b/i,
        handler: executeDockerCommand
    },
    {
        name: 'Database',
        // Catches database keywords before Documentation can steal the word "Generate"
        regex: /\b(database|db|schema|model|sql|prisma|seed|mongoose|postgres|mongodb)\b/i,
        handler: executeDatabaseCommand
    },
    {
        name: 'Documentation',
        regex: /\b(readme|docs|documentation)\b/i,
        handler: executeDocumentationCommand
    }
];

export const processPrompt = async (prompt, onLog) => {
    try {
        if (onLog) onLog("> Orchestrator: Analyzing intent and routing request...\n");

        // 1. Regex Fast-Path Routing (Zero Latency)
        for (const route of routeConfig) {
            if (route.regex.test(prompt)) {
                if (onLog) onLog(`> Orchestrator: Fast-path matched [${route.name} Agent]\n`);
                return await route.handler(prompt, onLog);
            }
        }

        // 2. LLM Fallback Routing (If no keywords perfectly match)
        if (onLog) onLog(`> Orchestrator: No fast-path match. Asking LLM to classify...\n`);
        
        const systemPrompt = `You are the master routing agent for a DevOps platform.
Analyze the user's prompt and categorize it into exactly ONE of the following categories:
- DEPLOYMENT (Deploying apps, running npm install, git pull, render)
- DOCKER (Dockerfiles, compose, containers, images)
- MONITORING (CPU, RAM, system metrics)
- DATABASE (Mongoose schemas, SQL, Prisma, seed data)
- DOCUMENTATION (README files, docs)
- UNKNOWN (If it doesn't fit any of the above)

Respond with ONLY the category name. Do not add any other text.`;

        const response = await ollama.chat({
            model: 'qwen2.5:3b',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            options: { temperature: 0.1 }
        });

        const category = response?.message?.content?.trim()?.toUpperCase() || 'UNKNOWN';
        
        if (onLog) onLog(`> Orchestrator: LLM classified intent as [${category}]\n`);

        // Route based on LLM decision
        switch (category) {
            case 'DEPLOYMENT': 
                return await executeDeploymentAction(prompt, onLog);
            case 'DOCKER': 
                return await executeDockerCommand(prompt, onLog);
            case 'MONITORING': 
                return await executeMonitoringCommand(prompt, onLog);
            case 'DATABASE': 
                return await executeDatabaseCommand(prompt, onLog);
            case 'DOCUMENTATION': 
                return await executeDocumentationCommand(prompt, onLog);
            default:
                return {
                    agent: "Orchestrator",
                    status: "Ambiguous",
                    message: "I couldn't determine which agent should handle this.",
                    output: "Try rephrasing your request to include keywords like 'Deploy', 'Docker', 'Monitor', 'Database', or 'Documentation'."
                };
        }
    } catch (error) {
        throw new Error(`Orchestrator routing failed. Details: ${error?.message}`);
    }
};