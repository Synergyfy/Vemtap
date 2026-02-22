export type UserRole = 'owner' | 'manager' | 'staff' | 'customer' | 'admin';

export interface StaffMember {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    businessId: string;
    branchId?: string;
    permissions: string[];
    status: 'active' | 'inactive' | 'pending';
    createdAt: string;
    updatedAt: string;
}

export interface InviteStaffRequest {
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    businessId: string;
    branchId: string;
    permissions?: string[];
}

export interface UpdateStaffRequest {
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    branchId?: string;
    permissions?: string[];
    status?: 'active' | 'inactive';
}
