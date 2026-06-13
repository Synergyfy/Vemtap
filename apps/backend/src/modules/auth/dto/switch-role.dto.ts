import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';
import { Transform } from 'class-transformer';

export class SwitchRoleDto {
  @ApiProperty({ enum: UserRole, example: UserRole.CUSTOMER })
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const normalized =
      value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    return normalized as UserRole;
  })
  @IsEnum(UserRole)
  role: UserRole;
}
