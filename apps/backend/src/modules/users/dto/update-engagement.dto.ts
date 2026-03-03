import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsNotEmpty } from 'class-validator';

export class UpdateEngagementDto {
  @ApiProperty({
    example: {
      instagram: { profile: 'johndoe', link: 'https://instagr.am/johndoe' },
      facebook: { page: 'John Doe Page', link: 'https://fb.com/johndoe' },
    },
    description: 'Key-value pairs for social media engagement details',
  })
  @IsObject()
  @IsNotEmpty()
  engagement: Record<string, any>;
}
