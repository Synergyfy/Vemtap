import {
  IsString,
  IsArray,
  IsObject,
  IsOptional,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FlowPosition {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;
}

export class FlowNode {
  @IsString()
  id: string;

  @IsString()
  type: string;

  @IsObject()
  data: Record<string, any>;

  @ValidateNested()
  @Type(() => FlowPosition)
  position: FlowPosition;
}

export class FlowEdge {
  @IsString()
  id: string;

  @IsString()
  source: string;

  @IsString()
  target: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  handle?: string;
}

export class FlowStructure {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlowNode)
  nodes: FlowNode[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlowEdge)
  edges: FlowEdge[];
}

export class FlowTriggerContext {
  customerId: string;
  businessId: string;
  branchId?: string;
  [key: string]: any;
}

export class FlowAnalyticsResponse {
  totalMessagesSent: number;
  totalRepliesReceived: number;
  avgResponseRate: number;
  loyaltyAssigned: number;
  activeSessionsCount: number;
}
