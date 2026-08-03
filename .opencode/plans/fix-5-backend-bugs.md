# Fix Plan: 5 Backend Bugs

## Bug 4: growth-chart range query param rejection

**File:** `apps/backend/src/modules/visitors/visitors.controller.ts`
**Lines:** 186-197

Remove the second `@Query() filter: BranchFilterDto` parameter from `getGrowthChart`. `VisitorGrowthQueryDto` already has `branchId` and `allBranches`.

### Change:

```typescript
// BEFORE:
async getGrowthChart(
    @Req() req: any,
    @Query() query: VisitorGrowthQueryDto,
    @Query() filter: BranchFilterDto,
): Promise<VisitorGrowthResponseDto> {
    const context = await this.getResolvedContext(req, filter);
    ...
}

// AFTER:
async getGrowthChart(
    @Req() req: any,
    @Query() query: VisitorGrowthQueryDto,
): Promise<VisitorGrowthResponseDto> {
    const context = await this.getResolvedContext(req, query);
    ...
}
```

---

## Bug 5: footfall throws generic 400

**File:** `apps/backend/src/modules/analytics/analytics.service.ts`

### Change 1 (line 185): Fix column name

```typescript
// BEFORE:
.select("COALESCE(device.name, device.serialNumber, 'Main Entrance')", "entrance")

// AFTER:
.select("COALESCE(device.name, device.code, 'Main Entrance')", "entrance")
```

### Change 2 (lines 245-247): Improve error handling

```typescript
// BEFORE:
} catch (error) {
    this.logger.error('[AnalyticsService] Error in getFootfallAnalytics:', error);
    throw new BadRequestException('Failed to fetch footfall analytics');
}

// AFTER:
} catch (error) {
    this.logger.error('[AnalyticsService] Error in getFootfallAnalytics:', error);
    throw error;
}
```

---

## Bug 1: usedLoyaltyPrograms hardcoded to 0

### File 1: `apps/backend/src/modules/subscriptions/subscriptions.module.ts`

Add `Reward` entity import:

```typescript
// Add to imports array in TypeOrmModule.forFeature:
import { Reward } from '../loyalty/entities/reward.entity';

// In the forFeature array, add:
Reward,
```

### File 2: `apps/backend/src/modules/subscriptions/subscriptions.service.ts`

```typescript
// Add import at top:
import { Reward } from '../loyalty/entities/reward.entity';

// Add repository injection in constructor:
@InjectRepository(Reward)
private rewardRepository: Repository<Reward>,

// Replace line 668:
// BEFORE:
const usedLoyaltyPrograms = 0;

// AFTER:
const usedLoyaltyPrograms = await this.rewardRepository.count({
    where: { businessId },
});
```

---

## Bug 2: Loyalty rules entity + endpoints

### New File: `apps/backend/src/modules/loyalty/entities/loyalty-rule.entity.ts`

```typescript
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum RuleType {
    SPENDING = 'spending',
    VISIT = 'visit',
    HYBRID = 'hybrid',
}

@Entity('loyalty_rules')
export class LoyaltyRule extends AbstractBaseEntity {
    @ApiProperty()
    @ManyToOne(() => Business)
    @JoinColumn({ name: 'businessId' })
    business: Business;

    @Column()
    businessId: string;

    @ApiProperty({ required: false })
    @ManyToOne(() => Branch, { nullable: true })
    @JoinColumn({ name: 'branchId' })
    branch: Branch;

    @Column({ nullable: true })
    branchId: string;

    @ApiProperty({ enum: RuleType, default: RuleType.HYBRID })
    @Column({ type: 'simple-enum', enum: RuleType, default: RuleType.HYBRID })
    ruleType: RuleType;

    @ApiProperty({ default: true })
    @Column({ default: true })
    isActive: boolean;

    @ApiProperty({ default: 10 })
    @Column({ default: 10 })
    spendingBaseAmount: number;

    @ApiProperty({ default: 1 })
    @Column({ default: 1 })
    spendingBasePoints: number;

    @ApiProperty({ default: 50 })
    @Column({ default: 50 })
    visitPoints: number;

    @ApiProperty({ default: 24 })
    @Column({ default: 24 })
    visitCooldownHours: number;

    @ApiProperty({ default: 100 })
    @Column({ default: 100 })
    firstVisitBonus: number;

    @ApiProperty({ default: 500 })
    @Column({ default: 500 })
    birthdayBonus: number;

    @ApiProperty({ default: 200 })
    @Column({ default: 200 })
    referralBonus: number;
}
```

### New File: `apps/backend/src/modules/loyalty/dto/loyalty-rule.dto.ts`

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsOptional,
    IsBoolean,
    IsNumber,
    IsEnum,
    Min,
} from 'class-validator';
import { RuleType } from '../entities/loyalty-rule.entity';

