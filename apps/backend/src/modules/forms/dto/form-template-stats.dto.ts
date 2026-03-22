import { ApiProperty } from '@nestjs/swagger';

export class FormTemplateStatsDto {
  @ApiProperty({ example: 'uuid-template-1' })
  templateId: string;

  @ApiProperty({ example: 'Feedback Template' })
  templateName: string;

  @ApiProperty({ example: 5, description: 'Number of forms created from this template' })
  usageCount: number;

  @ApiProperty({ example: 120, description: 'Total number of responses received across all forms using this template' })
  totalResponses: number;

  @ApiProperty({ example: 3, description: 'Number of unique branches using this template' })
  uniqueBranchesCount: number;

  @ApiProperty({ example: 2, description: 'Number of unique businesses using this template' })
  uniqueBusinessesCount: number;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        formId: { type: 'string' },
        branchName: { type: 'string' },
        businessName: { type: 'string' },
        responseCount: { type: 'number' },
      },
    },
    required: false,
  })
  usage?: {
    formId: string;
    branchName: string;
    businessName: string;
    responseCount: number;
  }[];
}
