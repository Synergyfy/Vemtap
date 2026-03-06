import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Repository, DataSource, Between } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Channel } from '../enums/channel.enum';
import { MessageDirection, MessageStatus } from '../enums/message.enum';
import { Message } from '../entities/message.entity';
import { BusinessCredit } from '../entities/business-credit.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../../subscriptions/entities/subscription.entity';

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
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(BusinessCredit)
    private readonly businessCreditRepo: Repository<BusinessCredit>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly dataSource: DataSource,
  ) {}

  public async getBalance(branchId: string): Promise<number> {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
      relations: ['business'],
    });
    if (!branch || !branch.business) {
      throw new NotFoundException('Branch or associated business not found');
    }
    // Wallet balance is still likely business-level, but accessed via branch
    return Number(branch.business.balance) || 0;
  }

  public async deduct(
    branchId: string,
    amount: number,
    reason: string,
  ): Promise<void> {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    await this.dataSource.transaction(async (manager) => {
      const business = await manager.findOne(Business, {
        where: { id: branch.businessId },
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
    });
  }

  public async deductChannelCredit(
    branchId: string,
    channel: Channel,
    amount: number,
  ): Promise<void> {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    // 1. Get Subscription and Plan (Subscription is still Business-level)
    const subscription = await this.subscriptionRepo.findOne({
      where: {
        businessId: branch.businessId,
        status: SubscriptionStatus.ACTIVE,
      },
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

    // 2. Check current month's usage for this branch
    const usage = await this.messageRepository.count({
      where: {
        branchId,
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
          where: { branchId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!credits) {
          throw new BadRequestException(
            `Plan ${channel} credits exhausted and no top-up balance found for this branch`,
          );
        }

        let balance = 0;
        if (channel === Channel.SMS) balance = credits.smsBalance;
        else if (channel === Channel.EMAIL) balance = credits.emailBalance;
        else if (channel === Channel.WHATSAPP)
          balance = credits.whatsappBalance;

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
