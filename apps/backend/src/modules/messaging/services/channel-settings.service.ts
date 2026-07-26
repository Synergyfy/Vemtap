import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MessagingChannelSetting,
  SmsRoutingMode,
  EmailDomainStatus,
} from '../entities/messaging-channel-setting.entity';
import { UpdateChannelSettingsDto } from '../dto/update-channel-settings.dto';

@Injectable()
export class ChannelSettingsService {
  private readonly logger = new Logger(ChannelSettingsService.name);

  constructor(
    @InjectRepository(MessagingChannelSetting)
    private readonly settingsRepo: Repository<MessagingChannelSetting>,
  ) {}

  async getChannelSettings(businessId: string, branchId?: string) {
    try {
      let setting = await this.settingsRepo.findOne({
        where: branchId ? { businessId, branchId } : { businessId },
      });

      if (!setting) {
        setting = this.settingsRepo.create({
          businessId,
          branchId: branchId || null,
          smsSenderId: 'VemTap',
          smsRouting: SmsRoutingMode.AFRICA_OPTIMIZED,
          whatsappPhoneNumberId: null,
          whatsappWabaAccountId: null,
          whatsappSystemUserToken: null,
          whatsappRequireDoubleOptIn: true,
          whatsappEnableStopAutoReply: true,
          emailFromName: 'VemTap Store',
          emailFromEmail: null,
          emailCustomDomain: null,
          emailDomainStatus: EmailDomainStatus.UNVERIFIED,
          emailDnsRecords: null,
        });
        setting = await this.settingsRepo.save(setting);
      }

      return setting;
    } catch (error: any) {
      this.logger.error(`Failed to retrieve channel settings for business ${businessId}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve messaging channel settings');
    }
  }

  async updateChannelSettings(
    businessId: string,
    dto: UpdateChannelSettingsDto,
  ) {
    try {
      let setting = await this.settingsRepo.findOne({
        where: dto.branchId
          ? { businessId, branchId: dto.branchId }
          : { businessId },
      });

      if (!setting) {
        setting = this.settingsRepo.create({
          businessId,
          branchId: dto.branchId || null,
        });
      }

      if (dto.smsSenderId !== undefined) {
        setting.smsSenderId = dto.smsSenderId;
      }
      if (dto.smsRouting !== undefined) {
        setting.smsRouting = dto.smsRouting;
      }
      if (dto.whatsappPhoneNumberId !== undefined) {
        setting.whatsappPhoneNumberId = dto.whatsappPhoneNumberId;
      }
      if (dto.whatsappWabaAccountId !== undefined) {
        setting.whatsappWabaAccountId = dto.whatsappWabaAccountId;
      }
      if (dto.whatsappSystemUserToken !== undefined) {
        setting.whatsappSystemUserToken = dto.whatsappSystemUserToken;
      }
      if (dto.whatsappRequireDoubleOptIn !== undefined) {
        setting.whatsappRequireDoubleOptIn = dto.whatsappRequireDoubleOptIn;
      }
      if (dto.whatsappEnableStopAutoReply !== undefined) {
        setting.whatsappEnableStopAutoReply = dto.whatsappEnableStopAutoReply;
      }
      if (dto.emailFromName !== undefined) {
        setting.emailFromName = dto.emailFromName;
      }
      if (dto.emailFromEmail !== undefined) {
        setting.emailFromEmail = dto.emailFromEmail;
      }
      if (dto.emailCustomDomain !== undefined) {
        setting.emailCustomDomain = dto.emailCustomDomain;
      }
      if (dto.emailDomainStatus !== undefined) {
        setting.emailDomainStatus = dto.emailDomainStatus;
      }

      if (
        dto.generateDnsRecords ||
        (dto.emailCustomDomain && (!setting.emailDnsRecords || setting.emailDnsRecords.length === 0))
      ) {
        const domain = (dto.emailCustomDomain || setting.emailCustomDomain || 'vemtap.com').trim().toLowerCase();
        setting.emailDnsRecords = [
          {
            type: 'TXT',
            host: '@',
            value: 'v=spf1 include:mail.vemtap.com ~all',
            status: 'valid',
            ttl: 3600,
          },
          {
            type: 'TXT',
            host: `vemtap._domainkey.${domain}`,
            value: `k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC3${businessId.replace(/-/g, '').slice(0, 24)}...`,
            status: 'valid',
            ttl: 3600,
          },
          {
            type: 'TXT',
            host: `_dmarc.${domain}`,
            value: 'v=DMARC1; p=none; sp=none;',
            status: 'valid',
            ttl: 3600,
          },
        ];
        setting.emailDomainStatus = EmailDomainStatus.VERIFYING;
      }

      return await this.settingsRepo.save(setting);
    } catch (error: any) {
      this.logger.error(`Failed to update channel settings for business ${businessId}`, error.stack);
      throw new InternalServerErrorException('Failed to save messaging channel settings');
    }
  }
}
