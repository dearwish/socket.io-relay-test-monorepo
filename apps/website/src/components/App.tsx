import React, { useEffect, useState } from 'react';

interface AppProps {
  socket: SocketIOClient.Socket;
  context: {
    userId: string;
    sessionNumber: number;
  };
}

export const App = ({ socket, context }: AppProps) => {
  interface WeatherData {
    temperature: string,
    condition: string,
    location: string,

    [key: string]: any;
  }

  interface StocksData {
    stock: string;
    price: number;
    change: number;

    [key: string]: any;
  }

  interface StatusData {
    status: string;

    [key: string]: any;
  }

  interface MessageState {
    [channel: string]: string[]; // Each channel maps to an array of strings
  }

  // State to hold messages for each channel
  const [messages, setMessages] = useState<MessageState>({});

  const { userId, sessionNumber } = context;

  useEffect(() => {
    socket.on('stats', (stats: string) => {
      console.log(stats);
    });
    socket.on(
      'message',
      (channel: string, message: WeatherData | StocksData | StatusData) => {
        let formattedMessage;
        const date = new Date().toUTCString();
        if (channel === 'weather') {
          const { temperature, condition, location } = message as WeatherData;
          formattedMessage = `${date}: ${temperature} and ${condition} in ${location}`;
        } else if (channel === 'stocks') {
          const { stock, price, change } = message as StocksData;
          formattedMessage = `${date}: ${stock} price is $${price} (${change > 0 ? '+' : ''}${change})`;
        } else if (channel === 'status') {
          const { status } = message as StatusData;
          formattedMessage = `${date}: ${status}`;
        } else {
          formattedMessage = message.toString();
        }

        // Append the new message to the respective channel
        setMessages(prev => {
          return {
            ...prev,
            [channel]: [...(prev[channel] || []), formattedMessage],
          };
        });
      }
    );

    // Subscribe to channels
    socket.emit('subscribe', 'weather', { userId, sessionNumber });
    socket.emit('subscribe', 'stocks', { userId, sessionNumber });

    // Cleanup on component unmount
    return () => {
      socket.off('message');
    };
  }, []);

  return (
    <div>
      <h1>Real-Time Data for user {userId} and session {sessionNumber}</h1>
      {Object.entries(messages).map(([channel, channelMessages]) => (
        <div key={channel}>
          <h3>{channel}</h3>
          <ul>
            {channelMessages.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};
