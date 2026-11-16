import { Head, Link, router } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import { Button, inputClass, Notice } from '../../../device-auth/components/ui';
import { describeDevice, timeAgo } from '../../../device-auth/lib/format';
import { useDeviceAuth } from '../../../device-auth/lib/use-device-auth';
import type {
    AdminDeviceSummary,
    DeviceStatus,
    Paginated,
} from '../../../device-auth/types';

interface Props {
    status: DeviceStatus;
    search: string;
    counts: Record<DeviceStatus, number>;
    devices: Paginated<AdminDeviceSummary>;
    urls: { index: string };
}

const TABS: { status: DeviceStatus; label: string }[] = [
    { status: 'pending', label: 'Requests' },
    { status: 'active', label: 'Approved' },
    { status: 'rejected', label: 'Rejected' },
    { status: 'revoked', label: 'Revoked' },
];

const EMPTY: Record<DeviceStatus, string> = {
    pending:
        'No requests waiting. When someone asks for access from a new device, it shows up here.',
    active: 'No approved devices yet. Approve a request to let that device open the app.',
    rejected: 'No rejected requests.',
    revoked: 'No revoked devices.',
};

export default function DevicesIndex({
    status,
    search,
    counts,
    devices,
    urls,
}: Props) {
    const shared = useDeviceAuth();
    const [query, setQuery] = useState(search);

    const go = (params: Record<string, string>) =>
        router.get(urls.index, params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });

    const submitSearch = (e: FormEvent) => {
        e.preventDefault();
        go({ status, ...(query.trim() ? { q: query.trim() } : {}) });
    };

    return (
        <div className="mx-auto grid w-full max-w-5xl gap-6 p-4 text-neutral-900 sm:p-6 dark:text-neutral-100">
            <Head title="Devices" />

            <header className="grid gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Devices
                </h1>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Only devices you approve here can open the app. Each
                    approved device holds its own key.
                </p>
            </header>

            {shared?.flash && <Notice tone="success">{shared.flash}</Notice>}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <nav
                    aria-label="Device status"
                    className="-mx-1 flex gap-1 overflow-x-auto"
                >
                    {TABS.map((tab) => {
                        const current = tab.status === status;

                        return (
                            <button
                                key={tab.status}
                                type="button"
                                aria-current={current ? 'page' : undefined}
                                onClick={() => go({ status: tab.status })}
                                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                                    current
                                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
                                }`}
                            >
                                {tab.label}
                                <span
                                    className={`rounded-full px-1.5 text-xs tabular-nums ${
                                        tab.status === 'pending' &&
                                        counts.pending > 0 &&
                                        !current
                                            ? 'bg-amber-200 text-amber-950 dark:bg-amber-900 dark:text-amber-100'
                                            : current
                                              ? 'bg-white/20'
                                              : 'bg-neutral-200 dark:bg-neutral-800'
                                    }`}
                                >
                                    {counts[tab.status] ?? 0}
                                </span>
                            </button>
                        );
                    })}
                </nav>

                <form
                    onSubmit={submitSearch}
                    role="search"
                    className="flex gap-2"
                >
                    <label htmlFor="device-search" className="sr-only">
                        Search devices
                    </label>
                    <input
                        id="device-search"
                        type="search"
                        className={`${inputClass} sm:w-56`}
                        placeholder="Name, reference or IP"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <Button type="submit" variant="secondary">
                        Search
                    </Button>
                </form>
            </div>

            {devices.data.length === 0 ? (
                <div className="rounded-lg border border-dashed border-neutral-300 px-6 py-12 text-center text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
                    {search ? `No devices match “${search}”.` : EMPTY[status]}
                </div>
            ) : (
                <ul className="divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
                    {devices.data.map((device) => (
                        <li key={device.id}>
                            <Link
                                href={`${urls.index}/${device.id}`}
                                className="grid gap-1 px-4 py-3 transition-colors hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:outline-none sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4 dark:hover:bg-neutral-800/60 dark:focus-visible:bg-neutral-800/60"
                            >
                                <div className="min-w-0">
                                    <p className="flex items-baseline gap-2">
                                        <span className="truncate font-medium">
                                            {device.name}
                                        </span>
                                        <span className="shrink-0 text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
                                            {device.reference}
                                        </span>
                                    </p>
                                    <p className="truncate text-sm text-neutral-600 dark:text-neutral-400">
                                        {describeDevice(device)}
                                        {device.requester &&
                                            `, requested by ${device.requester.name}`}
                                    </p>
                                </div>
                                <div className="text-sm text-neutral-500 sm:text-right dark:text-neutral-400">
                                    <p className="tabular-nums">
                                        {device.request_ip ?? 'No IP'}
                                    </p>
                                    <p>
                                        {status === 'active'
                                            ? `Last used ${timeAgo(device.last_seen_at)}`
                                            : `Requested ${timeAgo(device.created_at)}`}
                                    </p>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            {devices.last_page > 1 && (
                <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
                    <span className="tabular-nums">
                        {devices.from}–{devices.to} of {devices.total}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            disabled={!devices.prev_page_url}
                            onClick={() =>
                                devices.prev_page_url &&
                                router.visit(devices.prev_page_url, {
                                    preserveScroll: true,
                                })
                            }
                        >
                            Previous
                        </Button>
                        <Button
                            variant="secondary"
                            disabled={!devices.next_page_url}
                            onClick={() =>
                                devices.next_page_url &&
                                router.visit(devices.next_page_url, {
                                    preserveScroll: true,
                                })
                            }
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
