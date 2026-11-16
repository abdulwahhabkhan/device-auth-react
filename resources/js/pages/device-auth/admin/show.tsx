import { Head, Link, router } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import { useDeviceConfirmation } from '../../../device-auth/components/confirms-device';
import { DeviceConfirmPrompt } from '../../../device-auth/components/device-confirm-prompt';
import { Dialog } from '../../../device-auth/components/dialog';
import { ChevronLeftIcon } from '../../../device-auth/components/icons';
import {
    Button,
    Field,
    inputClass,
    Notice,
    StatusBadge,
} from '../../../device-auth/components/ui';
import {
    deviceTypeLabel,
    formatDateTime,
    timeAgo,
} from '../../../device-auth/lib/format';
import { useDeviceAuth } from '../../../device-auth/lib/use-device-auth';
import type {
    AdminDeviceDetails,
    DeviceLoginEntry,
} from '../../../device-auth/types';

interface Props {
    device: AdminDeviceDetails;
    logins: DeviceLoginEntry[];
    urls: { index: string; approve: string; reject: string; revoke: string };
}

type Action = 'approve' | 'reject' | 'revoke';

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="grid gap-3">
            <h2 className="text-base font-semibold">{title}</h2>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
                {children}
            </dl>
        </section>
    );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
    return (
        <>
            <dt className="text-neutral-500 dark:text-neutral-400">{label}</dt>
            <dd className="min-w-0 break-words text-neutral-900 dark:text-neutral-100">
                {children || (
                    <span className="text-neutral-400">Not recorded</span>
                )}
            </dd>
        </>
    );
}

