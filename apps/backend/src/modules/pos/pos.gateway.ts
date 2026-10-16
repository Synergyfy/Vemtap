import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';
import { User, UserRole } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';
import { CatalogueOrder } from '../catalogue-orders/entities/catalogue-order.entity';
import { PosTill } from './entities/pos-till.entity';
import { ORDER_EVENTS } from '../catalogue-orders/order-events';
import type { OrderLifecycleEvent } from '../catalogue-orders/order-events';

/** Socket events the POS namespace sends. */
export const POS_SOCKET_EVENTS = {
  ORDER_CREATED: 'order.created',
  ORDER_STATUS: 'order.status',
  TICKET_UPDATED: 'ticket.updated',
  TICKET_CLEARED: 'ticket.cleared',
  PAYMENT_COMPLETED: 'payment.completed',
  DISPLAY_TIP: 'display.tip',
} as const;

const STAFF_ROLES = [
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.ADMIN,
  UserRole.STAFF,
];

interface PosSocketData {
  userId?: string;
  businessId?: string;
  trackingToken?: string;
}

interface PosSocketAuth {
  token?: string;
  trackingToken?: string;
}

export const branchRoom = (branchId: string) => `branch_${branchId}`;
export const tillRoom = (tillId: string) => `till_${tillId}`;
export const orderRoom = (token: string) => `order_${token}`;

/**
 * Live POS feed.
 *
 * - Staff connect with their JWT (`auth.token`) and join every branch room of
 *   their business: kitchen stream and order updates.
 * - A till or customer display then sends `till.join` to follow one till's
 *   ticket.
 * - A guest connects with `auth.trackingToken` (no login) and joins only that
 *   order's room.
 */
@WebSocketGateway({ cors: { origin: '*' }, namespace: 'pos' })
export class PosGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger('PosGateway');

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(CatalogueOrder)
    private readonly orderRepository: Repository<CatalogueOrder>,
    @InjectRepository(PosTill)
    private readonly tillRepository: Repository<PosTill>,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const auth = (client.handshake.auth ?? {}) as PosSocketAuth;
      const data = client.data as PosSocketData;
      const trackingToken = auth.trackingToken;
      if (trackingToken) {
        const order = await this.orderRepository.findOne({
          where: { trackingToken },
          select: ['id'],
        });
        if (!order) return client.disconnect();
        data.trackingToken = trackingToken;
        await client.join(orderRoom(trackingToken));
        return;
      }

      const token =
        auth.token || client.handshake.headers.authorization?.split(' ')[1];
      if (!token) return client.disconnect();
      const payload = this.jwtService.verify<{ sub: string }>(token);
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        select: ['id', 'role', 'businessId', 'branchId'],
      });
      if (!user?.businessId || !STAFF_ROLES.includes(user.role)) {
        return client.disconnect();
      }

      data.userId = user.id;
      data.businessId = user.businessId;
      const branches = await this.branchRepository.find({
        where: { businessId: user.businessId },
        select: ['id'],
      });
      await client.join(branches.map((branch) => branchRoom(branch.id)));
    } catch (error) {
      this.logger.debug(
        `POS socket rejected: ${error instanceof Error ? error.message : error}`,
      );
      client.disconnect();
    }
  }

  @SubscribeMessage('till.join')
  async joinTill(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { tillId?: string },
  ) {
    const { businessId } = client.data as PosSocketData;
    if (!businessId || !body?.tillId) return { ok: false };
    const till = await this.tillRepository.findOne({
      where: { id: body.tillId, businessId },
      select: ['id'],
    });
    if (!till) return { ok: false };
    await client.join(tillRoom(till.id));
    return { ok: true };
  }

  @SubscribeMessage('till.leave')
  async leaveTill(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { tillId?: string },
  ) {
    if (body?.tillId) await client.leave(tillRoom(body.tillId));
    return { ok: true };
  }

  @OnEvent(ORDER_EVENTS.CREATED)
  onOrderCreated(event: OrderLifecycleEvent) {
    this.server
      ?.to(branchRoom(event.branchId))
      .emit(POS_SOCKET_EVENTS.ORDER_CREATED, event);
  }

  @OnEvent(ORDER_EVENTS.STATUS_CHANGED)
  onOrderStatus(event: OrderLifecycleEvent) {
    this.server
      ?.to(branchRoom(event.branchId))
      .emit(POS_SOCKET_EVENTS.ORDER_STATUS, event);
    if (event.trackingToken) {
      // Guests get the status only; no business or branch identifiers.
      this.server
        ?.to(orderRoom(event.trackingToken))
        .emit(POS_SOCKET_EVENTS.ORDER_STATUS, {
          orderId: event.orderId,
          status: event.status,
          at: event.at,
        });
    }
  }

  emitToTill(tillId: string, event: string, payload: unknown) {
    this.server?.to(tillRoom(tillId)).emit(event, payload);
  }
}
