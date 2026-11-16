export type DeviceStatus = 'pending' | 'active' | 'rejected' | 'revoked';

export interface DeviceUser {
    id: number | string;
    name: string;
    email: string | null;
}

/** What the person at the device may see about their own request. */
export interface DevicePublicSummary {
    reference: string;
    name: string;
    status: DeviceStatus;
    requested_at: string | null;
    review_note: string | null;
}

/** Shared on every Inertia page as props.deviceAuth. */
export interface DeviceAuthShared {
    enabled: boolean;
    device: { id: number; name: string; reference: string } | null;
    confirmRequired: boolean;
    flash: string | null;
    isAdmin: boolean;
    pendingCount: number | null;
    urls: {
        confirmStatus: string | null;
        confirmOptions: string | null;
        confirm: string | null;
        admin: string | null;
    };
}

export interface AdminDeviceSummary {
    id: number;
    reference: string;
    name: string;
    status: DeviceStatus;
    device_type: string | null;
    os: string | null;
    browser: string | null;
    request_ip: string | null;
    requester: DeviceUser | null;
    created_at: string | null;
    last_seen_at: string | null;
    backup_eligible: boolean;
}

export interface AdminDeviceDetails extends AdminDeviceSummary {
    request_note: string | null;
    user_agent: string | null;
    os_family: string | null;
    device_model: string | null;
    client_meta: Record<string, string | null>;
    aaguid: string | null;
    authenticator: string | null;
    backed_up: boolean;
    reviewer: DeviceUser | null;
    reviewed_at: string | null;
    review_note: string | null;
    last_ip: string | null;
    is_current: boolean;
}

/** Device counts per status, every status present. */
export type DeviceCounts = Record<DeviceStatus, number>;

export interface DeviceLoginEntry {
    id: number;
    user: DeviceUser | null;
    ip: string | null;
    purpose: 'verify' | 'confirm';
    created_at: string | null;
}

/** The page of devices built by the core DeviceIndexPageData. */
export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
}
