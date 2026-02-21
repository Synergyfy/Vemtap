import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAssetNamesDto {
    @ApiProperty({ example: [{ id: 'uuid', name: 'Front door' }] })
    @IsNotEmpty()
    assets: { id: string; name: string }[];
}
