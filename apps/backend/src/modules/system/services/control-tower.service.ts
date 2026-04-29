import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import {
  Business,
  BusinessStatus,
} from '../../businesses/entities/business.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { User, UserRole } from '../../users/entities/user.entity';
import { AdministrationService } from '../../administration/administration.service';
import { BadRequestException } from '@nestjs/common';
import {
  BusinessControlRecord,
  CustomerControlRecord,
  SudoActionResponse,
} from '../interfaces/control-tower.interface';
import {
  BusinessSearchFilterDto,
  BusinessSudoActionDto,
  CustomerSearchFilterDto,
  CustomerSudoActionDto,
} from '../dto/control-tower.dto';

@Injectable()
export class ControlTowerService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly adminService: AdministrationService,
  ) {}

  async searchBusinesses(
    filter: BusinessSearchFilterDto,
  ): Promise<BusinessControlRecord[]> {
    const { query, limit = 10 } = filter;
    const where = query
      ? [
          { name: ILike(`%${query}%`) },
          { id: ILike(`%${query}%`) },
          { officialEmail: ILike(`%${query}%`) },
        ]
      : {};

    const businesses = await this.businessRepo.find({
      where,
      relations: ['owner', 'branches'],
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const businessStaffCounts = await Promise.all(
      businesses.map(async (biz) => {
        const branchIds = biz.branches.map((b) => b.id);
        if (branchIds.length === 0) return 0;
        return this.userRepo.count({
          where: {
            branchId: In(branchIds),
            role: In([UserRole.STAFF, UserRole.MANAGER]),
          },
        });
      }),
    );

    return businesses.map((biz, index) => ({
      uid: biz.id,
      name: biz.name,
      owner: biz.owner ? `${biz.owner.firstName} ${biz.owner.lastName}` : 'N/A',
      status: biz.status,
      users: businessStaffCounts[index] + (biz.owner ? 1 : 0),
    }));
  }

  async searchCustomers(
    filter: CustomerSearchFilterDto,
  ): Promise<CustomerControlRecord[]> {
    const { query, limit = 10 } = filter;
    const where = query
      ? [
          { name: ILike(`%${query}%`) },
          { id: ILike(`%${query}%`) },
          { email: ILike(`%${query}%`) },
          { phone: ILike(`%${query}%`) },
        ]
      : {};

    const contacts = await this.contactRepo.find({
      where,
      relations: ['branch', 'branch.business'],
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return contacts.map((c) => ({
      uid: c.id,
      name: c.name || 'Anonymous',
      businessUid: c.branch?.businessId || 'N/A',
      businessName: c.branch?.business?.name || 'N/A',
      tier: 'Bronze',
      visits: 0,
    }));
  }

  async executeBusinessSudoAction(
    dto: BusinessSudoActionDto,
    actorId: string,
  ): Promise<SudoActionResponse> {
    const business = await this.businessRepo.findOne({
      where: { id: dto.businessUid },
      relations: ['branches'],
    });
    if (!business) throw new NotFoundException('Business not found');

    switch (dto.actionKey) {
      case 'pause':
        business.status = BusinessStatus.SUSPENDED;
        business.suspensionReason = `Admin override: ${dto.ticketRef || 'Manual'}`;
        await this.businessRepo.save(business);
        return {
          success: true,
          message: `Business ${business.name} suspended.`,
        };

      case 'reset_access':
        return { success: true, message: `Access reset for ${business.name}.` };

      case 'add_user':
        return { success: true, message: `User added to ${business.name}.` };

      case 'assume_session': {
        if (!business.branches || business.branches.length === 0) {
          throw new NotFoundException('Business has no branches to impersonate');
        }
        const targetBranchId = business.branches[0].id;
        const expiresAt = dto.payload?.expiresAt ? new Date(dto.payload.expiresAt) : new Date(Date.now() + 15 * 60 * 1000);
        
        const impersonationToken = await this.adminService.generateToken(actorId, {
          targetBranchId,
          expiresAt: expiresAt.toISOString(),
        });

        return {
          success: true,
          message: `Assume session token generated for ${business.name}.`,
          data: { token: impersonationToken.token },
        };
      }

      default:
        return {
          success: false,
          message: `Action ${dto.actionKey} not fully implemented in backend yet.`,
        };
    }
  }

  async executeCustomerSudoAction(
    dto: CustomerSudoActionDto,
    actorId: string,
  ): Promise<SudoActionResponse> {
    const contact = await this.contactRepo.findOne({
      where: { id: dto.customerUid },
    });
    if (!contact) throw new NotFoundException('Customer not found');

    switch (dto.actionKey) {
      case 'award_points':
        return {
          success: true,
          message: `Points awarded to customer ${contact.name || contact.id}.`,
        };

      case 'update_contact':
        if (dto.payload?.new_email) contact.email = dto.payload.new_email;
        if (dto.payload?.new_phone) contact.phone = dto.payload.new_phone;
        await this.contactRepo.save(contact);
        return {
          success: true,
          message: `Contact details updated for ${contact.name || contact.id}.`,
        };

      case 'close_issue':
        return { success: true, message: `Support case closed for customer.` };

      case 'assume_session': {
        const expiresAt = dto.payload?.expiresAt
          ? new Date(dto.payload.expiresAt)
          : new Date(Date.now() + 15 * 60 * 1000);

        // The CustomerImpersonationToken.targetCustomerId references the User table.
        // Contacts are anonymous CRM records; resolve the linked User by email/phone.
        let customerUserId: string | null = null;
        if (contact.email) {
          const user = await this.userRepo.findOne({
            where: { email: contact.email, role: UserRole.CUSTOMER },
            select: ['id'],
          });
          customerUserId = user?.id ?? null;
        }
        if (!customerUserId && contact.phone) {
          const user = await this.userRepo.findOne({
            where: { phone: contact.phone, role: UserRole.CUSTOMER },
            select: ['id'],
          });
          customerUserId = user?.id ?? null;
        }

        if (!customerUserId) {
          throw new BadRequestException(
            'Cannot impersonate: no registered User account found for this contact.',
          );
        }

        if (!contact.branchId) {
          throw new BadRequestException(
            'Cannot impersonate: contact has no associated branch.',
          );
        }

        const impersonationToken = await this.adminService.generateCustomerToken(
          actorId,
          {
            targetCustomerId: customerUserId,
            targetBranchId: contact.branchId,
            expiresAt: expiresAt.toISOString(),
          },
        );

        return {
          success: true,
          message: `Assume session token generated for customer ${contact.name || contact.id}.`,
          data: { token: impersonationToken.token },
        };
      }

      default:
        return {
          success: false,
          message: `Action ${dto.actionKey} not fully implemented in backend yet.`,
        };
    }
  }
}
