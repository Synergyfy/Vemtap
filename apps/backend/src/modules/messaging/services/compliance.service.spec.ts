import { Test, TestingModule } from '@nestjs/testing';
import { ComplianceService } from './compliance.service';
import { Contact } from '../../contacts/entities/contact.entity';
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
        it('should throw ForbiddenException if contact is opted out entirely', () => {
            const contact = { optOut: true, optInChannels: [Channel.SMS] } as Contact;
            expect(() => service.validateConsentBeforeSend(contact, Channel.SMS)).toThrow(ForbiddenException);
        });

        it('should throw ForbiddenException if contact has not opted into the channel', () => {
            const contact = { optOut: false, optInChannels: [Channel.EMAIL] } as Contact;
            expect(() => service.validateConsentBeforeSend(contact, Channel.SMS)).toThrow(ForbiddenException);
        });

        it('should pass normally if contact is opted in for the channel', () => {
            const contact = { optOut: false, optInChannels: [Channel.SMS, Channel.EMAIL] } as Contact;
            expect(() => service.validateConsentBeforeSend(contact, Channel.SMS)).not.toThrow();
        });
    });

    describe('handleOptOut', () => {
        it('should update contact optOut status and clear channels', () => {
            const contact = { optOut: false, optInChannels: [Channel.SMS, Channel.EMAIL] } as Contact;
            service.handleOptOut(contact);

            expect(contact.optOut).toBe(true);
            expect(contact.optInChannels).toEqual([]);
        });
    });
});
