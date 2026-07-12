import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../store";
import { fetchUsers, toggleUserStatus, setAccountStatusFilter } from "../../store/slices/usersSlice";
import type { User } from "../../types/user";
import { StatCard } from "../../components/shared/StatCard";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Spinner } from "../../components/ui/Spinner";
import {
    Eye, Ban, RefreshCw, X, Search,
    UserCheck, UserX, AlertCircle, Trash2, Clock,
} from "lucide-react";

// ─── Status badge map ──────────────────────────────────────────────────────────
const statusBadgeVariant = (user: User): React.ComponentProps<typeof Badge>["variant"] => {
    if (user.isDeleted) return "red";
    if (user.accountStatus === "PENDING_DELETION") return "amber";
    if (user.accountStatus === "SUSPENDED" || user.status === "suspended") return "red";
    return "green";
};

// ─── Deleted Account Pill ─────────────────────────────────────────────────────
const DeletedPill: React.FC = () => (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
        <Trash2 size={9} />
        🟥 Deleted
    </span>
);

const PendingPill: React.FC = () => (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
        <Clock size={9} />
        Pending Deletion
    </span>
);

// ─── View User Modal ──────────────────────────────────────────────────────────
const ViewUserModal: React.FC<{ user: User; onClose: () => void }> = ({ user, onClose }) => {
    const { t } = useTranslation();
    const isDeleted = user.isDeleted;
    const isPending = user.accountStatus === "PENDING_DELETION";

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full sm:max-w-sm sm:mx-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-black/20">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
                    <div className="flex items-center gap-2">
                        <h2 className="font-['Syne',sans-serif] text-[15px] font-semibold text-[var(--text-primary)]">
                            {t("users.userDetails")}
                        </h2>
                        {isDeleted && <DeletedPill />}
                        {!isDeleted && isPending && <PendingPill />}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/[0.06] dark:hover:bg-white/[0.07] transition-colors"
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Deleted Warning Banner */}
                {isDeleted && (
                    <div className="mx-5 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                        <Trash2 size={14} className="text-red-500 shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] font-bold text-red-400">Account Deleted</span>
                            {user.deletedAt && (
                                <span className="text-[10.5px] text-[var(--text-muted)]">
                                    {t("users.deletedAt")}: {new Date(user.deletedAt).toLocaleDateString()}
                                </span>
                            )}
                            {user.deleteReason && (
                                <span className="text-[10.5px] text-[var(--text-muted)]">
                                    {t("users.deleteReason")}: {user.deleteReason}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Pending Deletion Banner */}
                {!isDeleted && isPending && user.scheduledDeletionDate && (
                    <div className="mx-5 mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                        <Clock size={14} className="text-amber-500 shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] font-bold text-amber-400">{t("users.scheduledDeletionBadge")}</span>
                            <span className="text-[10.5px] text-[var(--text-muted)]">
                                {t("users.scheduledFor")}: {new Date(user.scheduledDeletionDate).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                )}

                {/* Body */}
                <div className="px-5 py-5">
                    <div className="flex items-center gap-3 mb-5">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-semibold border ${
                            isDeleted
                                ? "bg-red-500/10 border-red-500/20 text-red-400"
                                : "bg-blue-600/15 border-blue-500/25 text-blue-500 dark:text-blue-400"
                        }`}>
                            {user.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold text-[var(--text-primary)] truncate">{user.name}</p>
                            <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5 truncate">{user.email}</p>
                        </div>
                    </div>

                    <div className="border border-[var(--border-color)] rounded-xl overflow-hidden">
                        {[
                            { label: t("users.phone"), value: user.phone },
                            { label: t("users.orders"), value: user.orders },
                            { label: t("users.joined"), value: user.joined },
                        ].map(({ label, value }) => (
                            <div
                                key={label}
                                className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] last:border-none"
                            >
                                <span className="text-[11.5px] text-[var(--text-muted)]">{label}</span>
                                <span className="text-[12.5px] text-[var(--text-primary)]">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="px-5 pb-5">
                    <button
                        onClick={onClose}
                        className="w-full py-2 rounded-lg text-[12.5px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.07] dark:hover:bg-white/[0.09] transition-colors"
                    >
                        {t("users.close")}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
    <div className={`bg-black/[0.06] dark:bg-white/[0.06] rounded-lg animate-pulse ${className}`} />
);

const UsersSkeleton = () => (
    <div className="space-y-3">
        <Skeleton className="h-7 w-44" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[100px]" />)}
        </div>
        <Skeleton className="h-[380px]" />
    </div>
);

// ─── Filter tabs ──────────────────────────────────────────────────────────────
const FILTERS = [
    { value: "all",              labelKey: "users.all",            color: "" },
    { value: "ACTIVE",           labelKey: "users.active",         color: "text-emerald-500" },
    { value: "SUSPENDED",        labelKey: "users.suspended",      color: "text-red-500" },
    { value: "PENDING_DELETION", labelKey: "users.pendingDeletion",color: "text-amber-500" },
    { value: "DELETED",          labelKey: "users.deleted",        color: "text-zinc-400" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
const Users: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const dispatch = useAppDispatch();
    const { users, stats, pagination, loading, actionLoading, error, accountStatusFilter } =
        useAppSelector((s) => s.users);

    const [viewUser, setViewUser] = useState<User | null>(null);
    const [localSearch, setLocalSearch] = useState("");

    // Initial fetch
    useEffect(() => {
        dispatch(fetchUsers({ page: 1, limit: 20, accountStatus: accountStatusFilter }));
    }, [dispatch]);

    // Search with debounce
    useEffect(() => {
        const id = setTimeout(() => {
            dispatch(fetchUsers({ page: 1, limit: 20, search: localSearch, accountStatus: accountStatusFilter }));
        }, 400);
        return () => clearTimeout(id);
    }, [localSearch, dispatch]);

    const handleFilterChange = (value: string) => {
        dispatch(setAccountStatusFilter(value));
        dispatch(fetchUsers({ page: 1, limit: 20, search: localSearch, accountStatus: value }));
    };

    const handleToggle = (user: User) => {
        if (user.isDeleted || user.accountStatus === "DELETED") return;
        dispatch(toggleUserStatus({ id: user.id, currentStatus: user.status }));
    };

    if (error && !users.length) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
                <AlertCircle size={32} className="text-red-400" />
                <p className="text-[var(--text-secondary)] text-sm">{error}</p>
                <button
                    onClick={() => dispatch(fetchUsers({ page: 1, limit: 20 }))}
                    className="mt-1 px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                    {t("common.retry")}
                </button>
            </div>
        );
    }

    if (loading && !users.length) return <UsersSkeleton />;

    return (
        <>
            <div className="space-y-3" dir={isRTL ? "rtl" : "ltr"}>
                {/* Title */}
                <div className="flex items-baseline gap-2">
                    <h1 className="font-['Syne',sans-serif] text-[18px] font-bold text-[var(--text-primary)]">
                        {t("users.title")}
                    </h1>
                    {stats && (
                        <span className="text-[13px] text-[var(--text-muted)]">
                            — {stats.total.toLocaleString()} {t("users.registered")}
                        </span>
                    )}
                </div>

                {/* Stat Cards */}
                {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <StatCard
                            label={t("users.active")}
                            value={stats.active.toLocaleString()}
                            subText={`${Math.round((stats.active / Math.max(stats.total, 1)) * 100)}% ${t("users.ofTotal")}`}
                            trend="neutral"
                            icon={UserCheck}
                        />
                        <StatCard
                            label={t("users.suspended")}
                            value={stats.suspended.toLocaleString()}
                            subText={`↑ ${stats.newSuspendedThisWeek} ${t("users.newThisWeek")}`}
                            trend="down"
                            icon={UserX}
                        />
                        <StatCard
                            label={t("users.pendingDeletion")}
                            value={(stats.pendingDeletion ?? 0).toLocaleString()}
                            subText=""
                            trend="down"
                            icon={Clock}
                        />
                        <StatCard
                            label={t("users.deleted")}
                            value={(stats.deleted ?? 0).toLocaleString()}
                            subText=""
                            trend="down"
                            icon={Trash2}
                        />
                    </div>
                )}

                {/* Table Card */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[10px] overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[var(--border-color)]">
                        {/* Search */}
                        <div className="flex items-center gap-2 bg-black/[0.04] dark:bg-white/[0.05] border border-[var(--border-color)] rounded-lg px-3 py-[6px] w-full sm:w-[220px]">
                            <Search size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                            <input
                                type="text"
                                placeholder={t("users.searchPlaceholder")}
                                value={localSearch}
                                onChange={(e) => setLocalSearch(e.target.value)}
                                className="bg-transparent border-none outline-none text-[12.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] w-full font-['DM_Sans',sans-serif]"
                            />
                            {localSearch && (
                                <button onClick={() => setLocalSearch("")} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                                    <X size={13} />
                                </button>
                            )}
                        </div>

                        {/* Status Filter Tabs */}
                        <div className="flex items-center gap-1 flex-wrap">
                            {FILTERS.map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() => handleFilterChange(f.value)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors focus:outline-none ${
                                        accountStatusFilter === f.value
                                            ? "bg-blue-600 text-white"
                                            : `text-[var(--text-muted)] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] ${f.color}`
                                    }`}
                                >
                                    {t(f.labelKey)}
                                </button>
                            ))}
                        </div>

                        {/* Count */}
                        {pagination && (
                            <span className="text-[11.5px] text-[var(--text-muted)] ms-auto">
                                {pagination.total} {pagination.total !== 1 ? t("users.results") : t("users.result")}
                            </span>
                        )}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-[12.5px] min-w-[520px]">
                            <thead>
                                <tr className="bg-black/[0.02] dark:bg-white/[0.03]">
                                    {[
                                        t("users.user"),
                                        t("users.phone"),
                                        t("users.orders"),
                                        t("users.joined"),
                                        t("users.status"),
                                        t("users.actions"),
                                    ].map((col) => (
                                        <th
                                            key={col}
                                            className={`px-3.5 py-2.5 text-${isRTL ? "right" : "left"} text-[10.5px] font-medium text-[var(--text-muted)] border-b border-[var(--border-color)] uppercase tracking-[0.05em]`}
                                        >
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-[13px] text-[var(--text-muted)]">
                                            <UserX size={28} className="block mb-2 mx-auto opacity-40" />
                                            {t("users.noResults")}
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => {
                                        const isActing = actionLoading === user.id;
                                        const isDeleted = user.isDeleted;
                                        const isPending = user.accountStatus === "PENDING_DELETION";

                                        return (
                                            <tr
                                                key={user.id}
                                                className={`group transition-colors ${
                                                    isDeleted
                                                        ? "bg-red-500/[0.03] opacity-75"
                                                        : "hover:bg-black/[0.02] dark:hover:bg-white/[0.025]"
                                                }`}
                                            >
                                                {/* User */}
                                                <td className="px-3.5 py-2.5 border-b border-[var(--border-color)]">
                                                    <div className="flex items-center gap-2.5">
                                                        <Avatar initials={user.initials} />
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <p className="text-[12.5px] text-[var(--text-primary)] truncate">
                                                                    {user.name}
                                                                </p>
                                                                {isDeleted && <DeletedPill />}
                                                                {!isDeleted && isPending && <PendingPill />}
                                                            </div>
                                                            <p className="text-[10.5px] text-[var(--text-muted)] truncate">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Phone */}
                                                <td className="px-3.5 py-2.5 border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                                                    {user.phone}
                                                </td>
                                                {/* Orders */}
                                                <td className="px-3.5 py-2.5 border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                                                    {user.orders}
                                                </td>
                                                {/* Joined */}
                                                <td className="px-3.5 py-2.5 border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                                                    {user.joined}
                                                </td>
                                                {/* Status */}
                                                <td className="px-3.5 py-2.5 border-b border-[var(--border-color)]">
                                                    <Badge variant={statusBadgeVariant(user)}>
                                                        {isDeleted
                                                            ? t("users.deleted")
                                                            : isPending
                                                            ? t("users.pendingDeletion")
                                                            : t(`users.${user.status}`)}
                                                    </Badge>
                                                </td>
                                                {/* Actions */}
                                                <td className="px-3.5 py-2.5 border-b border-[var(--border-color)]">
                                                    <div className="flex items-center gap-2">
                                                        {/* View — always available */}
                                                        <button
                                                            onClick={() => setViewUser(user)}
                                                            title={t("users.viewDetails")}
                                                            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/[0.06] dark:hover:bg-white/[0.07] transition-colors"
                                                        >
                                                            <Eye size={15} />
                                                        </button>

                                                        {/* Toggle suspend/restore — blocked for deleted */}
                                                        {isDeleted ? (
                                                            <span
                                                                title={t("users.cannotEditDeleted")}
                                                                className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] opacity-30 cursor-not-allowed"
                                                            >
                                                                <Ban size={15} />
                                                            </span>
                                                        ) : isActing ? (
                                                            <Spinner size="sm" className="mx-1" />
                                                        ) : user.status === "active" ? (
                                                            <button
                                                                onClick={() => handleToggle(user)}
                                                                title={t("users.suspend")}
                                                                className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                            >
                                                                <Ban size={15} />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleToggle(user)}
                                                                title={t("users.restore")}
                                                                className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-green-500 hover:bg-green-500/10 transition-colors"
                                                            >
                                                                <RefreshCw size={15} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.pages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-color)]">
                            <span className="text-[11.5px] text-[var(--text-muted)]">
                                {t("users.page")} {pagination.page} / {pagination.pages}
                            </span>
                            <div className="flex gap-1.5">
                                <button
                                    disabled={pagination.page <= 1 || loading}
                                    onClick={() => dispatch(fetchUsers({ page: pagination.page - 1, limit: pagination.limit, search: localSearch, accountStatus: accountStatusFilter }))}
                                    className="px-3 py-1.5 rounded-lg text-[11.5px] text-[var(--text-secondary)] bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.07] dark:hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    {t("users.prev")}
                                </button>
                                <button
                                    disabled={pagination.page >= pagination.pages || loading}
                                    onClick={() => dispatch(fetchUsers({ page: pagination.page + 1, limit: pagination.limit, search: localSearch, accountStatus: accountStatusFilter }))}
                                    className="px-3 py-1.5 rounded-lg text-[11.5px] text-[var(--text-secondary)] bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.07] dark:hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    {t("users.next") ?? "Next"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {viewUser && <ViewUserModal user={viewUser} onClose={() => setViewUser(null)} />}
        </>
    );
};

export default Users;
