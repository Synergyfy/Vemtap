import { SetMetadata } from '@nestjs/common';

export const RequireCapability = (capability: string) => SetMetadata('capability', capability);
