import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Business,
  BusinessStatus,
} from '../../modules/businesses/entities/business.entity';
import { User, UserRole } from '../../modules/users/entities/user.entity';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

const VERIFICATION_REQUIRED_MESSAGE =
  'Your business is not verified by admin. You cannot access partnership services until approved.';

@Injectable()
export class BusinessVerifiedGuard implements CanActivate {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: User }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException(VERIFICATION_REQUIRED_MESSAGE);
    }

    // Admins manage the platform and individual agents run their own
    // affiliate program (gated by their own KYC), so neither is subject to
    // business verification. Only business owners and managers are.
    if (
      user.role === UserRole.ADMIN ||
      user.role === UserRole.AGENT ||
      user.role === UserRole.CUSTOMER
    ) {
      return true;
    }

    let businessId: string | undefined = user.businessId;

    if (!businessId && user.role === UserRole.OWNER) {
      const owned = await this.businessRepository.findOne({
        where: { ownerId: user.id },
      });
      businessId = owned?.id;
    }

    if (!businessId) {
      throw new ForbiddenException(VERIFICATION_REQUIRED_MESSAGE);
    }

    const business = await this.businessRepository.findOne({
      where: { id: businessId },
    });

    if (!business || business.status !== BusinessStatus.ACTIVE) {
      throw new ForbiddenException(VERIFICATION_REQUIRED_MESSAGE);
    }

    return true;
  }
}
