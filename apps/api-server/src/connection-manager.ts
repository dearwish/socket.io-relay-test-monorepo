
export class ConnectionManager {
  private connections: Map<string, Map<number, string>>;

  constructor() {
    this.connections = new Map();
  }

  // Add a new WebSocket connection for user ID and session number
  public addConnection(userId: string, sessionNumber: number, socketId: string): void {
    // Check if the user already has a connection
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      const userSessionConnection = userConnections.get(sessionNumber);
      if (userSessionConnection) {
        console.warn(`User ${userId} already has an active connection for session ${sessionNumber}.`);
        return;
      }
      userConnections.set(sessionNumber, socketId);
    } else {
      this.connections.set(userId, new Map([[sessionNumber, socketId]]));
    }
  }

  public getConnection(userId: string, sessionNumber: number): string | undefined {
    const userConnections = this.connections.get(userId);
    return userConnections?.get(sessionNumber);
  }

  public removeConnection(userId: string, sessionNumber: number): boolean {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      return userConnections.delete(sessionNumber);
    }
    return false;
  }

  // Check if a user has an active WebSocket connection
  public hasConnections(userId: string): boolean {
    return this.connections.has(userId);
  }

  // Check if a user has an active WebSocket connection
  public hasConnection(userId: string, sessionNumber: number): boolean {
    const userConnections = this.connections.get(userId);
    return userConnections?.has(sessionNumber) || false;
  }
}

const connectionManager = new ConnectionManager();
export default connectionManager;