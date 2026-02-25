'use client';

import UserManagementPage from '@/components/admin/users/UserManagementPage';

export default function AdminAgentUsersPage() {
    return (
        <UserManagementPage
            title="Agents"
            description="Manage support agents and internal staff"
            roleFilter={["Staff", "Manager"]}
            hideRoleFilter
        />
    );
}
