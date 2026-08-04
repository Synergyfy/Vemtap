import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getPreferences(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'notificationPreferences'],
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      push: true,
      email: true,
      sms: true,
      marketing: true,
      orderUpdates: true,
      loyalty: true,
      support: true,
      rewardAlerts: true,
      activityDigest: true,
      smsSecurity: false,
      ...(user.notificationPreferences || {}),
    };
  }

  async updatePreferences(userId: string, preferences: Record<string, boolean>) {
    const updated = { ...(await this.getPreferences(userId)), ...preferences };
    await this.userRepository.update(userId, { notificationPreferences: updated });
    return updated;
  }

  async broadcastToRole(
    role: UserRole,
    title: string,
    message: string,
    type: string = 'broadcast',
  ) {
    const users = await this.userRepository.find({ where: { role } });
    const notifications = users.map((user) =>
      this.notificationsRepository.create({
        userId: user.id,
        title,
        message,
        type,
      }),
    );
    return this.notificationsRepository.save(notifications);
  }

  async create(
    userId: string,
    title: string,
    message: string,
    type: string = 'info',
  ) {
    const notification = this.notificationsRepository.create({
      userId,
      title,
      message,
      type,
    });
    return this.notificationsRepository.save(notification);
  }

  async findByUser(userId: string) {
    return this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string) {
    return this.notificationsRepository.update(id, { isRead: true });
  }

  async markAllAsRead(userId: string) {
    return this.notificationsRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async getUnreadCount(userId: string) {
    return this.notificationsRepository.count({
      where: { userId, isRead: false },
    });
  }

  async getBroadcastHistory() {
    // This is a simplified implementation. In a real system,
    // we might have a dedicated Broadcast entity.
    // Here we find notifications of type 'broadcast' and group them by title/message.
    const rawHistory = await this.notificationsRepository
      .createQueryBuilder('notification')
      .select('notification.title', 'title')
      .addSelect('notification.message', 'message')
      .addSelect('notification.type', 'type')
      .addSelect('MIN(notification.createdAt)', 'date')
      .addSelect('COUNT(notification.id)', 'recipientCount')
      .where('notification.type = :type', { type: 'broadcast' })
      .groupBy('notification.title')
      .addGroupBy('notification.message')
      .addGroupBy('notification.type')
      .orderBy('date', 'DESC')
      .limit(10)
      .getRawMany();

    return rawHistory.map((h) => ({
      id: `BRD-${Buffer.from(h.title).toString('hex').slice(0, 4)}`,
      title: h.title,
      message: h.message,
      type: h.type === 'broadcast' ? 'Announcement' : 'Targeted',
      status: 'Sent',
      date: new Date(h.date).toLocaleDateString(),
      recipients: `Sent to ${h.recipientCount} Affiliates`,
    }));
  }
}
