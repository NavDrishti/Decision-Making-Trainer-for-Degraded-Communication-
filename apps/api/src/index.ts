import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import { authRouter } from './modules/auth/auth.controller.js';
import { usersRouter } from './modules/users/users.controller.js';
import { scenariosRouter } from './modules/scenarios/scenarios.controller.js';
import { sessionsRouter } from './modules/sessions/sessions.controller.js';
import { simulationRouter } from './modules/simulation/simulation.controller.js';
import { aarRouter } from './modules/aar/aar.controller.js';
import { exportsRouter } from './modules/exports/exports.controller.js';
import { adminRouter } from './modules/admin/admin.controller.js';
import { waitlistRouter } from './modules/waitlist/waitlist.controller.js';
import { supportRouter } from './modules/support/support.controller.js';
import { setupSocketServer } from './realtime/socket.js';
import { generalRateLimiter } from './common/middleware/rateLimit.js';

const app = express();
const server = http.createServer(app);

// Security & Utility Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Managed by Next.js in fullstack setup
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: [config.corsOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use(generalRateLimiter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  return res.json({
    status: 'ONLINE',
    service: 'NavDrishtiAI API Gateway',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    version: '1.0.0 (SIH26248)',
  });
});

// Mount Routes
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/scenarios', scenariosRouter);
app.use('/sessions', sessionsRouter);
app.use('/sessions', simulationRouter);
app.use('/sessions', aarRouter);
app.use('/sessions', exportsRouter);
app.use('/admin', adminRouter);
app.use('/waitlist', waitlistRouter);
app.use('/support', supportRouter);

// Safe Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  return res.status(err.status || 500).json({
    success: false,
    error: config.nodeEnv === 'production' ? 'An unexpected server error occurred.' : err.message || 'Internal Error',
  });
});

// Setup Socket.IO
setupSocketServer(server, config.corsOrigin);

// Start Server
server.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`🛡️  NAVDRISHTIAI Backend API & Realtime Gateway`);
  console.log(`📡 Server listening on http://localhost:${config.port}`);
  console.log(`🌐 CORS allowed origin: ${config.corsOrigin}`);
  console.log(`⚙️  Environment: ${config.nodeEnv}`);
  console.log(`====================================================`);
});

export { app, server };
