import React from 'react';
import { createRoot } from 'react-dom/client';
import Client from 'socket.io-client';
import { App } from './components/App';

const token = 'MySecretToken'; // Replace with your own token
const socket = Client('http://localhost:3001', {
    path: '/ws',
    auth: { token }
}); // Connect to API server

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App socket={socket} context={{ userId: "123", sessionNumber: 1 }} />);
