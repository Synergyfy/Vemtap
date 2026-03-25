import { Injectable, ForbiddenException } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { Channel } from '../enums/channel.enum';

@Injectable()
export class ComplianceService {
  public validateConsentBeforeSend(user: User, channel: Channel): void {
    if (user.optOut) {
      throw new ForbiddenException(
        `User ${user.id} has opted out of all communications.`,
      );
    }

    if (user.optInChannels && !user.optInChannels.includes(channel)) {
      throw new ForbiddenException(
        `User ${user.id} has not explicitly opted in to receive messages via ${channel}.`,
      );
    }
  }

  public handleOptOut(user: User): void {
    user.optOut = true;
    user.optInChannels = [];
  }
}
