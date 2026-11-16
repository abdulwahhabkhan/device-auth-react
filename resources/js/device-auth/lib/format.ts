const DEVICE_TYPES: Record<string, string> = {
    desktop: 'Computer',
    smartphone: 'Phone',
    phablet: 'Phone',
    tablet: 'Tablet',
};

export function deviceTypeLabel(type: string | null | undefined): string {
    if (!type) {
        return 'Unknown device';
    }

    return DEVICE_TYPES[type] ?? type.charAt(0).toUpperCase() + type.slice(1);
}

/** "Computer, Windows 10, Chrome 142" */
export function describeDevice(d: {
    device_type: string | null;
    os: string | null;
    browser: string | null;
}): string {
    return [deviceTypeLabel(d.device_type), d.os, d.browser]
        .filter(Boolean)
        .join(', ');
}

export function formatDateTime(iso: string | null | undefined): string {
    if (!iso) {
        return 'Never';
    }

    return new Date(iso).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
];

export function timeAgo(iso: string | null | undefined): string {
    if (!iso) {
        return 'Never';
    }

    const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

    for (const [unit, size] of UNITS) {
        if (Math.abs(seconds) >= size) {
            return rtf.format(Math.round(seconds / size), unit);
        }
    }

    return 'just now';
}
