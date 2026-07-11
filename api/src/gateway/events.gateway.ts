import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private jwt: JwtService) {}

  // Authenticates the socket via JWT in handshake query, then joins workspace room
  async handleConnection(client: Socket) {
    const token = client.handshake.query.token as string;
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwt.verify<{ sub: string; workspaceId: string }>(token);
      client.data.workspaceId = payload.workspaceId;
      await client.join(payload.workspaceId);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket) {}

  // Emits budget:updated to every socket in the workspace room
  emitBudgetUpdated(workspaceId: string, eventId: string) {
    this.server.to(workspaceId).emit('budget:updated', { eventId });
  }
}
