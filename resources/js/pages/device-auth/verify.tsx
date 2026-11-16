import { Head, router } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import { DeviceShell } from '../../device-auth/components/device-shell';
import {
    Button,
    Field,
    inputClass,
    Notice,
} from '../../device-auth/components/ui';
import {
    collectClientMeta,
    suggestDeviceName,
} from '../../device-auth/lib/client-meta';
import { formatDateTime } from '../../device-auth/lib/format';
import { DeviceAuthRequestError, sendJson } from '../../device-auth/lib/http';
import {
    createDeviceKey,
    keyErrorKind,
    signWithDeviceKey,
    supportProblem,
    type CreationOptionsJSON,
    type RequestOptionsJSON,
} from '../../device-auth/lib/webauthn';
import type { DevicePublicSummary, DeviceUser } from '../../device-auth/types';

interface Props {
    user: DeviceUser | null;
    contact: string | null;
    urls: {
        verifyOptions: string;
        verify: string;
        requestOptions: string;
        request: string;
        logout: string | null;
    };
}

type Phase =
    | 'idle'
    | 'verifying'
    | 'not_found'
    | 'request'
    | 'requesting'
    | 'pending'
    | 'rejected'
    | 'revoked'
    | 'mismatch';

interface DeviceAnswer {
    status: string;
    redirect?: string;
    device?: DevicePublicSummary;
    contact?: string | null;
    message?: string;
}

