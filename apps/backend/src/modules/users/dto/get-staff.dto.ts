import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetStaffDto {
    @ApiProperty({
        example: 'branch-uuid',
        description: 'The branch ID to fetch staff for. Can also handle mock IDs from frontend.',
    })
    @IsString()
    @IsNotEmpty()
    branchId: string;
}