export default function DeviceShow({ device, logins, urls }: Props) {
    const shared = useDeviceAuth();
    const { confirm, dialog: confirmDialog } = useDeviceConfirmation();
    const [action, setAction] = useState<Action | null>(null);
    const [form, setForm] = useState({ name: device.name, review_note: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState(false);

    const meta = device.client_meta ?? {};

    // The admin re-confirms their own device before deciding (server enforces it too).
    const open = async (next: Action) => {
        if (await confirm()) {
            setErrors({});
            setForm({ name: device.name, review_note: '' });
            setAction(next);
        }
    };

    const submit = () => {
        if (!action) {
            return;
        }

        setBusy(true);
        router.post(
            urls[action],
            action === 'approve' ? form : { review_note: form.review_note },
            {
                preserveScroll: true,
                onSuccess: () => setAction(null),
                onError: (e) => {
                    setErrors(e);

                    // A state conflict (e.g. someone else already reviewed it) isn't
                    // about this form: close the dialog and show it on the page.
                    if (e.device) {
                        setAction(null);
                    }
                },
                onFinish: () => setBusy(false),
            },
        );
    };

    const keyFacts = (
        <dl className="grid grid-cols-[7rem_1fr] gap-y-1.5 rounded-md bg-neutral-50 p-3 text-sm dark:bg-neutral-950">
            <dt className="text-neutral-500 dark:text-neutral-400">
                Requested by
            </dt>
            <dd>
                {device.requester
                    ? `${device.requester.name}${device.requester.email ? ` (${device.requester.email})` : ''}`
                    : 'Unknown'}
            </dd>
            <dt className="text-neutral-500 dark:text-neutral-400">Device</dt>
            <dd>
                {[
                    deviceTypeLabel(device.device_type),
                    device.os,
                    device.browser,
                ]
                    .filter(Boolean)
                    .join(', ')}
            </dd>
            <dt className="text-neutral-500 dark:text-neutral-400">
                IP address
            </dt>
            <dd className="tabular-nums">
                {device.request_ip ?? 'Not recorded'}
            </dd>
            <dt className="text-neutral-500 dark:text-neutral-400">
                Requested
            </dt>
            <dd>{formatDateTime(device.created_at)}</dd>
            <dt className="text-neutral-500 dark:text-neutral-400">Key</dt>
            <dd>
                {device.authenticator ?? 'Unknown authenticator'},{' '}
                {device.backup_eligible
                    ? 'synced'
                    : 'stored on this device only'}
            </dd>
        </dl>
    );

    const syncedWarning = device.backup_eligible ? (
        <Notice tone="warning">
            This key is synced through a password manager (for example iCloud or
            Google). Other devices signed in to the same account may be able to
            use it.
        </Notice>
    ) : null;

    return (
        <div className="mx-auto grid w-full max-w-3xl gap-8 p-4 text-neutral-900 sm:p-6 dark:text-neutral-100">
            <Head title={`${device.name} (${device.reference})`} />

            <div className="grid gap-4">
                <Link
                    href={urls.index}
                    className="inline-flex w-fit items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                    <ChevronLeftIcon className="size-4" />
                    All devices
                </Link>

                <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="grid gap-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                {device.name}
                            </h1>
                            <StatusBadge status={device.status} />
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Reference{' '}
                            <span className="font-medium text-neutral-900 tabular-nums dark:text-neutral-100">
                                {device.reference}
                            </span>
                            {device.is_current &&
                                ', the device you’re using now'}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {device.status === 'pending' && (
                            <>
                                <Button
                                    variant="secondary"
                                    onClick={() => open('reject')}
                                >
                                    Reject
                                </Button>
                                <Button onClick={() => open('approve')}>
                                    Approve
                                </Button>
                            </>
                        )}
                        {(device.status === 'rejected' ||
                            device.status === 'revoked') && (
                            <Button onClick={() => open('approve')}>
                                Approve
                            </Button>
                        )}
                        {device.status === 'active' && (
                            <Button
                                variant="danger"
                                onClick={() => open('revoke')}
                                disabled={device.is_current}
                                title={
                                    device.is_current
                                        ? 'Revoke it from another approved device'
                                        : undefined
                                }
                            >
                                Revoke
                            </Button>
                        )}
                    </div>
                </header>

                {shared?.flash && (
                    <Notice tone="success">{shared.flash}</Notice>
                )}
                {errors.device && <Notice tone="error">{errors.device}</Notice>}
                <DeviceConfirmPrompt />
                {device.status === 'pending' && syncedWarning}
            </div>

            <Section title="Request">
                <Row label="Requested by">
                    {device.requester && (
                        <>
                            {device.requester.name}
                            {device.requester.email && (
                                <span className="text-neutral-500 dark:text-neutral-400">
                                    {' '}
                                    ({device.requester.email})
                                </span>
                            )}
                        </>
                    )}
                </Row>
                <Row label="Requested">
                    {device.created_at &&
                        `${formatDateTime(device.created_at)} (${timeAgo(device.created_at)})`}
                </Row>
                <Row label="Reason">{device.request_note}</Row>
            </Section>

            <Section title="Device">
                <Row label="Type">{deviceTypeLabel(device.device_type)}</Row>
                <Row label="Operating system">{device.os}</Row>
                <Row label="Browser">{device.browser}</Row>
                <Row label="Model">{device.device_model ?? meta.model}</Row>
                <Row label="Screen">{meta.screen}</Row>
                <Row label="Time zone">{meta.timezone}</Row>
                <Row label="Language">{meta.language}</Row>
                <Row label="User agent">
                    {device.user_agent && (
                        <span className="text-xs text-neutral-600 dark:text-neutral-400">
                            {device.user_agent}
                        </span>
                    )}
                </Row>
            </Section>

            <Section title="Network">
                <Row label="Request IP">
                    {device.request_ip && (
                        <span className="tabular-nums">
                            {device.request_ip}
                        </span>
                    )}
                </Row>
                <Row label="Last IP">
                    {device.last_ip && (
                        <span className="tabular-nums">{device.last_ip}</span>
                    )}
                </Row>
                <Row label="Last used">
                    {device.last_seen_at
                        ? `${formatDateTime(device.last_seen_at)} (${timeAgo(device.last_seen_at)})`
                        : 'Never'}
                </Row>
            </Section>

            <Section title="Key">
                <Row label="Stored in">
                    {device.authenticator ?? 'Unknown authenticator'}
                </Row>
                <Row label="Sync">
                    {device.backup_eligible
                        ? 'Synced through a password manager'
                        : 'Stays on this device'}
                </Row>
            </Section>

            {device.reviewed_at && (
                <Section title="Review">
                    <Row label="Decision">
                        <StatusBadge status={device.status} />
                    </Row>
                    <Row label="By">
                        {device.reviewer?.name ?? 'Command line'}
                    </Row>
                    <Row label="On">{formatDateTime(device.reviewed_at)}</Row>
                    <Row label="Note">{device.review_note}</Row>
                </Section>
            )}

            <section className="grid gap-3">
                <h2 className="text-base font-semibold">Recent use</h2>
                {logins.length === 0 ? (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        This device hasn’t been used yet.
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-50 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
                                <tr>
                                    <th className="px-3 py-2 font-medium">
                                        When
                                    </th>
                                    <th className="px-3 py-2 font-medium">
                                        User
                                    </th>
                                    <th className="px-3 py-2 font-medium">
                                        Action
                                    </th>
                                    <th className="px-3 py-2 font-medium">
                                        IP
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                {logins.map((login) => (
                                    <tr key={login.id}>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            {formatDateTime(login.created_at)}
                                        </td>
                                        <td className="px-3 py-2">
                                            {login.user?.name ?? 'Deleted user'}
                                        </td>
                                        <td className="px-3 py-2">
                                            {login.purpose === 'verify'
                                                ? 'Signed in'
                                                : 'Confirmed'}
                                        </td>
                                        <td className="px-3 py-2 tabular-nums">
                                            {login.ip}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {confirmDialog}

            <Dialog
                open={action === 'approve'}
                onClose={() => setAction(null)}
                title={`Approve ${device.reference}?`}
                description="This device will be able to open the app right away."
            >
                {keyFacts}
                {syncedWarning}
                <Field
                    label="Device name"
                    htmlFor="approve-name"
                    error={errors.name}
                >
                    <input
                        id="approve-name"
                        className={inputClass}
                        value={form.name}
                        maxLength={100}
                        onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                        }
                    />
                </Field>
                <Field
                    label="Note (optional)"
                    htmlFor="approve-note"
                    error={errors.review_note}
                >
                    <textarea
                        id="approve-note"
                        className={`${inputClass} min-h-16`}
                        value={form.review_note}
                        maxLength={500}
                        onChange={(e) =>
                            setForm({ ...form, review_note: e.target.value })
                        }
                    />
                </Field>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                        variant="secondary"
                        onClick={() => setAction(null)}
                        disabled={busy}
                    >
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={busy}>
                        {busy ? 'Approving…' : 'Approve device'}
                    </Button>
                </div>
            </Dialog>

            <Dialog
                open={action === 'reject'}
                onClose={() => setAction(null)}
                title={`Reject ${device.reference}?`}
                description="The person who asked will see your reason on their device."
            >
                {keyFacts}
                <Field
                    label="Reason"
                    htmlFor="reject-note"
                    error={errors.review_note}
                >
                    <textarea
                        id="reject-note"
                        className={`${inputClass} min-h-20`}
                        value={form.review_note}
                        maxLength={500}
                        required
                        autoFocus
                        onChange={(e) =>
                            setForm({ ...form, review_note: e.target.value })
                        }
                    />
                </Field>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                        variant="secondary"
                        onClick={() => setAction(null)}
                        disabled={busy}
                    >
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={submit} disabled={busy}>
                        {busy ? 'Rejecting…' : 'Reject request'}
                    </Button>
                </div>
            </Dialog>

            <Dialog
                open={action === 'revoke'}
                onClose={() => setAction(null)}
                title={`Revoke ${device.name}?`}
                description="Anyone using this device is signed out on their next click, and the device can’t open the app until it’s approved again."
            >
                <Field
                    label="Reason (optional)"
                    htmlFor="revoke-note"
                    hint="Shown on the device."
                    error={errors.review_note}
                >
                    <textarea
                        id="revoke-note"
                        className={`${inputClass} min-h-20`}
                        value={form.review_note}
                        maxLength={500}
                        autoFocus
                        onChange={(e) =>
                            setForm({ ...form, review_note: e.target.value })
                        }
                    />
                </Field>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                        variant="secondary"
                        onClick={() => setAction(null)}
                        disabled={busy}
                    >
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={submit} disabled={busy}>
                        {busy ? 'Revoking…' : 'Revoke device'}
                    </Button>
                </div>
            </Dialog>
        </div>
    );
}
