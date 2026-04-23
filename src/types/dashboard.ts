export type MainTab = "home" | "request" | "history" | "cash";
export type ClassType = "A" | "B" | "C";
export type PositionType = "G" | "F" | "C";
export type ReceiptType = "none" | "income" | "expense";
export type RequestStatus = "requested" | "accepted" | "completed" | "cancelled" | "rejected";
export type Filter = "all" | "requested" | "accepted" | "completed";

export interface Profile {
    id: string;
    name: string | null;
    birthday: string | null;
    position: PositionType | null;
    experience_years: number | null;
    phone: string | null;
    photo_url?: string | null;
    basketball_level?: string | null;
}

export interface TicketRow {
    class_type: ClassType;
    balance: number;
}

export interface PointsStats {
    user_id?: string;
    balance: number;
    earned_total: number;
    spent_total?: number;
    completed_count: number;
    review_count: number;
    tier: string;
    updated_at?: string;
}

export interface MyRequest {
    id: string;
    class_type: ClassType;
    requested_start: string;
    duration_min: number;
    address: string | null;
    note: string | null;
    status: RequestStatus;
    ticket_deducted: boolean | null;
    completed_at: string | null;
    cancelled_at: string | null;
    created_at: string;
    coach_id: string | null;
    region_id?: string | null;
}

export interface Product {
    id: string;
    name: string;
    class_type: ClassType;
    ticket_qty: number;
    price: number;
}

export interface PendingPurchase {
    id: string;
    class_type: ClassType;
    ticket_qty: number;
    status: "pending" | "paid" | "cancelled" | "refunded";
    amount: number;
    original_amount: number | null;
    points_used: number;
    created_at: string;
    note: string | null;
}

export interface Region {
    id: string;
    region_type: string;
    city: string;
    district: string | null;
    display_name: string;
    active: boolean;
}

export interface ShippingAddress {
    id: string;
    user_id: string;
    label: string;
    recipient_name: string;
    phone: string;
    postcode: string;
    address_road: string;
    address_jibun: string | null;
    address_extra: string | null;
    detail_address: string | null;
    is_default: boolean;
    created_at?: string;
    updated_at?: string;
}

export type ShopRequestStatus = "pending" | "paid" | "cancelled" | "refunded";

export interface ShopPurchaseRequest {
    id: string;
    product_slug: string;
    product_title: string;
    size_label: string;
    quantity: number;
    points_used: number;
    cash_amount: number;
    status: ShopRequestStatus;
    thumbnail_url: string | null;
    created_at: string;
    paid_at: string | null;
    cancelled_at: string | null;
}

export interface ShopProduct {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string;
    category: string;
    slug: string;
    is_active: boolean;
    min_price?: number;
    total_stock?: number;
}

export interface ShopVariant {
    id: string;
    product_id: string;
    size_label: string;
    point_price: number;
    stock_qty: number;
    is_active: boolean;
}
