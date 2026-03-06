import { ApiProperty } from '@nestjs/swagger';

export class AgentStatsDto {
  @ApiProperty({ example: 5 })
  assignedChats: number;

  @ApiProperty({ example: 12 })
  openTickets: number;

  @ApiProperty({ example: 8 })
  resolvedToday: number;

  @ApiProperty({ example: '4m' })
  avgResponseTime: string;
}
