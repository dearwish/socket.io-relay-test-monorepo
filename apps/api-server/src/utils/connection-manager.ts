export class ConnectionManager {
  private connections: Map<string, Map<number, Set<string>>>;

  constructor() {
    this.connections = new Map();
  }

  // Add a new WebSocket connection for user ID and session number
  public addConnection(userId: string, sessionNumber: number, socketId: string): void {
    // Check if the user already has a connection
    const userSessions = this.connections.get(userId);
    if (userSessions) {
      const sessionConnections = userSessions.get(sessionNumber);
      if (sessionConnections) {
        sessionConnections.add(socketId);
      } else {
        userSessions.set(sessionNumber, new Set([socketId]));
      }
    } else {
      this.connections.set(userId, new Map([[sessionNumber, new Set([socketId])]]));
    }
  }

  public getConnections(userId: string, sessionNumber: number): Array<string> | undefined {
    const userConnections = this.connections.get(userId);
    const sockets = userConnections?.get(sessionNumber);

    return sockets && sockets.size > 0 ? Array.from(sockets) : undefined;
  }

  public removeConnection(userId: string, sessionNumber: number): boolean {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      return userConnections.delete(sessionNumber);
    }
    return false;
  }

  public getUserSessions(userId: string): Map<number, Set<string>> | undefined {
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
    const userConnections = this.getUserSessions(userId);
    if (!userConnections) {
      return `User ${userId} has no active connections`;
    }
    let stats = ` User ${userId} has ${userConnections.size} active connections:\n`;
    for (const [sessionNumber, connections] of userConnections) {
      stats += `  Session: ${sessionNumber} connections: "${Array.from(connections)}"\n`;
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
      const userConnections = this.getUserSessions(userId);
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