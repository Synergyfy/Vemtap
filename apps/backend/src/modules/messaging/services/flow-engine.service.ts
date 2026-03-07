import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flow, FlowStatus, FlowTriggerType } from '../entities/flow.entity';
import {
  FlowExecution,
  ExecutionStatus,
} from '../entities/flow-execution.entity';
import { MessagingEngineService } from './messaging-engine.service';
import { Contact } from '../../contacts/entities/contact.entity';
import { SendMessageDto } from '../dto/send-message.dto';
import { Channel } from '../enums/channel.enum';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  FlowStructure,
  FlowNode,
  FlowEdge,
  FlowTriggerContext,
} from '../interfaces/flow-engine.interface';

@Injectable()
export class FlowEngineService {
  private readonly logger = new Logger(FlowEngineService.name);

  constructor(
    @InjectRepository(Flow)
    private readonly flowRepo: Repository<Flow>,
    @InjectRepository(FlowExecution)
    private readonly executionRepo: Repository<FlowExecution>,
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    private readonly messagingEngine: MessagingEngineService,
    @InjectQueue('messaging-flow-delay') private readonly delayQueue: Queue,
  ) {}

  async triggerFlow(
    triggerType: FlowTriggerType,
    branchId: string,
    context: FlowTriggerContext,
  ): Promise<void> {
    this.logger.log(`Triggering flow: ${triggerType} for branch ${branchId}`);

    // 1. Find active flows for this trigger
    const flows = await this.flowRepo.find({
      where: {
        branchId,
        triggerType,
        status: FlowStatus.ACTIVE,
      },
    });

    if (!flows.length) return;

    // 2. Resolve Contact
    let contact: Contact | null = null;
    if (context.contactId) {
      contact = await this.contactRepo.findOne({
        where: { id: context.contactId },
      });
    }

    if (!contact) {
      this.logger.warn(
        `No contact found for flow trigger context: ${JSON.stringify(context)}`,
      );
      return;
    }

    // 3. Start Execution for each flow
    for (const flow of flows) {
      const existing = await this.executionRepo.findOne({
        where: {
          flowId: flow.id,
          contactId: contact.id,
          status: ExecutionStatus.RUNNING,
        },
      });
      if (existing) {
        this.logger.log(
          `Skipping duplicate enrollment for contact ${contact.id} in flow ${flow.id}`,
        );
        continue;
      }

      const execution = this.executionRepo.create({
        flowId: flow.id,
        contactId: contact.id,
        businessId: flow.businessId,
        branchId: flow.branchId,
        status: ExecutionStatus.RUNNING,
        state: { ...context },
        currentNodeId: this.getStartNodeId(flow.structure),
      });
      await this.executionRepo.save(execution);

      // Run the first node
      await this.executeNode(execution.id, execution.currentNodeId);
    }
  }

  async executeNode(executionId: string, nodeId: string): Promise<void> {
    const execution = await this.executionRepo.findOne({
      where: { id: executionId },
      relations: ['flow', 'contact'],
    });
    if (!execution || !execution.flow) return;

    const node = execution.flow.structure.nodes.find(
      (n: FlowNode) => n.id === nodeId,
    );
    if (!node) {
      await this.completeExecution(execution);
      return;
    }

    this.logger.log(
      `Executing node ${node.id} (${node.type}) for execution ${execution.id}`,
    );

    try {
      switch (node.type) {
        case 'send_message':
          await this.handleSendMessage(execution, node);
          break;
        case 'delay':
          await this.handleDelay(execution, node);
          return;
        case 'condition':
          await this.handleCondition(execution, node);
          return;
        default:
          this.logger.warn(`Unknown node type ${node.type}`);
          await this.moveToNextNode(execution, node.id);
          break;
      }
    } catch (error) {
      this.logger.error(`Error executing node ${node.id}: ${error.message}`);
      execution.status = ExecutionStatus.FAILED;
      await this.executionRepo.save(execution);
    }
  }

  // --- Handlers ---

  private async handleSendMessage(execution: FlowExecution, node: FlowNode) {
    const content = node.data?.message || '';

    const dto: SendMessageDto = {
      businessId: execution.businessId,
      branchId: execution.branchId,
      channel: Channel.WHATSAPP,
      content,
      contactIds: [execution.contactId],
    };

    const result = await this.messagingEngine.sendMessage(dto);
    execution.lastMessageId = result.messageIds?.[0] || '';
    await this.executionRepo.save(execution);

    await this.moveToNextNode(execution, node.id);
  }

  private async handleDelay(execution: FlowExecution, node: FlowNode) {
    const time = node.data?.time || 0;
    const unit = node.data?.unit || 'minutes';

    let delayMs = 0;
    if (unit === 'minutes') delayMs = time * 60 * 1000;
    if (unit === 'hours') delayMs = time * 60 * 60 * 1000;
    if (unit === 'days') delayMs = time * 24 * 60 * 60 * 1000;

    execution.status = ExecutionStatus.WAITING;
    execution.nextRunAt = new Date(Date.now() + delayMs);
    await this.executionRepo.save(execution);

    await this.delayQueue.add(
      'process-delay',
      {
        executionId: execution.id,
        nodeId: node.id,
      },
      {
        delay: delayMs,
      },
    );
  }

  private async handleCondition(execution: FlowExecution, node: FlowNode) {
    const conditionType = node.data?.conditionType;

    if (conditionType === 'if_replied') {
      execution.status = ExecutionStatus.WAITING;
      execution.currentNodeId = node.id;
      await this.executionRepo.save(execution);
      return;
    }

    const result = true;
    const edgeLabel = result ? 'yes' : 'no';
    await this.moveToNextNode(execution, node.id, edgeLabel);
  }

  // --- Helpers ---

  async resumeExecution(executionId: string) {
    const execution = await this.executionRepo.findOne({
      where: { id: executionId },
      relations: ['flow'],
    });
    if (!execution) return;

    if (execution.status === ExecutionStatus.WAITING) {
      execution.status = ExecutionStatus.RUNNING;
      await this.executionRepo.save(execution);
      await this.moveToNextNode(execution, execution.currentNodeId);
    }
  }

  private getStartNodeId(structure: FlowStructure): string {
    return structure.nodes?.[0]?.id;
  }

  private async moveToNextNode(
    execution: FlowExecution,
    currentNodeId: string,
    edgeLabel?: string,
  ) {
    const edges = execution.flow.structure.edges.filter(
      (e: FlowEdge) => e.source === currentNodeId,
    );
    let nextEdge: FlowEdge | undefined;

    if (edgeLabel) {
      nextEdge = edges.find(
        (e: FlowEdge) => e.label === edgeLabel || e.handle === edgeLabel,
      );
    } else {
      nextEdge = edges[0];
    }

    if (nextEdge) {
      execution.currentNodeId = nextEdge.target;
      await this.executionRepo.save(execution);
      await this.executeNode(execution.id, execution.currentNodeId);
    } else {
      await this.completeExecution(execution);
    }
  }

  private async completeExecution(execution: FlowExecution) {
    execution.status = ExecutionStatus.COMPLETED;
    execution.completedAt = new Date();
    await this.executionRepo.save(execution);
  }
}
