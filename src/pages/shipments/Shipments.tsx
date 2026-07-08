import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Package,
  TrendingUp,
  Truck,
  DollarSign,
  Search,
  X,
  Settings,
  PackageX,
  ArrowLeft,
} from "lucide-react";
import {
  fetchShipments,
  updateShipmentStatus,
  setPage,
} from "../../store/slices/shipmentsSlice";
import type { Shipment } from "../../types/shipment";
import type { AppDispatch, RootState } from "../../store";
import { StatCard } from "../../components/shared/StatCard";
import { Badge } from "../../components/ui/Badge";
import { Spinner } from "../../components/ui/Spinner";

// ─── Badge maps ───────────────────────────────────────────────────────────────
const statusBadge: Record<
  string,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  pending_offers: "amber",
  captain_assignment: "blue",
  picked_up: "blue",
  in_transit: "blue",
  delivered: "green",
  cancelled: "red",
};

const statusKeys = [
  "all",
  "pending_offers",
  "captain_assignment",
  "picked_up",
  "in_transit",
  "delivered",
  "cancelled",
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div
    className={`bg-[var(--bg-primary)] rounded-lg animate-pulse ${className}`}
  />
);

const ShipmentsSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-7 w-44" />
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-[100px]" />
      ))}
    </div>
    <Skeleton className="h-[380px]" />
  </div>
);

