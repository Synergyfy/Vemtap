import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'support',
})
export class SupportGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('SupportGateway');

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Support WebSocket Gateway Initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        this.logger.debug('Anonymous support client connected');
        client.data.userId = null;
        client.data.role = 'guest';
        return;
      }

      try {
        const payload = this.jwtService.verify(token);
        const user = await this.userRepo.findOne({ where: { id: payload.sub } });

        if (user) {
          client.data.userId = user.id;
          client.data.role = user.role;
          client.join(`user_${user.id}`);
          this.logger.log(`Support client connected: ${user.id} (${user.role})`);
        } else {
          client.data.userId = null;
          client.data.role = 'guest';
        }
      } catch (err) {
        this.logger.warn(`Invalid support token: ${err.message}`);
        client.data.userId = null;
        client.data.role = 'guest';
      }
    } catch (e) {
      this.logger.error(`Support connection error: ${e.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Support client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinTicket')
  handleJoinTicket(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { ticketId: string },
  ) {
    this.logger.debug(`User ${client.data.userId} joining support ticket ${data.ticketId}`);
    client.join(`ticket_${data.ticketId}`);
    return { status: 'joined', ticketId: data.ticketId };
  }

  @SubscribeMessage('leaveTicket')
  handleLeaveTicket(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { ticketId: string },
  ) {
    client.leave(`ticket_${data.ticketId}`);
    return { status: 'left', ticketId: data.ticketId };
  }

  emitNewMessage(ticketId: string, message: any) {
    this.server.to(`ticket_${ticketId}`).emit('newSupportMessage', message);
    
    // Also notify the specific user if they are not in the ticket room
    if (message.recipientId) {
      this.server.to(`user_${message.recipientId}`).emit('supportNotification', {
        type: 'new_message',
        ticketId,
        message,
      });
    }
  }

  emitTicketStatusUpdate(ticketId: string, status: string) {
    this.server.to(`ticket_${ticketId}`).emit('ticketStatusUpdated', { ticketId, status });
  }

  emitNewChatEscalated(ticket: any) {
    // Notify all admins and agents in the namespace about a new escalation
    this.server.emit('newChatEscalated', {
      ticket,
      timestamp: new Date(),
    });
  }
}
