'use client';

import UserManagementPage from '@/components/admin/users/UserManagementPage';

export default function AdminBusinessUsersPage() {
    return (
        <UserManagementPage
            title="Business Users"
            description="Manage business owners and managers"
            roleFilter={["Owner", "Manager"]}
            hideRoleFilter
        />
    );
}
