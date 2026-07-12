import type { Driver } from "../types/driver";
import type { User, UsersStats, UserStatus, AccountStatus } from "../types/user";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const getToken = () => localStorage.getItem("token");

interface BackendUser {
    id: string;
    name: string;
    initials: string;
    email: string;
    phone: string;
    status: UserStatus;
    accountStatus: AccountStatus;
    isDeleted: boolean;
    deletedAt: string | null;
    deleteReason: string | null;
    scheduledDeletionDate: string | null;
    orders: number;
    joined: string;
}

interface GetUsersResponse {
    users: User[];
    stats: UsersStats;
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

const mapUser = (u: BackendUser): User => ({
    id: u.id,
    initials: u.initials,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: "customer",
    orders: u.orders,
    joined: u.joined,
    status: u.status,
    accountStatus: u.accountStatus ?? "ACTIVE",
    isDeleted: u.isDeleted ?? false,
    deletedAt: u.deletedAt ?? null,
    deleteReason: u.deleteReason ?? null,
    scheduledDeletionDate: u.scheduledDeletionDate ?? null,
});

export const usersService = {
    getDrivers: async (params: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
    }) => {
        const query = new URLSearchParams();
        if (params.page) query.append("page", String(params.page));
        if (params.limit) query.append("limit", String(params.limit));
        if (params.search) query.append("search", params.search);
        if (params.status) query.append("status", params.status);

        const response = await fetch(`${BASE_URL}/drivers/admin/all?${query}`, {
            headers: { Authorization: `Bearer ${getToken()}` },
        });

        const data = await response.json();
        if (!response.ok)
            throw new Error(data.message || "Failed to fetch drivers");

        const drivers: Driver[] = data.data.drivers.map((d: any) => ({
            id: d._id,
            name: d.user?.fullName || "",
            email: d.user?.email || "",
            phone: d.user?.phone || "",
            status: d.user?.status || "pending",
            vehicle: d.vehicle || { type: "car", plateNumber: "" },
            rating: d.rating || 0,
            totalDeliveries: d.totalDeliveries || 0,
            joinedAt: d.user?.createdAt || "",
        }));

        return { drivers, total: data.data.total };
    },

    updateDriverStatus: async (
        id: string,
        status: "active" | "suspended" | "banned", // ✅ إصلاح: شيل "inactive" وضيف "banned"
    ) => {
        const response = await fetch(`${BASE_URL}/drivers/admin/${id}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({ status }),
        });

        const data = await response.json();
        if (!response.ok)
            throw new Error(data.message || "Failed to update status");

        const d = data.data;
        const driver: Driver = {
            id: d._id,
            name: d.user?.fullName || "",
            email: d.user?.email || "",
            phone: d.user?.phone || "",
            status: d.user?.status || status,
            vehicle: d.vehicle || { type: "car", plateNumber: "" },
            rating: d.rating || 0,
            totalDeliveries: d.totalDeliveries || 0,
            joinedAt: d.user?.createdAt || "",
        };

        return driver;
    },

    // ── Users (Customers) ──────────────────────────────────────────────────────
    getUsers: async (params: {
        page?: number;
        limit?: number;
        search?: string;
        accountStatus?: string;
    }): Promise<GetUsersResponse> => {
        const query = new URLSearchParams();
        if (params.page) query.append("page", String(params.page));
        if (params.limit) query.append("limit", String(params.limit));
        if (params.search) query.append("search", params.search);
        if (params.accountStatus) query.append("accountStatus", params.accountStatus);

        const response = await fetch(`${BASE_URL}/admin/users?${query}`, {
            headers: { Authorization: `Bearer ${getToken()}` },
        });

        const data = await response.json();
        if (!response.ok)
            throw new Error(data.message || "Failed to fetch users");

        return {
            users: data.data.users.map(mapUser),
            stats: data.data.stats,
            pagination: data.data.pagination,
        };
    },

    getUserById: async (id: string): Promise<User> => {
        const response = await fetch(`${BASE_URL}/admin/users/${id}`, {
            headers: { Authorization: `Bearer ${getToken()}` },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "User not found");

        return mapUser(data.data);
    },

    updateUserStatus: async (
        id: string,
        status: UserStatus,
    ): Promise<{ id: string; status: UserStatus }> => {
        const response = await fetch(`${BASE_URL}/admin/users/${id}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({ status }),
        });

        const data = await response.json();
        if (!response.ok)
            throw new Error(data.message || "Failed to update status");

        return { id: data.data.id, status: data.data.status };
    },
};
