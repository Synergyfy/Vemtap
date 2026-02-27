import { useMockDashboardStore, Visitor, Reward } from '@/lib/store/mockDashboardStore';

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const dashboardApi = {
  fetchDashboardData: async () => {
    await delay(800);
    const state = useMockDashboardStore.getState();
    const { activeBranchId } = (await import('@/store/useBusinessStore')).useBusinessStore.getState();

    const isAllBranches = activeBranchId === 'all' || !activeBranchId;

    // Filter data by branch
    const filteredVisitors = isAllBranches ? state.visitors : state.visitors.filter(v => v.branchId === activeBranchId);
    const filteredMessages = isAllBranches ? state.messages : state.messages.filter(m => m.branchId === activeBranchId);
    const filteredActivity = isAllBranches ? state.activityData : state.activityData.filter(a => a.branchId === activeBranchId);
    const filteredStaff = isAllBranches ? state.staffMembers : state.staffMembers.filter(s => s.branchId === activeBranchId);
    const filteredDevices = isAllBranches ? state.devices : state.devices.filter(d => d.branchId === activeBranchId);
    const filteredRedemptions = isAllBranches ? state.redemptionRequests : state.redemptionRequests.filter(r => r.branchId === activeBranchId);
    const filteredRewards = isAllBranches ? state.rewards : state.rewards.filter(r => !r.branchId || r.branchId === activeBranchId);

    // Aggregate stats if 'all'
    let stats = state.stats;
    if (isAllBranches) {
      stats = {
        totalVisitors: state.visitors.length,
        newVisitors: state.visitors.filter(v => v.status === 'new').length,
        repeatVisitors: state.visitors.filter(v => v.status === 'returning').length,
        todaysVisits: state.visitors.filter(v => v.time === 'Just now').length,
      };
    } else {
      // Individual branch stats
      stats = {
        totalVisitors: filteredVisitors.length,
        newVisitors: filteredVisitors.filter(v => v.status === 'new').length,
        repeatVisitors: filteredVisitors.filter(v => v.status === 'returning').length,
        todaysVisits: filteredVisitors.filter(v => v.time === 'Just now').length,
      };
    }

    return {
      stats,
      recentVisitors: filteredVisitors,
      activityData: filteredActivity,
      rewards: filteredRewards,
      notifications: state.notifications.filter(n => !n.branchId || isAllBranches || n.branchId === activeBranchId),
      messages: filteredMessages,
      staffMembers: filteredStaff,
      devices: filteredDevices,
      redemptionRequests: filteredRedemptions,
      templates: state.templates,
      businessName: '',
      businessLogo: '',
    };
  },

  addTemplate: async (template: any) => {
    await delay(500);
    useMockDashboardStore.getState().addTemplate(template);
    return template;
  },

  deleteTemplate: async (id: string) => {
    await delay(400);
    useMockDashboardStore.getState().deleteTemplate(id);
    return id;
  },

  updateTemplate: async ({ id, updates }: { id: string, updates: any }) => {
    await delay(500);
    useMockDashboardStore.getState().updateTemplate(id, updates);
    return { id, updates };
  },

  addVisitor: async (visitor: Visitor) => {
    await delay(500);
    const { activeBranchId } = (await import('@/store/useBusinessStore')).useBusinessStore.getState();
    const visitorWithBranch = { ...visitor, branchId: visitor.branchId || activeBranchId };
    useMockDashboardStore.getState().addVisitor(visitorWithBranch);
    useMockDashboardStore.getState().addNotification({
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Visitor',
      message: `${visitor.name} checked in.`,
      timestamp: Date.now(),
      read: false,
      type: 'info',
      scope: 'DASHBOARD',
      branchId: visitorWithBranch.branchId
    });
    return visitorWithBranch;
  },

  clearDashboard: async () => {
    await delay(300);
    useMockDashboardStore.getState().reset();
  },

  // Reward Actions
  createReward: async (reward: Reward) => {
    await delay(600);
    const { activeBranchId } = (await import('@/store/useBusinessStore')).useBusinessStore.getState();
    const rewardWithBranch = { ...reward, branchId: reward.branchId || activeBranchId };
    useMockDashboardStore.getState().addReward(rewardWithBranch);
    useMockDashboardStore.getState().addNotification({
      id: Math.random().toString(36).substr(2, 9),
      title: 'Reward Created',
      message: `Reward "${reward.title}" has been created.`,
      timestamp: Date.now(),
      read: false,
      type: 'success',
      scope: 'DASHBOARD',
      branchId: rewardWithBranch.branchId
    });
    return rewardWithBranch;
  },

  deleteReward: async (id: string) => {
    await delay(400);
    useMockDashboardStore.getState().deleteReward(id);
    return id;
  },


  rewardUser: async ({ userId, rewardId }: { userId: string, rewardId: string }) => {
    await delay(700);
    const state = useMockDashboardStore.getState();
    const reward = state.rewards.find(r => r.id === rewardId);
    const { activeBranchId } = (await import('@/store/useBusinessStore')).useBusinessStore.getState();

    if (reward) {
      useMockDashboardStore.getState().addNotification({
        id: Math.random().toString(36).substr(2, 9),
        title: 'Points Redeemed',
        message: `User redeemed "${reward.title}" for ${reward.points} points.`,
        timestamp: Date.now(),
        read: false,
        type: 'success',
        scope: 'DASHBOARD',
        branchId: reward.branchId || activeBranchId
      });
    }
    return { userId, rewardId };
  },

  // Notification Actions
  markNotificationRead: async (id: string) => {
    useMockDashboardStore.getState().markNotificationRead(id);
    return id;
  },

  markAllNotificationsRead: async () => {
    useMockDashboardStore.getState().markAllNotificationsRead();
    return true;
  },

  clearNotifications: async () => {
    useMockDashboardStore.getState().clearNotifications();
    return true;
  },

  // Message Actions
  createMessage: async (message: any) => {
    await delay(1000);
    const { activeBranchId } = (await import('@/store/useBusinessStore')).useBusinessStore.getState();
    const id = Math.random().toString(36).substr(2, 9);
    const newMessage = {
      ...message,
      id,
      sent: 0,
      delivered: '0%',
      clicks: 0,
      timestamp: Date.now(),
      branchId: message.branchId || activeBranchId
    };
    useMockDashboardStore.getState().addMessage(newMessage);
    useMockDashboardStore.getState().addNotification({
      id: Math.random().toString(36).substr(2, 9),
      title: 'Message Created',
      message: `Message "${message.name}" has been ${message.status === 'Active' ? 'launched' : 'scheduled'}.`,
      timestamp: Date.now(),
      read: false,
      type: 'success',
      scope: 'DASHBOARD',
      branchId: newMessage.branchId
    });
    return newMessage;
  },

  updateMessage: async ({ id, updates }: { id: string, updates: any }) => {
    await delay(600);
    useMockDashboardStore.getState().updateMessage(id, updates);
    return { id, updates };
  },

  deleteMessage: async (id: string) => {
    await delay(500);
    useMockDashboardStore.getState().deleteMessage(id);
    return id;
  },

  updateMessageStatus: async (id: string, status: any) => {
    await delay(300);
    useMockDashboardStore.getState().updateMessageStatus(id, status);
    return { id, status };
  },

  // Staff Actions
  addStaff: async (staff: any) => {
    await delay(800);
    const { activeBranchId } = (await import('@/store/useBusinessStore')).useBusinessStore.getState();
    const id = Math.random().toString(36).substr(2, 9);
    const newStaff = { ...staff, id, lastActive: 'Never', status: 'Active', branchId: staff.branchId || activeBranchId };
    useMockDashboardStore.getState().addStaff(newStaff);
    return newStaff;
  },

  updateStaffMember: async ({ id, updates }: { id: string, updates: any }) => {
    await delay(500);
    useMockDashboardStore.getState().updateStaffMember(id, updates);
    return { id, updates };
  },

  deleteStaff: async (id: string) => {
    await delay(400);
    useMockDashboardStore.getState().deleteStaff(id);
    return id;
  },

  // Device Actions
  addDevice: async (device: any) => {
    await delay(800);
    const { activeBranchId } = (await import('@/store/useBusinessStore')).useBusinessStore.getState();
    const id = device.id || Math.random().toString(36).substr(2, 9);
    const newDevice = {
      ...device,
      id,
      lastActive: 'Never',
      status: 'active',
      batteryLevel: 100,
      totalScans: 0,
      timestamp: Date.now(),
      branchId: device.branchId || activeBranchId
    };
    useMockDashboardStore.getState().addDevice(newDevice);
    return newDevice;
  },

  updateDevice: async ({ id, updates }: { id: string, updates: any }) => {
    await delay(500);
    useMockDashboardStore.getState().updateDevice(id, updates);
    return { id, updates };
  },

  deleteDevice: async (id: string) => {
    await delay(400);
    useMockDashboardStore.getState().deleteDevice(id);
    return id;
  },

  updateReward: async ({ id, updates }: { id: string, updates: any }) => {
    await delay(500);
    useMockDashboardStore.getState().updateReward(id, updates);
    return { id, updates };
  },

  approveRedemption: async (id: string) => {
    await delay(700);
    useMockDashboardStore.getState().approveRedemption(id);
    return id;
  },

  declineRedemption: async (id: string) => {
    await delay(600);
    useMockDashboardStore.getState().declineRedemption(id);
    return id;
  },

  updateVisitor: async ({ id, updates }: { id: string, updates: any }) => {
    await delay(500);
    useMockDashboardStore.getState().updateVisitor(id, updates);
    return { id, updates };
  },

  deleteVisitor: async (id: string) => {
    await delay(400);
    useMockDashboardStore.getState().deleteVisitor(id);
    return id;
  }
};
