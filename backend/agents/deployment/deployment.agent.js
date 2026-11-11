import { executeDeploymentCommand } from '../../tools/deployment.tool.js';
import ollama from 'ollama';
import fs from 'fs/promises';
import path from 'path';

// Deterministically pulls a filesystem path out of the raw user prompt.
// We deliberately do NOT ask the LLM to reproduce the path itself: small local
// models are unreliable at faithfully re-typing long strings once you also ask
// them to JSON-escape backslashes, and will silently mangle folder names
// (e.g. "Wall of Humanity" collapsing to "W\o\H"). Regex extraction against the
// original text is exact by construction.
function extractPathFromPrompt(rawPrompt) {
    if (!rawPrompt || typeof rawPrompt !== 'string') return null;

    // Windows absolute path, e.g. C:\foo\bar or D:/foo/bar. Folder names may
    // contain spaces, so we take everything from the drive letter to the end
    // of the prompt (trimming trailing punctuation/filler words).
    const winMatch = rawPrompt.match(/[A-Za-z]:[\\/].*$/);
    if (winMatch) {
        return winMatch[0]
            .trim()
            .replace(/[.,;!?]+$/, '')
            .replace(/\s+(?:please|now|thanks|thank you)$/i, '')
            .trim();
    }

    // Unix-style absolute or relative path, e.g. ./backend, ../app, /var/www/app.
    // These are assumed to be single space-free tokens.
    const unixMatch = rawPrompt.match(/(?:\.{1,2}\/|~\/|\/)[^\s"']+/);
    if (unixMatch) {
        return unixMatch[0].trim().replace(/[.,;!?]+$/, '');
    }

    return null;
}

// Asks the LLM for ONLY the shell command as a plain line of text (no JSON,
// no paths, no escaping). This is a much smaller, safer surface for a local
// model to get right than reproducing an entire path inside a JSON string.
async function extractCommandFromPrompt(rawPrompt) {
    const systemPrompt = `You extract a single shell command from a deployment request.

RULES:
- Respond with ONLY the raw command text (e.g. "npm install", "git pull", "pm2 restart all", "yarn build"). No JSON, no quotes, no markdown, no explanation.
- If the user did not specify a command, respond with exactly: npm install
- Never include file paths in your answer, only the command itself.`;

    let response;
    try {
        const OLLAMA_TIMEOUT_MS = 30000;
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Ollama did not respond within 30 seconds.')), OLLAMA_TIMEOUT_MS)
        );

        response = await Promise.race([
            ollama.chat({
                model: 'qwen2.5:3b',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: rawPrompt }
                ],
                options: { temperature: 0.1 }
            }),
            timeoutPromise
        ]);
    } catch (ollamaErr) {
        throw new Error(
            `Could not reach the local Ollama model ('qwen2.5:3b'). Make sure Ollama is running and the model is pulled. Original error: ${ollamaErr?.message}`
        );
    }

    const raw = response?.message?.content || '';
    // Defensive cleanup in case the model still wraps the answer in quotes/backticks/markdown.
    return raw
        .trim()
        .replace(/^```[a-z]*\n?/i, '')
        .replace(/```$/, '')
        .replace(/^["'`]+|["'`]+$/g, '')
        .split('\n')[0]
        .trim();
}

// The Render deploy hook only confirms the trigger request was *received* —
// per Render's own docs, it returns immediately and does not communicate
// whether the build/deploy itself succeeds. Trusting HTTP 200 as "deployed"
// is exactly why this agent could report Success while nothing actually
// shipped. If RENDER_API_KEY + RENDER_SERVICE_ID are configured, we poll
// Render's real deploy-status API to find out what actually happened.
async function pollRenderDeployStatus(onLog) {
    const apiKey = process.env?.RENDER_API_KEY;
    const serviceId = process.env?.RENDER_SERVICE_ID;
    if (!apiKey || !serviceId) return null; // Not configured — caller must be honest about the limitation.

    const maxWaitMs = 90000;
    const intervalMs = 5000;
    const successStatuses = new Set(['live']);
    const failureStatuses = new Set(['build_failed', 'update_failed', 'canceled', 'deactivated', 'pre_deploy_failed']);

    // Give Render a moment to register the new deploy before polling for it.
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const startedAt = Date.now();
    while (Date.now() - startedAt < maxWaitMs) {
        try {
            const controller = new AbortController();
            const requestTimeout = setTimeout(() => controller.abort(), 10000); // bound EACH poll request

            let res;
            try {
                res = await fetch(
                    `https://api.render.com/v1/services/${encodeURIComponent(serviceId)}/deploys?limit=1`,
                    { headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' }, signal: controller.signal }
                );
            } finally {
                clearTimeout(requestTimeout);
            }

            if (res.ok) {
                const data = await res.json();
                const entry = Array.isArray(data) ? data[0] : null;
                // Render wraps list results as [{ deploy: {...} }, ...]; be defensive about the shape.
                const deploy = entry?.deploy ?? entry;
                const status = deploy?.status;

                if (status) {
                    if (onLog) onLog(`> Render deploy status: ${status}\n`);

                    const details = {
                        status,
                        deployId: deploy?.id ?? null,
                        createdAt: deploy?.createdAt ?? null,
                        updatedAt: deploy?.updatedAt ?? null,
                        finishedAt: deploy?.finishedAt ?? null,
                        commitId: deploy?.commit?.id ?? null,
                        commitMessage: deploy?.commit?.message ?? null
                    };

                    if (successStatuses.has(status)) return { ...details, ok: true };
                    if (failureStatuses.has(status)) return { ...details, ok: false };
                }
            }
        } catch (pollErr) {
            // Non-fatal (including timeout/AbortError) — retry until the overall
            // maxWaitMs is exhausted, then report "unknown" below.
        }

        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    return { status: 'unknown', ok: null, timedOut: true };
}

// Formats deploy details into a short event-log-style line so the output can
// be visually cross-checked against the entries in Render's Events tab.
function formatDeployEventLine(details) {
    if (!details) return '';
    const parts = [];
    if (details.deployId) parts.push(`Deploy ${details.deployId}`);
    if (details.status) parts.push(`status: ${details.status}`);
    if (details.commitId) {
        const shortSha = details.commitId.slice(0, 7);
        parts.push(details.commitMessage ? `commit ${shortSha} ("${details.commitMessage}")` : `commit ${shortSha}`);
    }
    if (details.createdAt) parts.push(`started: ${details.createdAt}`);
    if (details.finishedAt) parts.push(`finished: ${details.finishedAt}`);
    return parts.join(' | ');
}

export const executeDeploymentAction = async (prompt, onLog) => {
    try {
        if (onLog) onLog("> Parsing deployment instructions...\n");

        // --- Deterministic routing (no LLM involved, no room for corruption) ---
        const deployTarget = /\brender\b/i.test(prompt) ? 'render' : 'local';
        const extractedPath = deployTarget === 'local' ? extractPathFromPrompt(prompt) : null;

        // --- CLOUD DEPLOYMENT ROUTE (RENDER) ---
        if (deployTarget === 'render') {
            const renderHookUrl = process.env?.RENDER_DEPLOY_HOOK_URL;

            if (!renderHookUrl) {
                return {
                    agent: "Deployment",
                    status: "Config Missing",
                    message: "Render Deploy Hook URL is missing from environment variables.",
                    output: "To deploy to Render, please add RENDER_DEPLOY_HOOK_URL=your_webhook_url to your backend/.env file."
                };
            }

            if (onLog) onLog(`> Initiating Cloud Deployment to Render...\n`);

            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 15000); // 15s safety timeout

                let renderResponse;
                try {
                    renderResponse = await fetch(renderHookUrl, { method: 'POST', signal: controller.signal });
                } finally {
                    clearTimeout(timeout);
                }

                if (renderResponse?.ok) {
                    if (onLog) onLog(`> Render accepted the deploy trigger. Confirming build status...\n`);

                    const pollResult = await pollRenderDeployStatus(onLog);

                    if (!pollResult) {
                        // No RENDER_API_KEY / RENDER_SERVICE_ID configured — we genuinely
                        // cannot confirm the build/deploy outcome from here. Render's deploy
                        // hook only confirms the trigger was received, not that the deploy
                        // succeeds, so say that plainly instead of claiming "Success".
                        return {
                            agent: "Deployment",
                            status: "Triggered",
                            message: "Render accepted the deploy trigger.",
                            output: "Render's deploy hook only confirms the trigger was received — it doesn't confirm the build/deploy itself succeeded. Check your Render dashboard for live build progress. To get automatic pass/fail confirmation here, set RENDER_API_KEY and RENDER_SERVICE_ID in your .env."
                        };
                    }

                    if (pollResult.ok === true) {
                        return {
                            agent: "Deployment",
                            status: "Success",
                            message: "Render deployment completed successfully.",
                            output: `Your service is live.\n${formatDeployEventLine(pollResult)}\n\nThis matches what you'll see in the Events tab of your Render dashboard for this service.`
                        };
                    }

                    if (pollResult.ok === false) {
                        return {
                            agent: "Deployment",
                            status: "Failed",
                            message: "Render deployment failed.",
                            output: `${formatDeployEventLine(pollResult)}\n\nCheck the build logs in your Render dashboard's Events tab for the full failure details.`
                        };
                    }

                    // Timed out waiting for a terminal status — still building, or Render's
                    // API shape didn't match what we expected. Don't claim success or failure.
                    return {
                        agent: "Deployment",
                        status: "Triggered",
                        message: "Render accepted the deploy trigger, but it hadn't finished building within the polling window.",
                        output: "Check your Render dashboard for live build progress."
                    };
                } else {
                    throw new Error(`Render API responded with HTTP ${renderResponse?.status}`);
                }
            } catch (err) {
                return {
                    agent: "Deployment",
                    status: "Failed",
                    message: "Failed to reach Render API.",
                    output: err?.name === 'AbortError' ? 'Request to Render timed out after 15 seconds.' : err?.message
                };
            }
        }

        // --- LOCAL DEPLOYMENT ROUTE ---
        if (!extractedPath) {
            return {
                agent: "Deployment",
                status: "Clarification Needed",
                message: "I need to know exactly which folder you want to deploy.",
                output: "Please provide the path in your prompt. For example: 'Deploy the backend in ./backend' or 'Run npm install in C:/projects/flasho'."
            };
        }

        let targetPath = extractedPath;

        try {
            if (targetPath.includes('%')) {
                targetPath = decodeURIComponent(targetPath);
            }
        } catch (decodeError) {
            if (onLog) onLog("> Deployment Agent Warning: Path contained unmappable characters, processing raw path string.\n");
        }

        const resolvedPath = path.resolve(targetPath);

        if (onLog) onLog(`> Target Path Resolved: ${resolvedPath}\n`);

        // Optional hard boundary: if DEPLOYMENT_ALLOWED_ROOT is set, refuse to operate
        // outside of it. Prevents an LLM-extracted path from escaping to sensitive
        // system directories (e.g. C:\Windows, /etc).
        const allowedRoot = process.env?.DEPLOYMENT_ALLOWED_ROOT;
        if (allowedRoot) {
            const normalizedRoot = path.resolve(allowedRoot);
            const isWithinRoot =
                resolvedPath === normalizedRoot ||
                resolvedPath.startsWith(normalizedRoot + path.sep);

            if (!isWithinRoot) {
                return {
                    agent: "Deployment",
                    status: "Blocked",
                    message: "Resolved path is outside the permitted deployment root.",
                    output: `The path ${resolvedPath} is not inside the allowed deployment root (${normalizedRoot}).`
                };
            }
        }

        try {
            const stat = await fs.stat(resolvedPath);
            if (!stat.isDirectory()) {
                throw new Error("Path is not a directory.");
            }
        } catch (err) {
            return {
                agent: "Deployment",
                status: "Failed",
                message: "Invalid Path provided.",
                output: `The directory does not exist or is inaccessible: ${resolvedPath}`
            };
        }

        const shellCommand = await extractCommandFromPrompt(prompt);

        if (!shellCommand) {
            return {
                agent: "Deployment",
                status: "Clarification Needed",
                message: "I found the directory, but I don't know what command to execute.",
                output: `Target resolved to ${resolvedPath}. Please specify the command you want to run (e.g., 'npm install', 'git pull', or 'pm2 restart all').`
            };
        }

        // Security: only allow known, safe command binaries as the FIRST token
        // (a naive startsWith() let "npminstall && rm -rf /" slip through since
        // "npminstall...".startsWith("npm") is true). We also explicitly reject
        // shell metacharacters anywhere in the command to block chaining/injection
        // (e.g. `;`, `&&`, `||`, `|`, backticks, `$(...)`, redirection, newlines).
        const allowedCommands = ['git', 'npm', 'pm2', 'yarn'];
        const firstToken = shellCommand.split(/\s+/)[0] || '';
        const hasShellMetacharacters = /[;&|`$<>\n]|\$\(/.test(shellCommand);
        const isSafe = allowedCommands.includes(firstToken) && !hasShellMetacharacters;

        if (!isSafe) {
            return {
                agent: "Deployment",
                status: "Blocked",
                message: "Security mechanism blocked the generated deployment command.",
                output: `The model attempted to run an unapproved or unsafe command: ${shellCommand}`
            };
        }

        if (onLog) onLog(`> Executing pipeline: ${shellCommand}\n\n`);

        const terminalOutput = await executeDeploymentCommand(shellCommand, onLog, resolvedPath);

        return {
            agent: "Deployment",
            status: "Success",
            message: `Executed deployment command successfully in ${resolvedPath}.`,
            output: terminalOutput
        };
    } catch (error) {
        throw new Error(`Deployment Agent execution failed: ${error?.message}`);
    }
};