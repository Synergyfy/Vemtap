export type UserRole = 'Owner' | 'Manager' | 'Staff' | 'Customer' | 'Admin';

export interface StaffMember {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    businessId: string;
    branchId?: string;
    permissions: string[];
    status: 'Active' | 'Inactive' | 'Invited' | 'Pending' | 'Suspended';
    createdAt: string;
    updatedAt: string;
}

export interface InviteStaffRequest {
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    branchId: string;
    jobTitle?: string;
    permissions?: string[];
}

export interface UpdateStaffRequest {
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    branchId?: string;
    permissions?: string[];
    status?: 'Active' | 'Inactive' | 'Suspended';
}

export interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    lastLogin: string;
    joined: string;
}

export interface AdminUsersResponse {
    items: AdminUser[];
    total: number;
    stats: {
        owners: number;
        customers: number;
        staff: number;
    };
}
