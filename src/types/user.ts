export type UserRole = "customer" | "driver";
export type UserStatus = "active" | "suspended";
export type AccountStatus = "ACTIVE" | "PENDING_DELETION" | "DELETED" | "SUSPENDED";

export interface User {
    id: string;
    initials: string;
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    orders: number;
    joined: string;
    status: UserStatus;
    accountStatus: AccountStatus;
    isDeleted: boolean;
    deletedAt: string | null;
    deleteReason: string | null;
    scheduledDeletionDate: string | null;
}

export interface UsersStats {
    total: number;
    active: number;
    suspended: number;
    deleted: number;
    pendingDeletion: number;
    weekTrend: number;
    newSuspendedThisWeek: number;
}

export interface AddUserPayload {
    name: string;
    email: string;
    phone: string;
    role: UserRole;
}
