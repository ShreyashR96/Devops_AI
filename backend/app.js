import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { processPrompt } from './orchestrator/orchestrator.js';
import authRoutes from './routes/auth.routes.js';
import { getSystemMetrics } from './tools/monitoring.tool.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const JWT_SECRET = process.env?.JWT_SECRET ?? 'super_secret_flasho_key_change_me_in_production';
const MONGO_URI = process.env?.MONGO_URI ?? 'mongodb://127.0.0.1:27017/devagents';

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

mongoose.connect(MONGO_URI)
    .then(() => console.log('⚡ Connected to MongoDB Database'))
    .catch((error) => console.error('MongoDB connection error:', error));

app.post('/api/chat', async (req, res) => {
    try {
        const prompt = req?.body?.prompt;
        
        if (!prompt) {
            return res.status(400).json({ success: false, error: 'A prompt is required.' });
        }

        const orchestratorResponse = await processPrompt(prompt, () => {});
        res.status(200).json({ success: true, data: orchestratorResponse });
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ success: false, error: error?.message });
    }
});

io.use((socket, next) => {
    try {
        const token = socket?.handshake?.auth?.token;
        if (!token) return next(new Error('Authentication error: No token provided'));

        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) return next(new Error('Authentication error: Invalid or expired token'));
            socket.user = decoded;
            next();
        });
    } catch (error) {
        next(new Error('Authentication error: Server fault'));
    }
});

io.on('connection', (socket) => {
    console.log(`⚡ Socket connected: ${socket?.id} (User: ${socket?.user?.email || socket?.user?.id})`);

    let metricsInterval;

    socket.on('send_prompt', async (data) => {
        try {
            const prompt = data?.prompt;
            if (!prompt) {
                socket.emit('error', { message: 'Prompt is required.' });
                return;
            }

            const onLog = (chunk) => {
                socket.emit('log_stream', { chunk });
            };

            const orchestratorResponse = await processPrompt(prompt, onLog);
            socket.emit('response_complete', orchestratorResponse);
        } catch (error) {
            console.error('Socket Execution Error:', error);
            socket.emit('error', { message: error?.message });
        }
    });

    // Handle Live Metrics Stream
    socket.on('start_metrics', () => {
        if (metricsInterval) clearInterval(metricsInterval);
        metricsInterval = setInterval(() => {
            socket.emit('metrics_data', getSystemMetrics());
        }, 1500); // Emits every 1.5 seconds
    });

    socket.on('stop_metrics', () => {
        if (metricsInterval) clearInterval(metricsInterval);
    });

    socket.on('disconnect', () => {
        if (metricsInterval) clearInterval(metricsInterval);
        console.log(`🔌 Socket disconnected: ${socket?.id}`);
    });
});

const PORT = process.env?.PORT || 3001;
server.listen(PORT, () => {
    console.log(`⚡ Flasho Backend Orchestrator running on port ${PORT} with Secured Socket.IO enabled`);
});