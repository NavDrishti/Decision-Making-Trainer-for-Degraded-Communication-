import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../common/utils/security.js';
import { prisma } from '../database/prisma.js';
import { ScenarioEngine } from '../modules/simulation/scenario-engine.js';

export function setupSocketServer(httpServer: HttpServer, corsOrigin: string) {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication Middleware for WebSocket Handshake
  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
        socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Authentication required for WebSocket connection.'));
      }

      const payload = verifyAccessToken(token as string);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, fullName: true, email: true, role: true, avatarInitials: true },
      });

      if (!user) {
        return next(new Error('User not found.'));
      }

      socket.data.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid socket credentials.'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;

    // Join personal user room
    socket.join(`user:${user.id}`);

    // Join Training Session Room
    socket.on('session:join', async (data: { sessionId: string }) => {
      const { sessionId } = data;
      if (!sessionId) return;

      const session = await prisma.trainingSession.findUnique({
        where: { id: sessionId },
        include: {
          participants: { where: { userId: user.id } },
        },
      });

      if (!session) {
        socket.emit('error:safe', { message: 'Session not found.' });
        return;
      }

      const participant = session.participants[0];
      const isInstructor = user.role === 'INSTRUCTOR' || user.role === 'SUPER_ADMIN';

      if (!participant && !isInstructor) {
        socket.emit('error:safe', { message: 'You are not assigned to this session.' });
        return;
      }

      const assignedRole = participant ? participant.assignedRole : 'INSTRUCTOR';

      // Join rooms
      socket.join(`session:${sessionId}`);
      socket.join(`session:${sessionId}:role:${assignedRole}`);

      if (isInstructor) {
        socket.join(`session:${sessionId}:instructors`);
      }

      // Hook up engine callback if not already set
      let engine = ScenarioEngine.getEngine(sessionId);
      if (!engine) {
        engine = new ScenarioEngine(sessionId, JSON.parse(session.configurationSnapshotJson), JSON.parse(session.groundTruthStateJson));
        ScenarioEngine.registerEngine(sessionId, engine);
      }

      engine.setIoCallback((event, payload, room) => {
        if (room) {
          io.to(room).emit(event, payload);
        } else {
          io.to(`session:${sessionId}`).emit(event, payload);
        }
      });

      // Update presence
      io.to(`session:${sessionId}`).emit('session:participant-joined', {
        userId: user.id,
        fullName: user.fullName,
        role: assignedRole,
      });

      // Send initial role-aware state
      const state = engine.getPerceivedStateForRole(assignedRole);
      socket.emit('session:state', {
        state,
        sessionStatus: session.status,
        currentSecond: engine.groundTruth.simulationSecond,
      });
    });

    // Leave Session Room
    socket.on('session:leave', (data: { sessionId: string }) => {
      if (data?.sessionId) {
        socket.leave(`session:${data.sessionId}`);
        io.to(`session:${data.sessionId}`).emit('session:participant-left', {
          userId: user.id,
          fullName: user.fullName,
        });
      }
    });

    // Instructor Controls via WebSocket
    socket.on('instructor:event-inject', async (data: { sessionId: string; actionType: string; params: any }) => {
      if (user.role !== 'INSTRUCTOR' && user.role !== 'SUPER_ADMIN') {
        socket.emit('error:safe', { message: 'Instructor role required.' });
        return;
      }
      const engine = ScenarioEngine.getEngine(data.sessionId);
      if (engine) {
        await engine.injectDisruption(data.actionType, data.params || {}, user.id);
      }
    });

    socket.on('instructor:pause', async (data: { sessionId: string }) => {
      if (user.role !== 'INSTRUCTOR' && user.role !== 'SUPER_ADMIN') return;
      const engine = ScenarioEngine.getEngine(data.sessionId);
      if (engine) await engine.pause();
    });

    socket.on('instructor:resume', async (data: { sessionId: string }) => {
      if (user.role !== 'INSTRUCTOR' && user.role !== 'SUPER_ADMIN') return;
      const engine = ScenarioEngine.getEngine(data.sessionId);
      if (engine) await engine.resume();
    });

    socket.on('instructor:end', async (data: { sessionId: string }) => {
      if (user.role !== 'INSTRUCTOR' && user.role !== 'SUPER_ADMIN') return;
      const engine = ScenarioEngine.getEngine(data.sessionId);
      if (engine) await engine.end();
    });

    socket.on('disconnect', () => {
      // Disconnected cleanly
    });
  });

  return io;
}
