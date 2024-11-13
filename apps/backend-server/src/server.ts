import express from 'express';
import { Server, Socket } from 'socket.io';
import axios from 'axios';

const app = express();
const server = app.listen(3002, () => {
  console.log('Backend server running on port 3002');
});

const io = new Server(server, {
  cors: { origin: '*' },
});

const subscriptions = new Map<string, Set<Socket>>();

interface UserContext {
  userId: string;
  sessionNumber: number;
}

io.on('connection', (socket) => {
    console.log('api-server connected');
    socket.on('subscribe', (channel: string, context: UserContext) => {
      socket.emit('message', `Subscribed to ${channel} for user ${context.userId} and session ${context.sessionNumber}`);
      if (!subscriptions.has(channel)) {
        const sockets = new Set<Socket>();
        sockets.add(socket);
        subscriptions.set(channel, sockets);
      } else {
        subscriptions.get(channel)!.add(socket);
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
      subscriptions.get(channel)?.forEach((socket) => {
        console.log('Sending data to subscribed client on channel', channel);
        socket.emit(channel, response.data);
      });
    } catch (error: Error | any) {
      console.error(`Error fetching data for channel ${channel}:`, error);
    }
  }
}, 30000);
