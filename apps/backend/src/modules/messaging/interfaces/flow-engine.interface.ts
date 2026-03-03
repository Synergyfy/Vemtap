import { ApiProperty } from '@nestjs/swagger';

export class FlowNode {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty({ required: false })
  label?: string;

  @ApiProperty({ required: false })
  config?: Record<string, any>;

  @ApiProperty({ required: false })
  position?: { x: number; y: number };
}

export class FlowEdge {
  @ApiProperty()
  id: string;

  @ApiProperty()
  source: string;

  @ApiProperty()
  target: string;

  @ApiProperty({ required: false })
  label?: string;
}

export class FlowStructure {
  @ApiProperty({ type: [FlowNode] })
  nodes: FlowNode[];

  @ApiProperty({ type: [FlowEdge] })
  edges: FlowEdge[];
}

export class FlowAnalyticsResponse {
  @ApiProperty()
  totalMessagesSent: number;

  @ApiProperty()
  totalRepliesReceived: number;

  @ApiProperty()
  avgResponseRate: number;

  @ApiProperty()
  loyaltyAssigned: number;

  @ApiProperty()
  activeSessionsCount: number;
}
