/**
 * Minimal JSON client for the device-auth endpoints. Uses fetch and
 * Laravel's XSRF-TOKEN cookie, so it works without axios.
 */
export class DeviceAuthRequestError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly data: Record<string, unknown>,
    ) {
        super(message);
        this.name = 'DeviceAuthRequestError';
    }

    /** The "status" field the server puts on device answers (pending, not_registered…). */
    get reason(): string | null {
        return typeof this.data.status === 'string' ? this.data.status : null;
    }
}

function xsrfToken(): string | null {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);

    return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function fallbackMessage(status: number): string {
    switch (status) {
        case 419:
            return 'Your session expired. Reload the page and try again.';
        case 429:
            return 'Too many attempts. Wait a minute and try again.';
        case 401:
            return 'You were signed out. Sign in again to continue.';
        default:
            return 'Something went wrong. Try again.';
    }
}

export async function sendJson<T>(
    method: 'GET' | 'POST',
    url: string,
    body?: unknown,
): Promise<T> {
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };

    if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }

    const token = xsrfToken();

    if (token) {
        headers['X-XSRF-TOKEN'] = token;
    }

    const init: RequestInit = { method, headers, credentials: 'same-origin' };

    if (body !== undefined && method !== 'GET') {
        init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);

    let data: Record<string, unknown> = {};

    try {
        data = (await response.json()) as Record<string, unknown>;
    } catch {
        // empty or non-JSON body
    }

    if (!response.ok) {
        const message =
            typeof data.message === 'string' && data.message !== ''
                ? data.message
                : fallbackMessage(response.status);

        throw new DeviceAuthRequestError(message, response.status, data);
    }

    return data as T;
}
