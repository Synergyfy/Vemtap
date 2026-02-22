import { Injectable, ForbiddenException } from '@nestjs/common';
import { Contact } from '../../contacts/entities/contact.entity';
import { Channel } from '../enums/channel.enum';

@Injectable()
export class ComplianceService {
  public validateConsentBeforeSend(contact: Contact, channel: Channel): void {
    if (contact.optOut) {
      throw new ForbiddenException(
        `Contact ${contact.id} has opted out of all communications.`,
      );
    }

    if (!contact.optInChannels?.includes(channel)) {
      throw new ForbiddenException(
        `Contact ${contact.id} has not explicitly opted in to receive messages via ${channel}.`,
      );
    }
  }

  public handleOptOut(contact: Contact): void {
    contact.optOut = true;
    contact.optInChannels = [];
  }
}
