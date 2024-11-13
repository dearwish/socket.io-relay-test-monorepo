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

  public getConnections(userId: string): Map<number, string> | undefined {
    return this.connections.get(userId);
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

  public getUserStats(userId: string): string {
    const userConnections = this.getConnections(userId);
    if (!userConnections) {
      return `User ${userId} has no active connections`;
    }
    let stats = ` User ${userId} has ${userConnections.size} active connections:\n`;
    for (const [sessionNumber, connection] of userConnections) {
      stats += `  Session: ${sessionNumber} connection: "${connection}"\n`;
    }
    return stats;
  }

  public getUsers(): Array<string> {
    return Array.from(this.connections.keys());
  }

  public getStats(): string {
    const users = this.getUsers();
    let stats = '';
    for (const userId of users) {
      const userConnections = this.getConnections(userId);
      if (!userConnections) {
        console.log(`No active connections found for user ${userId}`);
        continue;
      }
      const userStats = this.getUserStats(userId);
      stats += `User ${userId} stats:\n${userStats}`;
    }
    return stats;
  }
}

const connectionManager = new ConnectionManager();
export default connectionManager;