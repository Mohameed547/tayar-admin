export interface Shipment {
  id: string;
  trackingNumber: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  driver?: {
    id: string;
    name: string;
    phone: string;
  };
  pickup: {
    address: string;
    city: string;
  };
  delivery: {
    address: string;
    city: string;
  };
  status:
    | "pending"
    | "pending_offers"
    | "assigned"
    | "captain_assignment"
    | "picked_up"
    | "in_transit"
    | "delivered"
    | "cancelled";
  price: number;
  commission: number;
  createdAt: string;
  updatedAt: string;
  proofOfDelivery?: {
    otpCode: string | null;
    recipientName: string | null;
    signatureImage: string | null;
    packageImage: string | null;
    verifiedAt: string | null;
  };
}

export interface ShipmentsState {
  shipments: Shipment[];
  isLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
}
