import Fastify, { FastifyInstance } from 'fastify';
import { Server as SocketIOServer } from 'socket.io';
import fastifySocketIO from 'fastify-socket.io';
import Client from 'socket.io-client';

import { UserContext } from './types/user-context';
import connectionManager from './utils/connection-manager';
import MessageEmitter from './utils/message-emitter';

interface FastifyInstanceWithIO extends FastifyInstance {
  io: SocketIOServer;
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

  const messageEmitter = new MessageEmitter(fastify.io);

  // Relay messages from backend-server to website clients
  backendClient.on('message', (context: UserContext, data: string) => {
    console.log(`fastify.io.emit: Message received from backend`);
    messageEmitter.emit(context, 'message', 'status', { status: data });
  });

  // Handle subscriptions from website
  fastify.io.on('connection', (socket) => {
    console.log('Website connected');
    socket.on('subscribe', (channel: string, { userId, sessionNumber }: UserContext) => {
      console.log(`Website subscribed to ${channel} for user ${userId} and session ${sessionNumber}`);
      connectionManager.addConnection(userId, sessionNumber, socket.id);

      backendClient.on(channel, (context: UserContext, data: any) => {
        console.log(`Message on ${channel} received from backend`);
        messageEmitter.emit(context, 'message', channel, data);
      });

      backendClient.on('error', (error: Error | any) => {
        console.log(`Error reported from backend`, error);
        socket.emit('error', error.message);
      });
      backendClient.emit('subscribe', channel, { userId, sessionNumber });
    });
  });

  backendClient.on('stats', (stats: string) => {
    const apiStats = connectionManager.getStats();
    fastify.io.emit('stats', `API:\n${apiStats}\nBackend:\n${stats}\n`);
  });


  console.log('API server is running on port 3001');
});

fastify.listen({ port: 3001 }, (err) => {
  if (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
});