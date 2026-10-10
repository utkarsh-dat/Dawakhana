import { Medicine } from "./medicines";

export interface CartItem extends Medicine {
    quantity: number;
}

export interface DeliveryAddress {
    firstName: string;
    lastName: string;
    address: string;
    phoneNumber: string;
    postalCode: string;
}

export interface Order {
    id: string;
    userId: string;
    items: CartItem[];
    subtotal: number;
    deliveryFee: number;
    total: number;
    status: "Pending" | "Processing" | "In Transit" | "Delivered" | "Pending Verification" | "Order Placed" | "Confirmed" | "Shipped" | "Cancelled";
    address: DeliveryAddress;
    createdAt: Date | string | { seconds: number };
    paymentMethod: "Card" | "Google Pay" | "COD";
    trackingHistory?: TrackingEvent[];
    awbNumber?: string;
    courierName?: string;
}

export interface TrackingEvent {
    status: string;
    location?: string;
    remarks?: string;
    timestamp: string;
}
