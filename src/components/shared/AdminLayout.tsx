import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAppDispatch, useAppSelector } from "../../store";
import { useSocketEvent } from "../../services/socket";
import { fetchDashboardData } from "../../store/slices/dashboardSlice";
import { fetchUsers } from "../../store/slices/usersSlice";
import { fetchDrivers } from "../../store/slices/driversSlice";
import { fetchOffices, fetchOfficeStats } from "../../store/slices/officesSlice";
import { fetchShipments } from "../../store/slices/shipmentsSlice";
import { fetchRevenue } from "../../store/slices/revenueSlice";
import { fetchEscrow } from "../../store/slices/escrowSlice";
import { fetchVerifications } from "../../store/slices/Verificationslice";
import { fetchDisputes } from "../../store/slices/disputesSlice";

const AdminLayout = () => {
    const dispatch = useAppDispatch();
    const location = useLocation();
    const revenuePeriod = useAppSelector((state) => state.revenue.period);
    const verificationFilter = useAppSelector((state) => state.verification.filter);

    const refreshDashboard = () => {
        console.log("Real-time dashboard update event received, refreshing stats...");
        dispatch(fetchDashboardData());
    };

    const handleUserUpdate = () => {
        console.log("Real-time user/driver/office update received, refreshing relevant lists...");
        dispatch(fetchDashboardData());
        if (location.pathname.includes("users")) {
            dispatch(fetchUsers({}));
        }
        if (location.pathname.includes("drivers")) {
            dispatch(fetchDrivers({}));
        }
        if (location.pathname.includes("offices")) {
            dispatch(fetchOffices({}));
            dispatch(fetchOfficeStats());
        }
    };

    const handleShipmentUpdate = () => {
        console.log("Real-time shipment update received, refreshing lists...");
        dispatch(fetchDashboardData());
        if (location.pathname.includes("shipments")) {
            dispatch(fetchShipments({}));
        }
        if (location.pathname.includes("revenue")) {
            dispatch(fetchRevenue(revenuePeriod));
        }
        if (location.pathname.includes("escrow")) {
            dispatch(fetchEscrow("all"));
        }
    };

    const handleVerificationUpdate = () => {
        console.log("Real-time verification update received, refreshing list...");
        dispatch(fetchDashboardData());
        if (location.pathname.includes("verification")) {
            dispatch(fetchVerifications(verificationFilter));
        }
    };

    const handleSupportUpdate = () => {
        console.log("Real-time support/dispute update received, refreshing...");
        dispatch(fetchDashboardData());
        if (location.pathname.includes("disputes")) {
            dispatch(fetchDisputes({}));
        }
    };

    useSocketEvent("admin:dashboardUpdate", refreshDashboard);
    useSocketEvent("admin:userUpdate", handleUserUpdate);
    useSocketEvent("admin:shipmentUpdate", handleShipmentUpdate);
    useSocketEvent("admin:verificationUpdate", handleVerificationUpdate);
    useSocketEvent("admin:supportUpdate", handleSupportUpdate);
    return (
        <div className="flex min-h-screen bg-[var(--bg-primary)]">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div
                className="
          flex-1
          flex flex-col
          w-full
          md:ms-64
          transition-all duration-300
        "
            >
                {/* Topbar */}
                <Topbar />

                {/* Page Content */}
                <main className="flex-1 p-3 sm:p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
