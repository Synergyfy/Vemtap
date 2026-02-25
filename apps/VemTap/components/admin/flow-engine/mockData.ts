export type FlowTemplate = {
    id: string;
    templateName: string;
    description: string;
    triggerType: 'new_customer' | 'repeat_visit' | 'inactive_customer';
    version: string;
    status: 'active' | 'inactive';
    sessions: number;
    lastUpdated: string;
};

export type FlowSession = {
    sessionId: string;
    visitorId: string;
    businessId: string;
    templateName: string;
    currentNode: string;
    status: 'running' | 'completed' | 'failed' | 'terminated';
    lastUpdated: string;
};

export type FlowLog = {
    id: string;
    flowSessionId: string;
    businessId: string;
    actionType: 'message_sent' | 'reply_received' | 'loyalty_assigned' | 'api_error' | 'queue_error';
    isError: boolean;
    message: string;
    timestamp: string;
};

export type TriggerConfig = {
    key: 'new_customer' | 'repeat_visit' | 'inactive_customer';
    label: string;
    enabled: boolean;
    inactivityDays: number | null;
};

export const flowTemplates: FlowTemplate[] = [
    {
        id: 'tpl-001',
        templateName: 'Welcome & First Offer',
        description: 'Sends welcome message and first discount after NFC signup.',
        triggerType: 'new_customer',
        version: 'v4',
        status: 'active',
        sessions: 1244,
        lastUpdated: '2026-02-25 10:45',
    },
    {
        id: 'tpl-002',
        templateName: 'Repeat Visitor Upsell',
        description: 'Targets repeat visitors with loyalty nudges and bundle offer.',
        triggerType: 'repeat_visit',
        version: 'v2',
        status: 'active',
        sessions: 822,
        lastUpdated: '2026-02-24 17:11',
    },
    {
        id: 'tpl-003',
        templateName: 'Reactivation Campaign',
        description: 'Re-engagement for inactive visitors after configured inactivity period.',
        triggerType: 'inactive_customer',
        version: 'v6',
        status: 'inactive',
        sessions: 409,
        lastUpdated: '2026-02-20 13:20',
    },
];

export const sessions: FlowSession[] = [
    {
        sessionId: 'ses-991023',
        visitorId: 'vis-0018',
        businessId: 'biz-142',
        templateName: 'Welcome & First Offer',
        currentNode: 'send_welcome_message',
        status: 'running',
        lastUpdated: '2026-02-25 18:10',
    },
    {
        sessionId: 'ses-991024',
        visitorId: 'vis-0073',
        businessId: 'biz-021',
        templateName: 'Repeat Visitor Upsell',
        currentNode: 'wait_for_reply',
        status: 'running',
        lastUpdated: '2026-02-25 18:09',
    },
    {
        sessionId: 'ses-991025',
        visitorId: 'vis-0102',
        businessId: 'biz-307',
        templateName: 'Reactivation Campaign',
        currentNode: 'assign_loyalty_bonus',
        status: 'failed',
        lastUpdated: '2026-02-25 17:50',
    },
    {
        sessionId: 'ses-991026',
        visitorId: 'vis-0144',
        businessId: 'biz-211',
        templateName: 'Welcome & First Offer',
        currentNode: 'flow_end',
        status: 'completed',
        lastUpdated: '2026-02-25 17:11',
    },
];

export const flowLogs: FlowLog[] = [
    {
        id: 'log-001',
        flowSessionId: 'ses-991023',
        businessId: 'biz-142',
        actionType: 'message_sent',
        isError: false,
        message: 'WhatsApp template welcome_message sent successfully.',
        timestamp: '2026-02-25 18:10:11',
    },
    {
        id: 'log-002',
        flowSessionId: 'ses-991025',
        businessId: 'biz-307',
        actionType: 'api_error',
        isError: true,
        message: 'Termii API timeout while dispatching message.',
        timestamp: '2026-02-25 17:50:43',
    },
    {
        id: 'log-003',
        flowSessionId: 'ses-991024',
        businessId: 'biz-021',
        actionType: 'reply_received',
        isError: false,
        message: 'Visitor replied YES to promo branch.',
        timestamp: '2026-02-25 18:09:01',
    },
    {
        id: 'log-004',
        flowSessionId: 'ses-991025',
        businessId: 'biz-307',
        actionType: 'queue_error',
        isError: true,
        message: 'Retry queue exceeded max attempts for node assign_loyalty_bonus.',
        timestamp: '2026-02-25 17:52:32',
    },
    {
        id: 'log-005',
        flowSessionId: 'ses-991026',
        businessId: 'biz-211',
        actionType: 'loyalty_assigned',
        isError: false,
        message: 'Loyalty points assigned: +30.',
        timestamp: '2026-02-25 17:09:41',
    },
];

export const analyticsSnapshot = {
    totalMessagesSent: 184422,
    totalRepliesReceived: 77211,
    avgResponseRate: 41.9,
    loyaltyAssigned: 29310,
    activeSessionsCount: 218,
};

export const triggerDefaults: TriggerConfig[] = [
    { key: 'new_customer', label: 'New Customer', enabled: true, inactivityDays: null },
    { key: 'repeat_visit', label: 'Repeat Visit', enabled: true, inactivityDays: null },
    { key: 'inactive_customer', label: 'Inactive Customer', enabled: true, inactivityDays: 14 },
];

export const sampleTemplateJson = `{
  "nodes": [
    { "id": "start", "type": "trigger", "next": "send_welcome" },
    { "id": "send_welcome", "type": "message", "template": "welcome_v2", "next": "wait_reply" },
    { "id": "wait_reply", "type": "wait_for_reply", "timeout_hours": 24, "next": "branch_offer" },
    { "id": "branch_offer", "type": "condition", "when": "reply == 'YES'", "next": "assign_points" },
    { "id": "assign_points", "type": "loyalty", "points": 20, "next": "end" },
    { "id": "end", "type": "end" }
  ]
}`;
