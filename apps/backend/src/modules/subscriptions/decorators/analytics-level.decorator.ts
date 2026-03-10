import { SetMetadata } from '@nestjs/common';

export const RequireAnalyticsLevel = (level: 'basic' | 'advanced') =>
  SetMetadata('analyticsLevel', level);
