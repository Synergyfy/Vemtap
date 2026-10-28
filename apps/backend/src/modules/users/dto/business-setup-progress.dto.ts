import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class SaveBusinessSetupProgressDto {
  @ApiProperty({
    example: {
      step: 'branding',
      resumeStep: 'branding',
      completedSteps: ['intro', 'basic'],
      verificationState: 'not-started',
      data: { draft: { name: 'Urban Grill' } },
    },
    description: 'The setup run as the web app saves it (shape owned by the client).',
  })
  @IsObject()
  progress: Record<string, unknown>;
}
