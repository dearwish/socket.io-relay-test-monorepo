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
    days: any[];
    address: string;

    [key: string]: any;
  }

  interface StocksData {
    Information: string;

    [key: string]: any;
  }

  interface StatusData {
    status: string;

    [key: string]: any;
  }

  // State to hold messages for each channel
  const [messages, setMessages] = useState<Record<string, string[][]>>({});

  const { userId, sessionNumber } = context;

  useEffect(() => {
    socket.on(
      'message',
      (channel: string, message: WeatherData | StocksData | StatusData) => {
        let formattedMessage;
        if (channel === 'weather') {
          formattedMessage = message.address;
        } else if (channel === 'stocks') {
          formattedMessage = message.Information;
        } else {
          formattedMessage = message.status;
        }

        // Append the new message to the respective channel
        setMessages((prev) => ({
          ...prev,
          [channel]: [...(prev[channel] || []), formattedMessage],
        }));
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
      <h1>Real-Time Data</h1>
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
