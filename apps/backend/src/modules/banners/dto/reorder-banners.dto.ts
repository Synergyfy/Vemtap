import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderBannersDto {
  @ApiProperty({
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
    description: 'Banner IDs in desired order',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  orderedIds: string[];
}
