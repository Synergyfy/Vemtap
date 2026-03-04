export class FlowNode {
  id: string;
  type: string;
  data: Record<string, any>;
  position: { x: number; y: number };
}

export class FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  handle?: string;
}

export class FlowStructure {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export class FlowTriggerContext {
  contactId: string;
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
