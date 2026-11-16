import { usePage } from '@inertiajs/react';
import type { DeviceAuthShared } from '../types';

/** The props.deviceAuth value shared by the package on every page. */
export function useDeviceAuth(): DeviceAuthShared | null {
    const props = usePage().props as Record<string, unknown>;

    return (props.deviceAuth as DeviceAuthShared | null | undefined) ?? null;
}
