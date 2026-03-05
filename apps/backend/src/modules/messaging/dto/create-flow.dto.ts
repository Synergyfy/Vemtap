import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsUUID,
  ValidateNested,
  IsDefined,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FlowTriggerType, FlowStatus } from '../entities/flow.entity';
import { FlowStructure } from '../interfaces/flow-engine.interface';

export class CreateFlowDto {
  @ApiProperty({ example: 'Welcome Flow', description: 'The name of the flow' })
  @IsString()
  name: string;

  @ApiProperty({
    enum: FlowTriggerType,
    example: FlowTriggerType.NEW_VISITOR,
    description: 'The trigger type that starts the flow',
  })
  @IsEnum(FlowTriggerType)
  triggerType: FlowTriggerType;

  @ApiProperty({
    example: 'uuid-branch-id',
    description:
      'The branch ID. Optional for all roles. For non-admins, defaults to use the branch of the current user if they are tied to one.',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiProperty({
    example: 'uuid-business-id',
    description:
      'The business ID. Required for Admin but automatically determined from token for Owner, Manager, and Staff.',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  businessId?: string;

  @ApiProperty({
    example: { nodes: [], edges: [] },
    description: 'The visual structure of the flow (nodes and edges)',
    required: true,
  })
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => FlowStructure)
  structure: FlowStructure;
}

export class UpdateFlowStatusDto {
  @ApiProperty({
    enum: FlowStatus,
    example: FlowStatus.ACTIVE,
    description: 'The new status for the flow',
  })
  @IsEnum(FlowStatus)
  status: FlowStatus;
}

export class GetFlowsDto {
  @ApiProperty({
    example: 'uuid-branch-id',
    description: 'Filter by branch ID',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiProperty({
    example: 'uuid-business-id',
    description: 'Filter by business ID (Admin only)',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  businessId?: string;
}
