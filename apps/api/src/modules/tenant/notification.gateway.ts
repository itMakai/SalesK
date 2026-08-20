import { Injectable } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/** Lightweight tenant-scoped channel for operational conversations.  REST remains
 * the authority for permissions; sockets only notify clients to refresh. */
@Injectable()
@WebSocketGateway({ namespace: '/notifications', cors: { origin: '*' } })
export class NotificationGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    const tenantId = typeof client.handshake.query.tenantId === 'string' ? client.handshake.query.tenantId : undefined;
    if (!tenantId) return client.disconnect(true);
    client.join(`tenant:${tenantId}`);
  }

  publish(tenantId: string) {
    this.server.to(`tenant:${tenantId}`).emit('notifications:changed');
  }
}
