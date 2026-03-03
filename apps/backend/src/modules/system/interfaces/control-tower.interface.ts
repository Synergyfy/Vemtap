import { ApiProperty } from '@nestjs/swagger';
import { BusinessStatus } from '../../businesses/entities/business.entity';

export class BusinessControlRecord {
  @ApiProperty()
  uid: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  owner: string;

  @ApiProperty({ enum: BusinessStatus })
  status: BusinessStatus;

  @ApiProperty()
  users: number;
}

export class CustomerControlRecord {
  @ApiProperty()
  uid: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  businessUid: string;

  @ApiProperty()
  businessName: string;

  @ApiProperty()
  tier: string;

  @ApiProperty()
  visits: number;
}

export class SudoActionResponse {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  data?: any;
}
