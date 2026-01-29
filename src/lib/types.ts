import { Timestamp } from "firebase/firestore";
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
    status: "Pending" | "Processing" | "In Transit" | "Delivered";
    address: DeliveryAddress;
    createdAt: Timestamp;
    paymentMethod: "Card" | "Google Pay" | "COD";
}
