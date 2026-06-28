import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingBrandRule } from '../entities/marketing-brand-rule.entity';
import { SaveBrandRuleDto } from '../dto/save-brand-rule.dto';
import { User } from '../../users/entities/user.entity';
import { Business } from '../../businesses/entities/business.entity';

@Injectable()
export class BrandRulesService {
  constructor(
    @InjectRepository(MarketingBrandRule)
    private readonly ruleRepo: Repository<MarketingBrandRule>,
  ) {}

  private async resolveBusinessId(user: User): Promise<string> {
    let businessId = user.businessId || user.ownedBusiness?.id;
    if (!businessId && user.role === 'Admin') {
      const firstBusiness = await this.ruleRepo.manager
        .getRepository(Business)
        .findOne({ where: {} });
      if (firstBusiness) {
        businessId = firstBusiness.id;
      }
    }
    if (!businessId) {
      throw new ForbiddenException('User is not associated with any business');
    }
    return businessId;
  }

  async getRules(user: User): Promise<MarketingBrandRule> {
    const businessId = await this.resolveBusinessId(user);
    let rules = await this.ruleRepo.findOne({ where: { businessId } });
    if (!rules) {
      rules = this.ruleRepo.create({ businessId });
      rules = await this.ruleRepo.save(rules);
    }
    return rules;
  }

  async saveRules(
    user: User,
    dto: SaveBrandRuleDto,
  ): Promise<MarketingBrandRule> {
    const businessId = await this.resolveBusinessId(user);
    let rules = await this.ruleRepo.findOne({ where: { businessId } });
    if (!rules) {
      rules = this.ruleRepo.create({ businessId });
    }
    Object.assign(rules, dto);
    return this.ruleRepo.save(rules);
  }

  async getRulesByBusinessId(
    businessId: string,
  ): Promise<MarketingBrandRule | null> {
    return this.ruleRepo.findOne({ where: { businessId } });
  }
}
