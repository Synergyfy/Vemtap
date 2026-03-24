import { api } from '@/lib/api';

export const agentApi = {
    // Get all agents (can be used for assignment dropdowns)
    getAll: (params?: { page?: number; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.page) q.set('page', String(params.page));
        if (params?.limit) q.set('limit', String(params.limit));
        return api.get(`/agent/all?${q.toString()}`);
    },

    // Agent Dashboard Statistics
    getStats: () => api.get('/agent/stats'),

    // Chats assigned to the current agent
    getChats: (params?: { page?: number; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.page) q.set('page', String(params.page));
        if (params?.limit) q.set('limit', String(params.limit));
        return api.get(`/agent/chats?${q.toString()}`);
    },

    // Tickets assigned to the current agent
    getTickets: (params?: { page?: number; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.page) q.set('page', String(params.page));
        if (params?.limit) q.set('limit', String(params.limit));
        return api.get(`/agent/tickets?${q.toString()}`);
    },

    // Ticket/Chat Details
    getTicketDetails: (id: string) => api.get(`/agent/tickets/${id}`),

    // Update Ticket/Chat Status
    updateTicketStatus: (id: string, status: string) => 
        api.patch(`/agent/tickets/${id}/status`, { status }),

    // Reply to a ticket/chat
    sendReply: (id: string, message: string) => 
        api.post(`/agent/tickets/${id}/message`, { message }),

    // Update Agent Profile
    updateProfile: (data: { firstName: string; lastName: string; email: string; phone: string }) => 
        api.patch('/agent/profile', data),
};