// ─── Manage Modal ─────────────────────────────────────────────────────────────
const ManageShipmentModal: React.FC<{
  shipment: Shipment;
  onUpdate: (id: string, status: string) => void;
  onClose: () => void;
  actionLoading: boolean;
}> = ({ shipment, onUpdate, onClose, actionLoading }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [newStatus, setNewStatus] = useState(shipment.status);

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending_offers: t("shipments.pending"),
      captain_assignment: t("shipments.assigned"),
      picked_up: t("shipments.pickedUp"),
      in_transit: t("shipments.inTransit"),
      delivered: t("shipments.delivered"),
      cancelled: t("shipments.cancelled"),
    };
    return map[status] ?? status;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      dir={isRTL ? "rtl" : "ltr"}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-sm sm:mx-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-t-2xl sm:rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
          <h2 className="font-['Syne',sans-serif] text-[15px] font-semibold text-[var(--text-primary)]">
            {t("shipments.manageShipment")}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-5">
          <p className="text-[12px] font-mono text-blue-500 mb-4">
            {shipment.trackingNumber}
          </p>

          {/* Proof of Delivery Details (OTP / Completed PoD) */}
          {shipment.proofOfDelivery && (
            <div className="mb-4 p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl text-[11px] space-y-2 text-[var(--text-secondary)]">
              {["picked_up", "in_transit", "captain_assignment", "assigned"].includes(shipment.status) && shipment.proofOfDelivery.otpCode && (
                <div className="flex justify-between items-center">
                  <span>{isRTL ? "رمز التحقق (OTP):" : "Verification OTP:"}</span>
                  <span className="font-mono font-bold text-blue-500 px-2 py-0.5 bg-blue-500/10 rounded">
                    {shipment.proofOfDelivery.otpCode}
                  </span>
                </div>
              )}

              {shipment.status === "delivered" && (
                <>
                  <div className="border-b border-[var(--border-color)] pb-1.5 font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {isRTL ? "بيانات إثبات التوصيل" : "Delivery Proof Data"}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] block">{isRTL ? "المستلم:" : "Recipient:"}</span>
                      <span className="font-medium text-[var(--text-primary)]">{shipment.proofOfDelivery.recipientName || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] block">{isRTL ? "التوقيت:" : "Verified at:"}</span>
                      <span className="font-medium text-[var(--text-primary)]">
                        {shipment.proofOfDelivery.verifiedAt 
                          ? new Date(shipment.proofOfDelivery.verifiedAt).toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  {(shipment.proofOfDelivery.packageImage || shipment.proofOfDelivery.signatureImage) && (
                    <div className="flex gap-2 pt-1">
                      {shipment.proofOfDelivery.packageImage && (
                        <div className="flex-1">
                          <span className="text-[9px] text-[var(--text-muted)] block mb-0.5">{isRTL ? "صورة الشحنة:" : "Package:"}</span>
                          <div className="relative h-14 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden group">
                            <img src={shipment.proofOfDelivery.packageImage} alt="Package" className="h-full w-full object-cover" />
                            <a 
                              href={shipment.proofOfDelivery.packageImage} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-[8px] text-white font-bold"
                            >
                              {isRTL ? "عرض" : "View"}
                            </a>
                          </div>
                        </div>
                      )}
                      {shipment.proofOfDelivery.signatureImage && (
                        <div className="flex-1">
                          <span className="text-[9px] text-[var(--text-muted)] block mb-0.5">{isRTL ? "التوقيع:" : "Signature:"}</span>
                          <div className="relative h-14 bg-white border border-[var(--border-color)] rounded-lg overflow-hidden flex items-center justify-center p-0.5">
                            <img src={shipment.proofOfDelivery.signatureImage} alt="Signature" className="h-full object-contain max-w-full" />
                            <a 
                              href={shipment.proofOfDelivery.signatureImage} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-[8px] text-white font-bold"
                            >
                              {isRTL ? "عرض" : "View"}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 mb-4">
            {actionLoading ? (
              <div className="flex justify-center py-4">
                <Spinner size="md" />
              </div>
            ) : (
              statusKeys
                .filter((s) => s !== "all")
                .map((s) => (
                  <button
                    key={s}
                    onClick={() => setNewStatus(s as any)}
                    className={`w-full py-2.5 rounded-lg text-[12.5px] font-medium border transition-colors
                    ${
                      newStatus === s
                        ? "border-blue-500/50 bg-blue-500/10 text-blue-500"
                        : "border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
                    }`}
                  >
                    {getStatusLabel(s)}
                  </button>
                ))
            )}
          </div>

          <button
            onClick={() => onUpdate(shipment.id, newStatus)}
            disabled={newStatus === shipment.status || actionLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[12.5px] font-medium rounded-lg transition-colors"
          >
            {t("shipments.updateStatus")}
          </button>
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg text-[12.5px] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-primary)] transition-colors"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const ShipmentsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const { shipments, isLoading, total, page, limit } = useSelector(
    (state: RootState) => state.shipments,
  );

  const [localSearch, setLocalSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    null,
  );
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(localSearch);
    }, 400);
    return () => clearTimeout(handler);
  }, [localSearch]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    dispatch(setPage(1));
  }, [debouncedSearch, dispatch]);

  // Fetch shipments when page, limit, statusFilter, or debouncedSearch changes
  useEffect(() => {
    dispatch(
      fetchShipments({
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter,
      }),
    );
  }, [page, limit, debouncedSearch, statusFilter, dispatch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(
      fetchShipments({
        page: 1,
        limit,
        search: localSearch,
        status: statusFilter,
      }),
    );
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    setActionLoading(true);
    await dispatch(updateShipmentStatus({ id, status }));
    setActionLoading(false);
    setSelectedShipment(null);
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      all: t("shipments.all"),
      pending_offers: t("shipments.pending"),
      captain_assignment: t("shipments.assigned"),
      picked_up: t("shipments.pickedUp"),
      in_transit: t("shipments.inTransit"),
      delivered: t("shipments.delivered"),
      cancelled: t("shipments.cancelled"),
    };
    return map[status] ?? status;
  };

  const deliveredCount = shipments.filter(
    (s) => s.status === "delivered",
  ).length;
  const inTransitCount = shipments.filter(
    (s) => s.status === "in_transit",
  ).length;
  const pendingCount = shipments.filter(
    (s) => s.status === "pending_offers",
  ).length;
  const totalRevenue = shipments.reduce((sum, s) => sum + s.price, 0);
  const totalPages = Math.ceil(total / limit);

  const tableColumns = [
    t("shipments.trackingNumber"),
    t("shipments.customer"),
    t("shipments.driver"),
    t("shipments.route"),
    t("shipments.price"),
    t("shipments.status"),
    t("shipments.date"),
    t("shipments.actions"),
  ];

  if (isLoading && !shipments.length) return <ShipmentsSkeleton />;

  return (
    <>
      <div className="space-y-3" dir={isRTL ? "rtl" : "ltr"}>
        {/* ── Title ─────────────────────────────────────────────── */}
        <div className="flex items-baseline gap-2">
          <h1 className="font-['Syne',sans-serif] text-[18px] font-bold text-[var(--text-primary)]">
            {t("shipments.title")}
          </h1>
          <span className="text-[13px] text-[var(--text-secondary)]">
            — {total} {t("shipments.totalShipments")}
          </span>
        </div>

        {/* ── Stat cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <StatCard
            label={t("shipments.totalShipments")}
            value={total.toString()}
            subText="↑ 12% this month"
            trend="up"
            icon={Package}
          />
          <StatCard
            label={t("shipments.delivered")}
            value={deliveredCount.toString()}
            subText={`${total ? Math.round((deliveredCount / total) * 100) : 0}% success rate`}
            trend="up"
            icon={TrendingUp}
          />
          <StatCard
            label={t("shipments.inTransit")}
            value={inTransitCount.toString()}
            subText={`${pendingCount} ${t("shipments.pending")}`}
            trend="neutral"
            icon={Truck}
          />
          <StatCard
            label={t("shipments.totalRevenue")}
            value={`EGP ${totalRevenue}`}
            subText="↑ 8% vs yesterday"
            trend="up"
            icon={DollarSign}
          />
        </div>

        {/* ── Table ─────────────────────────────────────────────── */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[10px] overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[var(--border-color)]">
            <form
              onSubmit={handleSearch}
              className="flex items-center gap-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-[6px] w-full sm:w-[240px]"
            >
              <Search
                size={15}
                className="text-[var(--text-muted)] flex-shrink-0"
              />
              <input
                type="text"
                placeholder={t("shipments.searchPlaceholder")}
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-[12.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] w-full"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={() => setLocalSearch("")}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X size={13} />
                </button>
              )}
            </form>

            <div className="flex items-center gap-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-1 flex-wrap">
              {statusKeys.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-md text-[11.5px] transition-colors
                    ${statusFilter === s ? "bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}
                >
                  {getStatusLabel(s)}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12.5px] min-w-[800px]">
              <thead>
                <tr className="bg-[var(--bg-primary)]">
                  {tableColumns.map((col, idx) => (
                    <th
                      key={col}
                      className={`px-3.5 py-2.5 text-${isRTL ? "right" : "left"} text-[10.5px] font-medium text-[var(--text-muted)] border-b border-[var(--border-color)] uppercase tracking-[0.05em]
                      ${idx === tableColumns.length - 1 ? "sticky end-0 bg-[var(--bg-primary)] z-10" : ""}`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="flex justify-center">
                        <Spinner size="md" />
                      </div>
                    </td>
                  </tr>
                ) : shipments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-[13px] text-[var(--text-muted)]"
                    >
                      <PackageX
                        size={28}
                        className="block mb-2 mx-auto text-[var(--text-muted)]"
                      />
                      {t("offices.noResults")}
                    </td>
                  </tr>
                ) : (
                  shipments.map((shipment) => (
                    <tr
                      key={shipment.id}
                      className="hover:bg-[var(--bg-primary)] transition-colors"
                    >
                      {/* Tracking */}
                      <td className="px-3.5 py-2.5 border-b border-[var(--border-color)]">
                        <span className="text-[12px] font-mono text-blue-500">
                          {shipment.trackingNumber}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="px-3.5 py-2.5 border-b border-[var(--border-color)]">
                        <p className="text-[12.5px] text-[var(--text-primary)]">
                          {shipment.customer.name}
                        </p>
                        <p className="text-[10.5px] text-[var(--text-muted)]">
                          {shipment.customer.phone}
                        </p>
                      </td>

                      {/* Driver */}
                      <td className="px-3.5 py-2.5 border-b border-[var(--border-color)]">
                        {shipment.driver ? (
                          <>
                            <p className="text-[12.5px] text-[var(--text-primary)]">
                              {shipment.driver.name}
                            </p>
                            <p className="text-[10.5px] text-[var(--text-muted)]">
                              {shipment.driver.phone}
                            </p>
                          </>
                        ) : (
                          <span className="text-[11.5px] text-[var(--text-muted)] italic">
                            {t("shipments.unassigned")}
                          </span>
                        )}
                      </td>

                      {/* Route */}
                      <td className="px-3.5 py-2.5 border-b border-[var(--border-color)]">
                        <div
                          className="flex items-center gap-1.5 text-[11.5px] text-[var(--text-secondary)]"
                          title={`${shipment.pickup.address || ""} ← ${shipment.delivery.address || ""}`}
                        >
                          <span>
                            {shipment.pickup.city ||
                              shipment.pickup.address ||
                              "—"}
                          </span>
                          <ArrowLeft
                            size={11}
                            className="text-[var(--text-muted)]"
                          />
                          <span>
                            {shipment.delivery.city ||
                              shipment.delivery.address ||
                              "—"}
                          </span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-3.5 py-2.5 border-b border-[var(--border-color)]">
                        <p className="text-[12.5px] text-[var(--text-primary)]">
                          EGP {shipment.price}
                        </p>
                        <p className="text-[10.5px] text-[var(--text-muted)]">
                          {t("shipments.commission")}: EGP {shipment.commission}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-3.5 py-2.5 border-b border-[var(--border-color)]">
                        <Badge variant={statusBadge[shipment.status] ?? "gray"}>
                          {getStatusLabel(shipment.status)}
                        </Badge>
                      </td>

                      {/* Date */}
                      <td className="px-3.5 py-2.5 border-b border-[var(--border-color)] text-[11.5px] text-[var(--text-muted)]">
                        {new Date(shipment.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="px-3.5 py-2.5 border-b border-[var(--border-color)] sticky end-0 bg-[var(--bg-secondary)] z-10">
                        <button
                          onClick={() => setSelectedShipment(shipment)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
                          title={t("common.manage")}
                        >
                          <Settings size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-[var(--text-secondary)]">
              {t("common.page")} {page} {t("common.of")} {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() =>
                  dispatch(setPage(page - 1))
                }
                className="px-3 py-1.5 text-[12px] border border-[var(--border-color)] rounded-lg disabled:opacity-40 hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] transition-colors"
              >
                {t("common.previous")}
              </button>
              <button
                disabled={page === totalPages}
                onClick={() =>
                  dispatch(setPage(page + 1))
                }
                className="px-3 py-1.5 text-[12px] border border-[var(--border-color)] rounded-lg disabled:opacity-40 hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] transition-colors"
              >
                {t("common.next")}
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedShipment && (
        <ManageShipmentModal
          shipment={selectedShipment}
          onUpdate={handleUpdateStatus}
          onClose={() => setSelectedShipment(null)}
          actionLoading={actionLoading}
        />
      )}
    </>
  );
};

export default ShipmentsPage;
