import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { DeviceShell } from '../../device-auth/components/device-shell';
import { Button, Notice } from '../../device-auth/components/ui';
import { DeviceAuthRequestError, sendJson } from '../../device-auth/lib/http';
import {
    keyErrorKind,
    signWithDeviceKey,
    type RequestOptionsJSON,
} from '../../device-auth/lib/webauthn';

interface Props {
    device: { name: string; reference: string } | null;
    urls: { options: string; confirm: string };
}

/** Full-page confirmation, used when a protected page is opened directly. */
export default function Confirm({ device, urls }: Props) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const confirm = async () => {
        setBusy(true);
        setError(null);

        try {
            const options = await sendJson<RequestOptionsJSON>(
                'POST',
                urls.options,
            );
            const signed = await signWithDeviceKey(options);
            const result = await sendJson<{ redirect: string | null }>(
                'POST',
                urls.confirm,
                { ...signed, page: true },
            );

            router.visit(result.redirect ?? '/');
        } catch (e) {
            setBusy(false);

            if (keyErrorKind(e) === 'cancelled') {
                setError(
                    'The device prompt was closed. Choose Confirm device to try again.',
                );
            } else if (e instanceof DeviceAuthRequestError) {
                setError(e.message);
            } else {
                setError('This device couldn’t be confirmed. Try again.');
            }
        }
    };

    return (
        <DeviceShell
            state={busy ? 'waiting' : 'idle'}
            title="Confirm this device"
        >
            <Head title="Confirm device" />
            <p>
                This page needs a fresh confirmation. Use the fingerprint, face
                or screen lock of{' '}
                <strong className="font-medium text-neutral-900 dark:text-neutral-100">
                    {device?.name ?? 'this device'}
                </strong>
                .
            </p>
            {error && <Notice tone="error">{error}</Notice>}
            <div className="flex flex-col gap-2">
                <Button onClick={confirm} disabled={busy} autoFocus>
                    {busy ? 'Waiting for device…' : 'Confirm device'}
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => window.history.back()}
                    disabled={busy}
                >
                    Go back
                </Button>
            </div>
        </DeviceShell>
    );
}
