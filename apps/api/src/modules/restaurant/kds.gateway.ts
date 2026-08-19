import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/kds',
})
export class KdsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('KdsGateway');

  constructor(private prisma: PrismaService) {}

  handleConnection(client: Socket) {
    const branchId = client.handshake.query.branchId;
    if (branchId) {
      client.join(`branch_${branchId}`);
      this.logger.log(`Client connected to KDS for branch ${branchId}: ${client.id}`);
    } else {
      this.logger.warn(`Client connected without branchId: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Method to be called by OrderService when a new order is placed
  broadcastNewOrder(branchId: string, order: any) {
    this.server.to(`branch_${branchId}`).emit('new_order', order);
  }

  // Receive updates from the Kitchen Display (e.g. marking an item as 'preparing' or 'ready')
  @SubscribeMessage('update_item_status')
  async handleItemStatusUpdate(
    @MessageBody() data: { orderItemId: string; status: string; branchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Update the database
      const updatedItem = await this.prisma.extended.orderItem.update({
        where: { id: data.orderItemId },
        data: { kdsStatus: data.status },
        include: { order: true },
      });

      // Broadcast the update back to all clients in the branch (including POS terminals and other KDS screens)
      this.server.to(`branch_${data.branchId}`).emit('item_status_updated', {
        orderItemId: data.orderItemId,
        orderId: updatedItem.orderId,
        status: data.status,
      });

    } catch (error) {
      this.logger.error(`Failed to update item status: ${error.message}`);
    }
  }
}
