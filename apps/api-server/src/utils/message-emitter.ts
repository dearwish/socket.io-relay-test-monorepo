import { Server as SocketIOServer } from 'socket.io';
import connectionManager from './connection-manager';
import { UserContext } from '../types/user-context';

export default class MessageEmitter {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  emit({ userId, sessionNumber}: UserContext, event: string, ...args: any[]): boolean {
    const socketIds = connectionManager.getConnections(userId, sessionNumber);
    if (!socketIds?.length) {
      console.log(`No active connection found for ${userId} and session ${sessionNumber}`);
      return false;
    }
    console.log(`Sending message to ${userId} session ${sessionNumber} on event ${event}`, socketIds);
    this.io.to(socketIds).emit(event, ...args);
    return true;
  }
}