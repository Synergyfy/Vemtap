import { SetMetadata } from '@nestjs/common';

export const IS_ALLOW_PENDING_KEY = 'isAllowPending';
export const AllowPending = () => SetMetadata(IS_ALLOW_PENDING_KEY, true);
