import Fastify, { FastifyInstance } from 'fastify';
import { Server as SocketIOServer } from 'socket.io';
import fastifySocketIO from 'fastify-socket.io';
import Client from 'socket.io-client';

interface FastifyInstanceWithIO extends FastifyInstance {
  io: SocketIOServer;
}

const fastify = Fastify() as unknown as FastifyInstanceWithIO;

fastify.register(fastifySocketIO, {
  cors: { origin: '*' },
});

const backendClient = Client('http://localhost:3002');

fastify.ready().then(() => {
  // Relay messages from backend-server to website clients
  backendClient.on('message', (data: any) => {
    console.log(`fastify.io.emit: Message received from backend`);
    fastify.io.emit('message', 'status', {status: data});
  });

  // Handle subscriptions from website
  fastify.io.on('connection', (socket) => {
    console.log('Website connected');
    socket.on('subscribe', (channel) => {
      console.log(`Website subscribed to ${channel}`);
      socket.emit('subscribed', channel);
      backendClient.on(channel, (data: any) => {
        console.log(`Message on ${channel} received from backend`);
        socket.emit('message', channel, data);
      });
      backendClient.on('error', (error: Error | any) => {
        console.log(`Error reported from backend`, error);
        socket.emit('error', error.message);
      });
      backendClient.emit('subscribe', channel);
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