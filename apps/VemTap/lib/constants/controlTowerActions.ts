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
