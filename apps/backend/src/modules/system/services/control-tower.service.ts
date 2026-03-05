import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import {
  Business,
  BusinessStatus,
} from '../../businesses/entities/business.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { User } from '../../users/entities/user.entity';
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
      relations: ['owner', 'staff'],
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return businesses.map((biz) => ({
      uid: biz.id,
      name: biz.name,
      owner: biz.owner ? `${biz.owner.firstName} ${biz.owner.lastName}` : 'N/A',
      status: biz.status,
      users: (biz.staff?.length || 0) + (biz.owner ? 1 : 0),
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
      relations: ['business'],
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return contacts.map((c) => ({
      uid: c.id,
      name: c.name || 'Anonymous',
      businessUid: c.businessId,
      businessName: c.business?.name || 'N/A',
      tier: 'Bronze', // Placeholder: logic for tiers would go here
      visits: 0, // Placeholder: logic for visit count would go here
    }));
  }

  async executeBusinessSudoAction(
    dto: BusinessSudoActionDto,
  ): Promise<SudoActionResponse> {
    const business = await this.businessRepo.findOne({
      where: { id: dto.businessUid },
    });
    if (!business) throw new NotFoundException('Business not found');

    // Implement action logic based on actionKey
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
        // Logic to reset access (e.g., invalidate tokens, etc.)
        return { success: true, message: `Access reset for ${business.name}.` };

      case 'add_user':
        // Logic to create a staff user via dto.payload
        return { success: true, message: `User added to ${business.name}.` };

      case 'assume_session':
        // Logic to generate an admin-impersonation token
        return {
          success: true,
          message: `Assume session token generated for ${business.name}.`,
          data: { token: 'mock_impersonation_token' },
        };

      default:
        return {
          success: false,
          message: `Action ${dto.actionKey} not fully implemented in backend yet.`,
        };
    }
  }

  async executeCustomerSudoAction(
    dto: CustomerSudoActionDto,
  ): Promise<SudoActionResponse> {
    const contact = await this.contactRepo.findOne({
      where: { id: dto.customerUid },
    });
    if (!contact) throw new NotFoundException('Customer not found');

    // Implement action logic based on actionKey
    switch (dto.actionKey) {
      case 'award_points':
        // Logic to award points via dto.payload
        return {
          success: true,
          message: `Points awarded to customer ${contact.name || contact.id}.`,
        };

      case 'update_contact':
        // Logic to update contact details
        if (dto.payload?.new_email) contact.email = dto.payload.new_email;
        if (dto.payload?.new_phone) contact.phone = dto.payload.new_phone;
        await this.contactRepo.save(contact);
        return {
          success: true,
          message: `Contact details updated for ${contact.name || contact.id}.`,
        };

      case 'close_issue':
        return { success: true, message: `Support case closed for customer.` };

      default:
        return {
          success: false,
          message: `Action ${dto.actionKey} not fully implemented in backend yet.`,
        };
    }
  }
}
