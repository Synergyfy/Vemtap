import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsUUID,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export enum StaffPermission {
  DASHBOARD = 'dashboard',
  INVENTORY = 'inventory',
  POS = 'pos',
  VISITORS = 'visitors',
  MESSAGES = 'messages',
  ENGAGEMENT = 'engagement',
  CUSTOMER_EXPERIENCE = 'customer-experience',
  MARKETING = 'marketing',
  DISCOVERY = 'discovery',
  ANALYTICS = 'analytics',
  STAFF = 'staff',
  SETTINGS = 'settings',
  QRTHRIVE = 'qrthrive',
  // Sales (pos) sub-permissions
  POS_SALES_DASHBOARD = 'pos:sales-dashboard',
  POS_HOME = 'pos:pos-home',
  POS_ORDERS = 'pos:orders',
  POS_SETTINGS = 'pos:settings',
  POS_HELP = 'pos:help',
  // Inventory sub-permissions
  INVENTORY_OVERVIEW = 'inventory:overview',
  INVENTORY_CATALOGUE = 'inventory:catalogue',
  INVENTORY_INVENTORY = 'inventory:inventory',
  // Visitors (customers) sub-permissions
  VISITORS_OVERVIEW = 'visitors:overview',
  VISITORS_CUSTOMER_LIST = 'visitors:customer-list',
  VISITORS_LOYALTY = 'visitors:loyalty',
  VISITORS_VISITORS = 'visitors:visitors',
  // Discovery sub-permissions
  DISCOVERY_GET_CUSTOMERS = 'discovery:get-customers',
  DISCOVERY_BUSINESS_PARTNERSHIP = 'discovery:business-partnership',
  // Analytics sub-permissions
  ANALYTICS_OVERVIEW = 'analytics:overview',
  ANALYTICS_AI_REPORTS = 'analytics:ai-reports',
  ANALYTICS_SALES_REPORTS = 'analytics:sales-reports',
  ANALYTICS_INVENTORY_REPORTS = 'analytics:inventory-reports',
  ANALYTICS_CUSTOMERS = 'analytics:customers',
  ANALYTICS_DISCOVERY = 'analytics:discovery',
  ANALYTICS_FOOTFALL = 'analytics:footfall',
  ANALYTICS_MARKETING = 'analytics:marketing',
  ANALYTICS_PEAK_TIMES = 'analytics:peak-times',
  // Settings sub-permissions
  SETTINGS_PROFILE = 'settings:profile',
  SETTINGS_SUBSCRIPTION = 'settings:subscription',
  SETTINGS_SUPPORT = 'settings:support',
  SETTINGS_COMPLIANCE = 'settings:compliance',
}

export class InviteStaffDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'staff@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+2348012345678', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'Cashier' })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({ example: 'Sales Associate', required: false })
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @ApiProperty({
    enum: StaffPermission,
    isArray: true,
    example: [StaffPermission.DASHBOARD, StaffPermission.VISITORS],
    required: false,
  })
  @IsArray()
  @IsEnum(StaffPermission, { each: true })
  @IsOptional()
  permissions?: StaffPermission[];

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  branchId?: string;
}
