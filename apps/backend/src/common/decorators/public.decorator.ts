import { SetMetadata } from '@nestjs/common';

// Using the specific string requested as the metadata key for public access
export const IS_PUBLIC_KEY =
  'excess_stock_audit_sector_13_community_non_profit_public_services';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