export class UpdateLoyaltyRuleDto {
    @ApiPropertyOptional({ enum: RuleType })
    @IsOptional()
    @IsEnum(RuleType)
    ruleType?: RuleType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(1)
    spendingBaseAmount?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(1)
    spendingBasePoints?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    visitPoints?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    visitCooldownHours?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    firstVisitBonus?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    birthdayBonus?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    referralBonus?: number;
}
```

### Modify: `apps/backend/src/modules/loyalty/loyalty.module.ts`

```typescript
// Add to imports:
import { LoyaltyRule } from './entities/loyalty-rule.entity';
import { Business } from '../businesses/entities/business.entity';

// Add to TypeOrmModule.forFeature array:
LoyaltyRule,
Business,
```

### Modify: `apps/backend/src/modules/loyalty/loyalty.service.ts`

Add repository injection:
```typescript
@InjectRepository(LoyaltyRule)
private loyaltyRuleRepo: Repository<LoyaltyRule>,
```

Add service methods:
```typescript
async getRules(businessId: string, branchId?: string) {
    const where: any = { businessId };
    if (branchId) where.branchId = branchId;

    let rule = await this.loyaltyRuleRepo.findOne({ where });

    if (!rule) {
        rule = this.loyaltyRuleRepo.create({ businessId, branchId });
        rule = await this.loyaltyRuleRepo.save(rule);
    }

    return rule;
}

async upsertRules(businessId: string, dto: UpdateLoyaltyRuleDto, branchId?: string) {
    const where: any = { businessId };
    if (branchId) where.branchId = branchId;

    let rule = await this.loyaltyRuleRepo.findOne({ where });

    if (rule) {
        Object.assign(rule, dto);
    } else {
        rule = this.loyaltyRuleRepo.create({ ...dto, businessId, branchId });
    }

    return this.loyaltyRuleRepo.save(rule);
}
```

### Modify: `apps/backend/src/modules/loyalty/loyalty.controller.ts`

Add routes:
```typescript
@Get('rules')
@Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
@ApiOperation({ summary: 'Get loyalty rules for business/branch' })
@ApiQuery({ name: 'branchId', required: false })
async getRules(
    @Request() req: { user: User },
    @Query('branchId') branchId?: string,
) {
    const user = req.user as any;
    const businessId = user?.businessId || user?.business?.id;
    return this.loyaltyService.getRules(businessId, branchId);
}

@Patch('rules')
@Roles(UserRole.OWNER, UserRole.ADMIN)
@ApiOperation({ summary: 'Update loyalty rules' })
@ApiQuery({ name: 'branchId', required: false })
async updateRules(
    @Request() req: { user: User },
    @Body() dto: UpdateLoyaltyRuleDto,
    @Query('branchId') branchId?: string,
) {
    const user = req.user as any;
    const businessId = user?.businessId || user?.business?.id;
    return this.loyaltyService.upsertRules(businessId, dto, branchId);
}
```

---

## Bug 3: givePoints ignores loyalty rules

### Modify: `apps/backend/src/modules/loyalty/dto/loyalty.dto.ts`

Add to `GivePointsDto`:
```typescript
@ApiPropertyOptional({ description: 'Spending amount in currency. If provided without points, points are calculated from active loyalty rule.' })
@IsOptional()
@IsNumber()
@Min(0)
spendingAmount?: number;
```

### Modify: `apps/backend/src/modules/loyalty/loyalty.service.ts` (givePoints method)

```typescript
async givePoints(staff: User, dto: GivePointsDto) {
    const customer = await this.userRepo.findOne({
        where: { uniqueCode: dto.customerCode, role: UserRole.CUSTOMER },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const branch = await this.branchRepo.findOne({
        where: { id: dto.branchId },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    let pointsToAward = dto.points;

    // If no explicit points but spendingAmount provided, calculate from rules
    if (!pointsToAward && dto.spendingAmount) {
        const rule = await this.getRules(branch.businessId, branch.id);
        if (rule && rule.isActive) {
            pointsToAward = Math.floor(
                (dto.spendingAmount / rule.spendingBaseAmount) * rule.spendingBasePoints,
            );
        }
    }

    if (!pointsToAward || pointsToAward <= 0) {
        throw new BadRequestException('No points to award');
    }

    const transaction = this.pointTransactionRepo.create({
        amount: pointsToAward,
        type: PointTransactionType.EARNED,
        reason: dto.reason || 'Points given by staff',
        customerId: customer.id,
        givenById: staff.id,
        businessId: branch.businessId,
        branchId: branch.id,
    });

    return this.pointTransactionRepo.save(transaction);
}
```

---

## Migration

After creating the entity, run:
```bash
cd apps/backend
pnpm migration:generate src/database/migrations/SyncLoyaltyRulesEntity
```

This will generate a migration that adds the missing `businessId` FK constraint.
