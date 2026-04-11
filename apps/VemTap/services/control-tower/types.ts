export type PermissionLevel = 'VIEW_ONLY' | 'VIEW_EDIT' | 'VIEW_REPLY';
export type SessionStatus = 'pending' | 'active' | 'ended' | 'expired';
export type TargetType = 'business' | 'customer';

export interface BusinessControlRecord {
    uid: string;
    name: string;
    owner: string;
    status: string;
    users: number;
}

export interface CustomerControlRecord {
    uid: string;
    name: string;
    businessUid: string;
    businessName: string;
    tier: string;
    visits: number;
}

export interface ControlTowerSession {
    id: string;
    agentId: string;
    agentName: string;
    businessId?: string;
    customerId?: string;
    targetType: TargetType;
    targetName: string;
    permissionLevel: PermissionLevel;
    startTime: string;
    endTime: string;
    expiresAt: number;
    status: SessionStatus;
}

export interface ControlTowerLog {
    id: string;
    sessionId: string;
    agentId: string;
    targetType: TargetType;
    targetId: string;
    action: string;
    metadata: Record<string, any>;
    timestamp: string;
}

export interface AccessRequest {
    id: string;
    requestedBy: string;
    requestedByName: string;
    targetType: TargetType;
    targetId: string;
    targetName: string;
    duration: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    timestamp: string;
}

export interface SudoActionResponse {
    success: boolean;
    message: string;
    data?: any;
}

export interface BusinessSudoActionDto {
    businessUid: string;
    ticketRef?: string;
    actionKey: string;
    payload?: Record<string, any>;
}

export interface CustomerSudoActionDto {
    customerUid: string;
    businessUid: string;
    ticketRef?: string;
    actionKey: string;
    payload?: Record<string, any>;
}

export interface ControlTowerSearchFilter {
    query?: string;
    limit?: number;
}
