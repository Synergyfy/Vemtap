import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { BusinessCreditWallet } from '../messaging/entities/business-credit-wallet.entity';
import { SupportTicket, TicketStatus } from './entities/support-ticket.entity';

@Injectable()
export class BotContextService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(BusinessCreditWallet)
    private readonly walletRepo: Repository<BusinessCreditWallet>,
    @InjectRepository(SupportTicket)
    private readonly ticketRepo: Repository<SupportTicket>,
  ) {}

  async getUserContext(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['business'],
    });

    if (!user) return null;

    let credits = { sms: 0, email: 0, whatsapp: 0 };
    if (user.businessId) {
      const wallet = await this.walletRepo.findOne({
        where: { businessId: user.businessId },
      });
      if (wallet) {
        credits = {
          sms: wallet.smsCredits,
          email: wallet.emailCredits,
          whatsapp: wallet.whatsappCredits,
        };
      }
    }

    const openTickets = await this.ticketRepo.count({
      where: { userId, status: TicketStatus.PENDING },
    });

    return {
      name: user.firstName,
      businessName: user.business?.name || 'N/A',
      credits,
      openTickets,
      role: user.role,
    };
  }
}
