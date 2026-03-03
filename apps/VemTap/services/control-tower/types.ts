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
