import type { Shipment } from "../types/shipment";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const getToken = () => localStorage.getItem("token");

export const shipmentsService = {
    getShipments: async (params: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
    }) => {
        const query = new URLSearchParams();
        if (params.page) query.append("page", String(params.page));
        if (params.limit) query.append("limit", String(params.limit));
        if (params.search) query.append("search", params.search);
        if (params.status && params.status !== "all")
            query.append("status", params.status);

        const response = await fetch(
            `${BASE_URL}/shipments/admin/all?${query}`,
            {
                headers: { Authorization: `Bearer ${getToken()}` },
            },
        );

        const data = await response.json();
        if (!response.ok)
            throw new Error(data.message || "Failed to fetch shipments");

        const shipments: Shipment[] = data.data.shipments.map((s: any) => ({
            id: s._id,
            trackingNumber: s.trackingNumber || "N/A",
            customer: {
                id: s.customer?._id || "",
                name: s.customer?.fullName || "N/A",
                phone: s.customer?.phone || "N/A",
            },
            driver: s.captain
                ? {
                      id: s.captain._id,
                      name: s.captain.fullName || "N/A",
                      phone: s.captain.phone || "N/A",
                  }
                : undefined,
            pickup: {
                address: s.pickupAddress || "",
                city: "",
            },
            delivery: {
                address: s.deliveryAddress || "",
                city: "",
            },
            status: s.status,
            price: s.estimatedPriceMin || 0,
            commission: 0,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
            proofOfDelivery: s.proofOfDelivery ? {
                otpCode: s.proofOfDelivery.otpCode || null,
                recipientName: s.proofOfDelivery.recipientName || null,
                signatureImage: s.proofOfDelivery.signatureImage || null,
                packageImage: s.proofOfDelivery.packageImage || null,
                verifiedAt: s.proofOfDelivery.verifiedAt || null,
            } : undefined,
        }));

        return { shipments, total: data.data.total };
    },

    updateShipmentStatus: async (id: string, status: string) => {
        const response = await fetch(
            `${BASE_URL}/shipments/admin/${id}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ status }),
            },
        );

        const data = await response.json();
        if (!response.ok)
            throw new Error(data.message || "Failed to update status");

        const s = data.data;
        const shipment: Shipment = {
            id: s._id,
            trackingNumber: s.trackingNumber || "N/A",
            customer: {
                id: s.customer?._id || "",
                name: s.customer?.fullName || "N/A",
                phone: s.customer?.phone || "N/A",
            },
            driver: s.captain
                ? {
                      id: s.captain._id,
                      name: s.captain.fullName || "N/A",
                      phone: s.captain.phone || "N/A",
                  }
                : undefined,
            pickup: { address: s.pickupAddress || "", city: "" },
            delivery: { address: s.deliveryAddress || "", city: "" },
            status: s.status,
            price: s.estimatedPriceMin || 0,
            commission: 0,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
            proofOfDelivery: s.proofOfDelivery ? {
                otpCode: s.proofOfDelivery.otpCode || null,
                recipientName: s.proofOfDelivery.recipientName || null,
                signatureImage: s.proofOfDelivery.signatureImage || null,
                packageImage: s.proofOfDelivery.packageImage || null,
                verifiedAt: s.proofOfDelivery.verifiedAt || null,
            } : undefined,
        };

        return shipment;
    },
};
