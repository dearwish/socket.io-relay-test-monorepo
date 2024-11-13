import Fastify, { FastifyInstance } from 'fastify';
import { Server as SocketIOServer } from 'socket.io';
import fastifySocketIO from 'fastify-socket.io';
import Client from 'socket.io-client';

import connectionManager from './connection-manager';

interface FastifyInstanceWithIO extends FastifyInstance {
  io: SocketIOServer;
}

interface UserContext {
  userId: string;
  sessionNumber: number;
}

const fastify = Fastify() as unknown as FastifyInstanceWithIO;

fastify.register(fastifySocketIO, {
  path: '/ws',
  cors: { origin: '*' },
});

const backendClient = Client('http://localhost:3002');

fastify.ready().then(() => {
  fastify.io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      console.log('Authorization header missing');
      return next(new Error('Authorization header missing'));
    }
    if (token !== 'MySecretToken') {
      console.log('Authentication error');
      return next(new Error('Authentication error'));
    }
    console.log('Authorization successful');
    return next();
  });

  // Relay messages from backend-server to website clients
  backendClient.on('message', (data: any) => {
    console.log(`fastify.io.emit: Message received from backend`);
    fastify.io.emit('message', 'status', {status: data});
  });

  // Handle subscriptions from website
  fastify.io.on('connection', (socket) => {
    console.log('Website connected');
    socket.on('subscribe', (channel: string, { userId, sessionNumber }: UserContext) => {
      console.log(`Website subscribed to ${channel} for user ${userId} and session ${sessionNumber}`);
      connectionManager.addConnection(userId, sessionNumber, socket.id);
      socket.emit('subscribed', channel, { userId, sessionNumber });
      backendClient.on(channel, (context: UserContext, data: any) => {
        console.log(`Message on ${channel} received from backend`);
        const socketId = connectionManager.getConnection(context.userId, context.sessionNumber);
        if (!socketId) {
          console.log(`No active connection found for ${context.userId} and session ${context.sessionNumber}`);
          return;
        }
        fastify.io.to(socketId).emit('message', channel, data);
      });
      backendClient.on('error', (error: Error | any) => {
        console.log(`Error reported from backend`, error);
        socket.emit('error', error.message);
      });
      backendClient.emit('subscribe', channel, { userId, sessionNumber });
    });
  });

  console.log('API server is running on port 3001');
});

fastify.listen({ port: 3001 }, (err) => {
  if (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
});