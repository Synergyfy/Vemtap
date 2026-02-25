'use client';

import UserManagementPage from '@/components/admin/users/UserManagementPage';

export default function AdminCustomerUsersPage() {
    return (
        <UserManagementPage
            title="Customers"
            description="Manage all customer accounts"
            roleFilter="Customer"
            hideRoleFilter
        />
    );
}
