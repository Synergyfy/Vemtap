export type BusinessControlRecord = {
    uid: string;
    name: string;
    owner: string;
    status: 'Active' | 'Pending' | 'Suspended';
    users: number;
};

export type CustomerControlRecord = {
    uid: string;
    name: string;
    businessUid: string;
    businessName: string;
    tier: 'Bronze' | 'Silver' | 'Gold' | 'VIP';
    visits: number;
};

export type TaskLink = {
    label: string;
    href: string;
    description: string;
};

export type SudoAction = {
    key: string;
    label: string;
    description: string;
};

export const businessControlRecords: BusinessControlRecord[] = [
    { uid: 'biz_102', name: 'Skyline Bistro', owner: 'Amara Cole', status: 'Active', users: 42 },
    { uid: 'biz_245', name: 'Northline Fitness', owner: 'David Ross', status: 'Active', users: 17 },
    { uid: 'biz_307', name: 'Kora Events', owner: 'Ifeoma Obi', status: 'Suspended', users: 8 },
    { uid: 'biz_412', name: 'Tapi Retail', owner: 'Ken Hsu', status: 'Pending', users: 26 },
];

export const customerControlRecords: CustomerControlRecord[] = [
    { uid: 'cus_8801', name: 'Liam Foster', businessUid: 'biz_102', businessName: 'Skyline Bistro', tier: 'Silver', visits: 9 },
    { uid: 'cus_8802', name: 'Nora Kim', businessUid: 'biz_412', businessName: 'Tapi Retail', tier: 'Bronze', visits: 1 },
    { uid: 'cus_8803', name: 'Jamal Wade', businessUid: 'biz_245', businessName: 'Northline Fitness', tier: 'Gold', visits: 5 },
    { uid: 'cus_8804', name: 'Maya Stone', businessUid: 'biz_307', businessName: 'Kora Events', tier: 'VIP', visits: 15 },
];

export function getBusinessTaskLinks(businessUid: string): TaskLink[] {
    const q = `?admin_mode=1&business_uid=${encodeURIComponent(businessUid)}`;
    return [
        { label: 'Open Business Dashboard', href: `/dashboard${q}`, description: 'Review business overview and live KPIs.' },
        { label: 'Open Visitors', href: `/dashboard/visitors/all${q}`, description: 'Inspect visitor logs and recent check-ins.' },
        { label: 'Open Messaging', href: `/dashboard/messaging${q}`, description: 'Manage outbound campaigns and templates.' },
        { label: 'Open Devices', href: `/dashboard/settings/devices${q}`, description: 'Inspect terminals and registration status.' },
        { label: 'Open Loyalty', href: `/dashboard/loyalty${q}`, description: 'Check loyalty settings and reward behavior.' },
    ];
}

export function getCustomerTaskLinks(customerUid: string, businessUid: string): TaskLink[] {
    const q = `?admin_mode=1&customer_uid=${encodeURIComponent(customerUid)}&business_uid=${encodeURIComponent(businessUid)}`;
    return [
        { label: 'Open Customer Dashboard', href: `/customer/dashboard${q}`, description: 'Review customer points and current status.' },
        { label: 'Open Customer History', href: `/customer/history${q}`, description: 'Audit recent transactions and visits.' },
        { label: 'Open Customer Rewards', href: `/customer/rewards${q}`, description: 'Validate redeemable rewards and tiers.' },
        { label: 'Open Customer Settings', href: `/customer/settings${q}`, description: 'Review profile and notification settings.' },
        { label: 'Open Customer Support', href: `/customer/support${q}`, description: 'Follow up on customer support requests.' },
    ];
}

export function getBusinessSudoActions(): SudoAction[] {
    return [
        { key: 'add_user', label: 'Add New User', description: 'Create a new staff user for the business account.' },
        { key: 'send_message', label: 'Send Message', description: 'Send a campaign or support message on behalf of business.' },
        { key: 'add_device', label: 'Register Device', description: 'Attach a new terminal/device to the business profile.' },
        { key: 'adjust_loyalty', label: 'Adjust Loyalty Rule', description: 'Update reward points or loyalty settings.' },
        { key: 'resolve_ticket', label: 'Resolve Complaint', description: 'Apply a support fix directly for reported issue.' },
    ];
}

export function getCustomerSudoActions(): SudoAction[] {
    return [
        { key: 'add_profile', label: 'Create Customer Profile', description: 'Create a missing customer profile record.' },
        { key: 'award_points', label: 'Award Points', description: 'Credit points to the customer account manually.' },
        { key: 'redeem_fix', label: 'Fix Redemption', description: 'Resolve failed reward redemption for customer.' },
        { key: 'update_contact', label: 'Update Contact', description: 'Fix customer phone/email under verified support flow.' },
        { key: 'close_issue', label: 'Close Support Case', description: 'Mark issue as solved after applying corrective action.' },
    ];
}
