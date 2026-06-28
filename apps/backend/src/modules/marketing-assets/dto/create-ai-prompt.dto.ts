import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateAIPromptDto {
  @ApiProperty({ example: 'Review Call to Action' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Review Request' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    example:
      'Write a catchy one-line call to action for a {businessType} business asking customers to leave a Google Review.',
  })
  @IsString()
  @IsNotEmpty()
  promptTemplate: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