export default function Verify({ user, contact: initialContact, urls }: Props) {
    const problem = supportProblem();
    const [phase, setPhase] = useState<Phase>('idle');
    const [device, setDevice] = useState<DevicePublicSummary | null>(null);
    const [contact, setContact] = useState<string | null>(initialContact);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({ name: suggestDeviceName(), note: '' });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    /** Turn a server answer (success or a 4xx body) into the next screen. */
    const handleAnswer = (answer: DeviceAnswer) => {
        if (answer.status === 'active' && answer.redirect) {
            router.visit(answer.redirect);

            return;
        }

        if (answer.device) {
            setDevice(answer.device);
        }

        if (answer.contact !== undefined) {
            setContact(answer.contact);
        }

        switch (answer.status) {
            case 'pending':
            case 'rejected':
            case 'revoked':
            case 'mismatch':
                setPhase(answer.status);
                break;
            case 'not_registered':
                setPhase('not_found');
                break;
            default:
                setError(answer.message ?? 'Something went wrong. Try again.');
                setPhase('idle');
        }
    };

    const verify = async () => {
        setPhase('verifying');
        setError(null);

        try {
            const options = await sendJson<RequestOptionsJSON>(
                'POST',
                urls.verifyOptions,
            );
            const signed = await signWithDeviceKey(options);

            handleAnswer(
                await sendJson<DeviceAnswer>('POST', urls.verify, signed),
            );
        } catch (e) {
            if (e instanceof DeviceAuthRequestError && e.reason) {
                handleAnswer({
                    ...(e.data as Partial<DeviceAnswer>),
                    status: e.reason,
                    message: e.message,
                });
            } else if (keyErrorKind(e) === 'cancelled') {
                // No key for this site on this device, or the prompt was closed.
                setPhase('not_found');
            } else {
                setError(
                    e instanceof Error
                        ? e.message
                        : 'This device couldn’t be verified.',
                );
                setPhase('idle');
            }
        }
    };

    const requestAccess = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setFieldErrors({});

        if (!form.name.trim()) {
            setFieldErrors({
                name: 'Give this device a name, like “Reception PC”.',
            });

            return;
        }

        setPhase('requesting');

        try {
            const options = await sendJson<CreationOptionsJSON>(
                'POST',
                urls.requestOptions,
                { name: form.name },
            );
            const credential = await createDeviceKey(options);
            const client = await collectClientMeta();

            handleAnswer(
                await sendJson<DeviceAnswer>('POST', urls.request, {
                    name: form.name,
                    note: form.note || null,
                    client,
                    credential,
                }),
            );
        } catch (err) {
            setPhase('request');

            if (err instanceof DeviceAuthRequestError) {
                const errors = (err.data.errors ?? {}) as Record<
                    string,
                    string[]
                >;

                setFieldErrors(
                    Object.fromEntries(
                        Object.entries(errors).map(([k, v]) => [k, v[0] ?? '']),
                    ),
                );
                setError(Object.keys(errors).length ? null : err.message);
            } else if (keyErrorKind(err) === 'cancelled') {
                setError(
                    'The device prompt was closed, so no key was created. Send the request again when you’re ready.',
                );
            } else if (keyErrorKind(err) === 'exists') {
                setError(
                    'This device already has a key for this app. Go back and choose Verify device.',
                );
            } else {
                setError(
                    'This device couldn’t create a key. Check that it has a screen lock (PIN, fingerprint or face) set up.',
                );
            }
        }
    };

    const signOut = urls.logout ? (
        <button
            type="button"
            onClick={() => router.post(urls.logout as string)}
            className="underline underline-offset-4 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
            Sign out
        </button>
    ) : null;

    const footer = (
        <>
            {user && <span>Signed in as {user.email ?? user.name}. </span>}
            {signOut}
        </>
    );

    const contactLine = contact ? (
        <p>
            Contact:{' '}
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {contact}
            </span>
        </p>
    ) : null;

    if (problem) {
        return (
            <DeviceShell
                state="problem"
                title={
                    problem === 'insecure'
                        ? 'This page needs a secure connection'
                        : 'This browser can’t use device keys'
                }
                footer={footer}
            >
                <Head title="Verify device" />
                <p>
                    {problem === 'insecure'
                        ? 'Device keys only work over https. Open the app using its https address.'
                        : 'Use an up-to-date Chrome, Edge, Safari or Firefox on a device with a screen lock (PIN, fingerprint or face).'}
                </p>
            </DeviceShell>
        );
    }

    if (phase === 'request' || phase === 'requesting') {
        return (
            <DeviceShell
                state={phase === 'requesting' ? 'waiting' : 'idle'}
                title="Request access for this device"
                footer={footer}
            >
                <Head title="Request device access" />
                <p>
                    This creates a key that stays on this device. An
                    administrator reviews the request; once approved, this
                    device can open the app.
                </p>
                <form
                    onSubmit={requestAccess}
                    className="grid gap-4"
                    noValidate
                >
                    <Field
                        label="Device name"
                        htmlFor="device-name"
                        hint="How the administrator will recognise it."
                        error={fieldErrors.name}
                    >
                        <input
                            id="device-name"
                            className={inputClass}
                            value={form.name}
                            maxLength={100}
                            required
                            autoFocus
                            placeholder="Reception PC"
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                        />
                    </Field>
                    <Field
                        label="Reason (optional)"
                        htmlFor="device-note"
                        error={fieldErrors.note}
                    >
                        <textarea
                            id="device-note"
                            className={`${inputClass} min-h-20`}
                            value={form.note}
                            maxLength={500}
                            placeholder="New laptop for the front desk"
                            onChange={(e) =>
                                setForm({ ...form, note: e.target.value })
                            }
                        />
                    </Field>
                    {error && <Notice tone="error">{error}</Notice>}
                    <div className="flex flex-col gap-2">
                        <Button type="submit" disabled={phase === 'requesting'}>
                            {phase === 'requesting'
                                ? 'Waiting for device…'
                                : 'Send request'}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setPhase('idle')}
                            disabled={phase === 'requesting'}
                        >
                            Back
                        </Button>
                    </div>
                </form>
            </DeviceShell>
        );
    }

    if (phase === 'pending' && device) {
        return (
            <DeviceShell
                state="pending"
                title="Waiting for approval"
                footer={footer}
            >
                <Head title="Waiting for approval" />
                <p>
                    The request for{' '}
                    <strong className="font-medium text-neutral-900 dark:text-neutral-100">
                        {device.name}
                    </strong>{' '}
                    was sent on {formatDateTime(device.requested_at)}. Ask your
                    administrator to approve it and give them this reference:
                </p>
                <p className="rounded-md border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-center text-2xl font-semibold tracking-wide text-amber-950 tabular-nums dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                    {device.reference}
                </p>
                {contactLine}
                <Button variant="secondary" onClick={verify}>
                    Check again
                </Button>
            </DeviceShell>
        );
    }

    if ((phase === 'rejected' || phase === 'revoked') && device) {
        return (
            <DeviceShell
                state="blocked"
                title={
                    phase === 'rejected' ? 'Request rejected' : 'Access removed'
                }
                footer={footer}
            >
                <Head
                    title={
                        phase === 'rejected'
                            ? 'Request rejected'
                            : 'Access removed'
                    }
                />
                <p>
                    {phase === 'rejected'
                        ? `The request for ${device.name} (${device.reference}) was rejected.`
                        : `${device.name} (${device.reference}) can no longer open this app.`}
                </p>
                {device.review_note && (
                    <Notice tone="neutral">Reason: {device.review_note}</Notice>
                )}
                <p>
                    Contact your administrator if you need access from this
                    device.
                </p>
                {contactLine}
                {phase === 'rejected' && (
                    <Button
                        variant="secondary"
                        onClick={() => setPhase('request')}
                    >
                        Request again
                    </Button>
                )}
            </DeviceShell>
        );
    }

    if (phase === 'mismatch') {
        return (
            <DeviceShell
                state="problem"
                title="This key belongs to another device"
                footer={footer}
            >
                <Head title="Verify device" />
                <p>
                    The key you chose was approved for a different device. Each
                    device needs its own approval.
                </p>
                <div className="flex flex-col gap-2">
                    <Button onClick={() => setPhase('request')}>
                        Request access for this device
                    </Button>
                    <Button variant="secondary" onClick={verify}>
                        Try another key
                    </Button>
                </div>
            </DeviceShell>
        );
    }

    if (phase === 'not_found') {
        return (
            <DeviceShell
                state="unknown"
                title="No approved key found"
                footer={footer}
            >
                <Head title="Verify device" />
                <p>
                    Either this device doesn’t have a key for this app yet, or
                    the device prompt was closed.
                </p>
                <div className="flex flex-col gap-2">
                    <Button onClick={() => setPhase('request')}>
                        Request access for this device
                    </Button>
                    <Button variant="secondary" onClick={verify}>
                        Try again
                    </Button>
                </div>
            </DeviceShell>
        );
    }

    return (
        <DeviceShell
            state={phase === 'verifying' ? 'waiting' : 'idle'}
            title="Verify this device"
            footer={footer}
        >
            <Head title="Verify device" />
            <p>
                Only approved devices can open this app. Confirm this one with
                its fingerprint, face or screen lock.
            </p>
            {error && <Notice tone="error">{error}</Notice>}
            <div className="flex flex-col gap-2">
                <Button
                    onClick={verify}
                    disabled={phase === 'verifying'}
                    autoFocus
                >
                    {phase === 'verifying'
                        ? 'Waiting for device…'
                        : 'Verify device'}
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => setPhase('request')}
                    disabled={phase === 'verifying'}
                >
                    New device? Request access
                </Button>
            </div>
        </DeviceShell>
    );
}
