import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { User, UsersStats, UserStatus } from "../../types/user";
import { usersService } from "../../services/users.service";

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchUsers = createAsyncThunk(
    "users/fetchAll",
    async (
        params: { page?: number; limit?: number; search?: string; accountStatus?: string } = {},
        { rejectWithValue },
    ) => {
        try {
            const result = await usersService.getUsers(params);
            return result; // { users, stats, pagination }
        } catch (err: any) {
            return rejectWithValue(err.message || "Failed to load users");
        }
    },
);

export const toggleUserStatus = createAsyncThunk(
    "users/toggleStatus",
    async (
        { id, currentStatus }: { id: string; currentStatus: UserStatus },
        { rejectWithValue },
    ) => {
        try {
            const newStatus: UserStatus =
                currentStatus === "active" ? "suspended" : "active";

            const result = await usersService.updateUserStatus(id, newStatus);
            return { id: result.id, newStatus: result.status };
        } catch (err: any) {
            return rejectWithValue(err.message || "Failed to update status");
        }
    },
);

// ─── State ────────────────────────────────────────────────────────────────────
interface UsersState {
    users: User[];
    stats: UsersStats | null;
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    } | null;
    loading: boolean;
    actionLoading: string | null;
    error: string | null;
    search: string;
    accountStatusFilter: string;
}

const initialState: UsersState = {
    users: [],
    stats: null,
    pagination: null,
    loading: false,
    actionLoading: null,
    error: null,
    search: "",
    accountStatusFilter: "all",
};

// ─── Slice ────────────────────────────────────────────────────────────────────
const usersSlice = createSlice({
    name: "users",
    initialState,
    reducers: {
        setSearch(state, action: PayloadAction<string>) {
            state.search = action.payload;
        },
        setAccountStatusFilter(state, action: PayloadAction<string>) {
            state.accountStatusFilter = action.payload;
        },
        clearError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // fetchUsers
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload.users;
                state.stats = action.payload.stats;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // toggleUserStatus
        builder
            .addCase(toggleUserStatus.pending, (state, action) => {
                state.actionLoading = action.meta.arg.id;
            })
            .addCase(toggleUserStatus.fulfilled, (state, action) => {
                state.actionLoading = null;
                const user = state.users.find(
                    (u) => u.id === action.payload.id,
                );
                if (user) {
                    const prev = user.status;
                    user.status = action.payload.newStatus;
                    if (state.stats) {
                        if (prev === "active") state.stats.active -= 1;
                        if (prev === "suspended") state.stats.suspended -= 1;
                        if (action.payload.newStatus === "active")
                            state.stats.active += 1;
                        if (action.payload.newStatus === "suspended")
                            state.stats.suspended += 1;
                    }
                }
            })
            .addCase(toggleUserStatus.rejected, (state, action) => {
                state.actionLoading = null;
                state.error = action.payload as string;
            });
    },
});

export const { setSearch, setAccountStatusFilter, clearError } = usersSlice.actions;
export default usersSlice.reducer;
