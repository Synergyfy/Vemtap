import { Test, TestingModule } from '@nestjs/testing';
import { ComplianceService } from './compliance.service';
import { User } from '../../users/entities/user.entity';
import { Channel } from '../enums/channel.enum';
import { ForbiddenException } from '@nestjs/common';

describe('ComplianceService', () => {
  let service: ComplianceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ComplianceService],
    }).compile();

    service = module.get<ComplianceService>(ComplianceService);
  });

  describe('validateConsentBeforeSend', () => {
    it('should throw ForbiddenException if user is opted out entirely', () => {
      const user = { optOut: true, optInChannels: [Channel.SMS] } as User;
      expect(() =>
        service.validateConsentBeforeSend(user, Channel.SMS),
      ).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user has not opted into the channel', () => {
      const user = {
        optOut: false,
        optInChannels: [Channel.EMAIL],
      } as User;
      expect(() =>
        service.validateConsentBeforeSend(user, Channel.SMS),
      ).toThrow(ForbiddenException);
    });

    it('should pass normally if user is opted in for the channel', () => {
      const user = {
        optOut: false,
        optInChannels: [Channel.SMS],
      } as User;
      expect(() =>
        service.validateConsentBeforeSend(user, Channel.SMS),
      ).not.toThrow();
    });
  });

  describe('handleOptOut', () => {
    it('should update user optOut status and clear channels', () => {
      const user = {
        optOut: false,
        optInChannels: [Channel.SMS],
      } as User;
      service.handleOptOut(user);

      expect(user.optOut).toBe(true);
      expect(user.optInChannels).toEqual([]);
    });
  });
});
