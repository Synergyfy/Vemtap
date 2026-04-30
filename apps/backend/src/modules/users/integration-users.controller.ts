import {
  Controller,
  Post,
  Body,
  UseGuards,
  Logger,
  ConflictException,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { BusinessesService } from '../businesses/businesses.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { IntegrationApiKeyGuard } from '../qr-thrive/guards/integration-api-key.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { UserRole, UserStatus } from './entities/user.entity';
import { Public } from '../../common/decorators/public.decorator';
import { BillingPeriod } from '../subscriptions/entities/subscription.entity';
import * as bcrypt from 'bcrypt';

@ApiTags('Internal Integration')
@ApiHeader({
  name: 'x-vemtap-api-key',
  description: 'Secure API key for internal integration',
})
@Controller('users')
@UseGuards(IntegrationApiKeyGuard)
export class IntegrationUsersController {
  private readonly logger = new Logger(IntegrationUsersController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly businessesService: BusinessesService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Public()
  @Post('provision')
  @ApiOperation({ summary: 'Provision a user from QR-Thrive' })
  @ApiResponse({ status: 201, description: 'User provisioned successfully' })
  async provision(
    @Body()
    dto: {
      email: string;
      firstName: string;
      lastName: string;
      planId: string;
    },
  ) {
    this.logger.log(
      `Provisioning user ${dto.email} from QR-Thrive with plan ${dto.planId}...`,
    );

    // 1. Check if user exists
    let user = await this.usersService.findByEmail(dto.email);

    if (user) {
      this.logger.warn(
        `User ${dto.email} already exists in Vemtap. Linking to new subscription.`,
      );
    } else {
      // 2. Create User (Owner)
      // Default password for integrated users (they should change it or use SSO)
      const defaultPassword = 'IntegratedUser123!';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      user = await this.usersService.create({
        email: dto.email.toLowerCase(),
        firstName: dto.firstName,
        lastName: dto.lastName,
        password: hashedPassword,
        role: UserRole.OWNER,
        status: UserStatus.ACTIVE,
        isPasswordChanged: false,
      });

      this.logger.log(`Created new owner account for ${dto.email}`);
    }

    // 3. Ensure Business exists
    let business = await this.businessesService.findByOwner(user.id);
    if (!business) {
      business = await this.businessesService.create({
        name: `${dto.firstName}'s Business`,
        ownerId: user.id,
      });
      this.logger.log(`Created new business for ${dto.email}`);
    }

    // 4. Subscribe to the requested plan
    try {
      await this.subscriptionsService.subscribe({
        businessId: business.id,
        planId: dto.planId,
        billingPeriod: BillingPeriod.MONTHLY,
        isTrial: false,
      });
      this.logger.log(
        `Successfully subscribed ${dto.email} to plan ${dto.planId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to assign plan ${dto.planId} to business ${business.id}: ${error.message}`,
      );
      // Don't fail the whole request if subscription fails,
      // the user still exists and can be manually upgraded.
    }

    return {
      id: user.id,
      email: user.email,
      businessId: business.id,
      status: 'provisioned',
    };
  }
}
