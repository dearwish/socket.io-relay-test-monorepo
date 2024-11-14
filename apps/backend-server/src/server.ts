import express from 'express';
import { Server } from 'socket.io';

import connectionManager from './connection-manager';
import { UserContext } from './user-context';
import { getStockData, getWeatherData } from './mock';


const app = express();
const server = app.listen(3002, () => {
  console.log('Backend server running on port 3002');
});

const io = new Server(server, {
  cors: { origin: '*' },
});

const subscriptions = new Map<string, Set<UserContext>>();

io.on('connection', (socket) => {
    console.log('api-server connected');
    socket.on('subscribe', (channel: string, context: UserContext) => {
      socket.emit('message', context, `Subscribed to ${channel} for user ${context.userId} and session ${context.sessionNumber}`);
      if (!connectionManager.hasConnection(context.userId, context.sessionNumber)) {
        connectionManager.addConnection(context.userId, context.sessionNumber, socket.id);
      }
      if (!subscriptions.has(channel)) {
        const users = new Set<UserContext>();
        users.add(context);
        subscriptions.set(channel, users);
      } else {
        subscriptions.get(channel)!.add(context);
      }
      console.log(`API server subscribed to ${channel}, total subs ${subscriptions.get(channel)!.size}`);
    });
});

const channels = ['weather', 'stocks'];

// Emit data to api-server every 30 seconds
setInterval(async () => {
  for (const channel of channels) {
    try {
      const response = channel === 'weather' ? getWeatherData() : getStockData();
      subscriptions.get(channel)?.forEach((context) => {
        console.log(`Sending data to subscribed user ${context.userId} session ${context.sessionNumber} on channel`, channel);
        const connection = connectionManager.getConnection(context.userId, context.sessionNumber);
        if (!connection) {
          console.log(`No active connection found for user ${context.userId} on channel ${channel}`);
          return;
        }
        io.to(connection).emit(channel, context, response);
      });
    } catch (error: Error | any) {
      console.error(`Error fetching data for channel ${channel}:`, error);
    }
  }
}, 30000);

// Emit data to api-server every 30 seconds
setInterval(async () => {
  const stats = connectionManager.getStats();
  console.log('Emitting stats to api-server:\n', stats);
  io.emit('stats', stats);
}, 60000);
