import express from 'express';
import { Server } from 'socket.io';
import axios from 'axios';

import connectionManager from './connection-manager';
import { UserContext } from './user-context';


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

const channels = {
  weather: 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/london?unitGroup=metric&key=PNTBF7Q3WSNNZKKUSNR7L9SMN&contentType=json',
  stocks: 'https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=LW63F8ZW0MQ7IU67',
};

// Emit data to api-server every 30 seconds
setInterval(async () => {
  for (const [channel, url] of Object.entries(channels)) {
    try {
      const response = await axios.get(url);
      subscriptions.get(channel)?.forEach((context) => {
        console.log(`Sending data to subscribed user ${context.userId} session ${context.sessionNumber} on channel`, channel);
        const connection = connectionManager.getConnection(context.userId, context.sessionNumber);
        if (!connection) {
          console.log(`No active connection found for user ${context.userId} on channel ${channel}`);
          return;
        }
        io.to(connection).emit(channel, context, response.data);
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
