import { api } from '@/lib/api';

export type Visitor = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  time?: string;
  timestamp?: number;
  status: string;
  optIn?: boolean;
  surveyAnswers?: Record<string, any>;
  branchId?: string;
  location?: string;
};

export type DashboardResponse = {
  stats: {
    totalVisitors: number;
    newVisitors: number;
    repeatVisitors: number;
    todaysVisits: number;
  };
  recentVisitors: any[];
  activityData: { hour: string; visits: number; branchId?: string }[];
  rewards: any[];
  notifications: any[];
  messages: any[];
  staffMembers: any[];
  devices: any[];
  businessName: string;
  businessLogo: string;
};

export const dashboardApi = {
  fetchDashboardData: async (branchId?: string) => {
    return api.get('/business-dashboard', { params: { branchId } }) as Promise<DashboardResponse>;
  },

  markNotificationRead: async (id: string) => {
    return api.patch(`/notifications/${id}/read`, undefined);
  },

  markAllNotificationsRead: async () => {
    return api.post('/notifications/read-all', undefined);
  },
};
