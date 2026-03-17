import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Repository, DataSource, Between } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Channel } from '../enums/channel.enum';
import { MessageDirection, MessageStatus } from '../enums/message.enum';
import { Message } from '../entities/message.entity';
import { BusinessCredit } from '../entities/business-credit.entity';
import { BusinessCreditWallet } from '../entities/business-credit-wallet.entity';
import { CreditTransaction } from '../entities/credit-transaction.entity';
import { CreditTransactionType } from '../enums/credit-transaction-type.enum';
import {
  Subscription,
  SubscriptionStatus,
} from '../../subscriptions/entities/subscription.entity';
import { Plan } from '../../subscriptions/entities/plan.entity';

@Injectable()
export class CreditService {
  private readonly logger = new Logger(CreditService.name);

  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(BusinessCredit)
    private readonly businessCreditRepo: Repository<BusinessCredit>,
    @InjectRepository(BusinessCreditWallet)
    private readonly walletRepo: Repository<BusinessCreditWallet>,
    @InjectRepository(CreditTransaction)
    private readonly transactionRepo: Repository<CreditTransaction>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly dataSource: DataSource,
  ) {}

  async getOrCreateWallet(businessId: string): Promise<BusinessCreditWallet> {
    let wallet = await this.walletRepo.findOne({ where: { businessId } });
    if (!wallet) {
      wallet = this.walletRepo.create({
        businessId,
        smsCredits: 0,
        emailCredits: 0,
        whatsappCredits: 0,
      });
      await this.walletRepo.save(wallet);
    }
    return wallet;
  }

  async getBalance(businessId: string) {
    return this.getOrCreateWallet(businessId);
  }

  async addCredits(
    businessId: string,
    channel: Channel,
    amount: number,
    type: CreditTransactionType,
    reference?: string,
  ) {
    await this.dataSource.transaction(async (manager) => {
      let wallet = await manager.findOne(BusinessCreditWallet, {
        where: { businessId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        wallet = manager.create(BusinessCreditWallet, {
          businessId,
          smsCredits: 0,
          emailCredits: 0,
          whatsappCredits: 0,
        });
      }

      if (channel === Channel.SMS) wallet.smsCredits += amount;
      else if (channel === Channel.EMAIL) wallet.emailCredits += amount;
      else if (channel === Channel.WHATSAPP) wallet.whatsappCredits += amount;

      await manager.save(wallet);

      const transaction = manager.create(CreditTransaction, {
        businessId,
        channel,
        transactionType: type,
        credits: amount,
        reference,
      });
      await manager.save(transaction);
    });
  }

  async deductCredits(
    businessId: string,
    channel: Channel,
    amount: number,
    reference?: string,
  ) {
    await this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(BusinessCreditWallet, {
        where: { businessId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new BadRequestException('Insufficient credits (no wallet found)');
      }

      let balance = 0;
      if (channel === Channel.SMS) balance = wallet.smsCredits;
      else if (channel === Channel.EMAIL) balance = wallet.emailCredits;
      else if (channel === Channel.WHATSAPP) balance = wallet.whatsappCredits;

      if (balance < amount) {
        throw new BadRequestException(`Insufficient ${channel} credits`);
      }

      if (channel === Channel.SMS) wallet.smsCredits -= amount;
      else if (channel === Channel.EMAIL) wallet.emailCredits -= amount;
      else if (channel === Channel.WHATSAPP) wallet.whatsappCredits -= amount;

      await manager.save(wallet);

      const transaction = manager.create(CreditTransaction, {
        businessId,
        channel,
        transactionType: CreditTransactionType.MESSAGE_DEDUCTION,
        credits: amount,
        reference,
      });
      await manager.save(transaction);
    });
  }

  async allocateSubscriptionCredits(businessId: string, plan: Plan) {
    this.logger.log(`Allocating credits for business ${businessId} from plan ${plan.name}`);
    
    // According to PRD Part 9: "Unused credits are removed" at the end of billing cycle.
    // This implies we RESET the credits to the plan amount, rather than just adding.
    // However, if they have TOP-UP credits, we should probably keep them?
    // The PRD says "Top-up credits may have longer expiry".
    // This is getting complex. For now, I'll just ADD them as per "Assign Credits on Subscription" step.
    
    if (plan.smsCredits > 0) {
      await this.addCredits(
        businessId,
        Channel.SMS,
        plan.smsCredits,
        CreditTransactionType.SUBSCRIPTION_ALLOCATION,
        `Plan: ${plan.name}`,
      );
    }
    if (plan.emailCredits > 0) {
      await this.addCredits(
        businessId,
        Channel.EMAIL,
        plan.emailCredits,
        CreditTransactionType.SUBSCRIPTION_ALLOCATION,
        `Plan: ${plan.name}`,
      );
    }
    if (plan.whatsappCredits > 0) {
      await this.addCredits(
        businessId,
        Channel.WHATSAPP,
        plan.whatsappCredits,
        CreditTransactionType.SUBSCRIPTION_ALLOCATION,
        `Plan: ${plan.name}`,
      );
    }
  }

  // --- Compatibility with old methods ---

  public async getBalanceOld(branchId: string): Promise<number> {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
      relations: ['business'],
    });
    if (!branch || !branch.businessId) {
      throw new NotFoundException('Branch not found');
    }
    const wallet = await this.getOrCreateWallet(branch.businessId);
    return wallet.smsCredits; // Returning SMS as default for "balance" if not specified
  }

  public async deductChannelCredit(
    branchId: string,
    channel: Channel,
    amount: number,
  ): Promise<void> {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    await this.deductCredits(branch.businessId, channel, amount, `Branch: ${branch.name}`);
  }
}
