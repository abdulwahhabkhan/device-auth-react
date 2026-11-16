/**
 * Details only the browser knows, shown to the administrator who reviews
 * the request. Nothing here is used for security decisions.
 */
interface UADataValues {
    platform?: string;
    platformVersion?: string;
    model?: string;
}

interface NavigatorUAData {
    platform?: string;
    mobile?: boolean;
    getHighEntropyValues?: (hints: string[]) => Promise<UADataValues>;
}

export type ClientMeta = Record<string, string | number | null>;

export async function collectClientMeta(): Promise<ClientMeta> {
    const meta: ClientMeta = {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
        language: navigator.language ?? null,
        screen: `${window.screen.width}×${window.screen.height} @${window.devicePixelRatio}x`,
        touchPoints: navigator.maxTouchPoints ?? 0,
    };

    const uaData = (
        navigator as Navigator & { userAgentData?: NavigatorUAData }
    ).userAgentData;

    if (uaData?.getHighEntropyValues) {
        try {
            const values = await uaData.getHighEntropyValues([
                'platform',
                'platformVersion',
                'model',
            ]);

            meta.platform = values.platform ?? null;
            meta.platformVersion = values.platformVersion ?? null;
            meta.model = values.model || null;
        } catch {
            // the browser declined; the user agent string is still recorded server side
        }
    }

    return meta;
}

/** A friendly default for the "Device name" field. */
export function suggestDeviceName(): string {
    if (typeof navigator === 'undefined') {
        return '';
    }

    const ua = navigator.userAgent;

    if (
        /iPad/.test(ua) ||
        (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
    ) {
        return 'iPad';
    }

    if (/iPhone/.test(ua)) {
        return 'iPhone';
    }

    if (/Android/.test(ua)) {
        return /Mobile/.test(ua) ? 'Android phone' : 'Android tablet';
    }

    if (/Windows/.test(ua)) {
        return 'Windows PC';
    }

    if (/Macintosh/.test(ua)) {
        return 'Mac';
    }

    if (/CrOS/.test(ua)) {
        return 'Chromebook';
    }

    if (/Linux/.test(ua)) {
        return 'Linux computer';
    }

    return '';
}
