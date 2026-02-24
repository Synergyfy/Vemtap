import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository, DataSource, Between } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { Channel } from '../enums/channel.enum';
import { Message, MessageDirection, MessageStatus } from '../entities/message.entity';
import { BusinessCredit } from '../entities/business-credit.entity';
import { Subscription, SubscriptionStatus } from '../../subscriptions/entities/subscription.entity';

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

@Injectable()
export class CreditService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(BusinessCredit)
    private readonly businessCreditRepo: Repository<BusinessCredit>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly dataSource: DataSource,
  ) { }

  public async getBalance(businessId: string): Promise<number> {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
    });
    if (!business) {
      throw new BadRequestException('Business not found');
    }
    return Number(business.balance) || 0;
  }

  public async deduct(
    businessId: string,
    amount: number,
    reason: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const business = await manager.findOne(Business, {
        where: { id: businessId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!business) {
        throw new BadRequestException('Business not found');
      }

      const currentBalance = Number(business.balance) || 0;
      if (currentBalance < amount) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      business.balance = currentBalance - amount;
      await manager.save(business);

      // TODO: Log transaction to wallet_transactions table when created
    });
  }

  public async deductChannelCredit(
    businessId: string,
    channel: Channel,
    amount: number,
  ): Promise<void> {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    // 1. Get Subscription and Plan
    const subscription = await this.subscriptionRepo.findOne({
      where: { businessId, status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new BadRequestException('No active subscription found');
    }

    const plan = subscription.plan;
    let planLimit = 0;
    if (channel === Channel.SMS) planLimit = Number(plan.smsCredits);
    else if (channel === Channel.EMAIL) planLimit = Number(plan.emailCredits);
    else if (channel === Channel.WHATSAPP)
      planLimit = Number(plan.whatsappCredits);

    // 2. Check current month's usage
    const usage = await this.messageRepository.count({
      where: {
        businessId,
        channel,
        direction: MessageDirection.OUTBOUND,
        status: MessageStatus.SENT,
        timestamp: Between(start, end),
      },
    });

    const currentFreeAvailable = Math.max(0, planLimit - usage);
    const topupNeeded = Math.max(0, amount - currentFreeAvailable);

    if (topupNeeded > 0) {
      await this.dataSource.transaction(async (manager) => {
        const credits = await manager.findOne(BusinessCredit, {
          where: { businessId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!credits) {
          throw new BadRequestException(
            `Plan ${channel} credits exhausted and no top-up balance found`,
          );
        }

        let balance = 0;
        if (channel === Channel.SMS) balance = credits.smsBalance;
        else if (channel === Channel.EMAIL) balance = credits.emailBalance;
        else if (channel === Channel.WHATSAPP) balance = credits.whatsappBalance;

        if (balance < topupNeeded) {
          throw new BadRequestException(
            `Insufficient ${channel} credits. Plan exhausted and Top-up balance (${balance}) is less than needed (${topupNeeded}).`,
          );
        }

        if (channel === Channel.SMS) credits.smsBalance -= topupNeeded;
        else if (channel === Channel.EMAIL) credits.emailBalance -= topupNeeded;
        else if (channel === Channel.WHATSAPP)
          credits.whatsappBalance -= topupNeeded;

        await manager.save(credits);
      });
    }
  }
}
