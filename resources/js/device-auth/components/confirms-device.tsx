import { useCallback, useRef, useState, type ReactNode } from 'react';
import { DeviceAuthRequestError, sendJson } from '../lib/http';
import { useDeviceAuth } from '../lib/use-device-auth';
import {
    keyErrorKind,
    signWithDeviceKey,
    type RequestOptionsJSON,
} from '../lib/webauthn';
import { Dialog } from './dialog';
import { Button, Notice } from './ui';

interface ConfirmCopy {
    title?: string;
    description?: ReactNode;
}

/**
 * Ask the current device to confirm (fingerprint, face or PIN) before a
 * sensitive action, unless it was confirmed in the last few minutes.
 *
 *   const { confirm, dialog } = useDeviceConfirmation();
 *   const ok = await confirm();   // render {dialog} somewhere
 */
export function useDeviceConfirmation(copy: ConfirmCopy = {}) {
    const shared = useDeviceAuth();
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const resolver = useRef<((ok: boolean) => void) | null>(null);

    const finish = useCallback((ok: boolean) => {
        setOpen(false);
        setBusy(false);
        resolver.current?.(ok);
        resolver.current = null;
    }, []);

    const confirm = useCallback(async (): Promise<boolean> => {
        const urls = shared?.urls;

        // Device auth off, or routes not available: nothing to confirm.
        if (!shared?.enabled || !urls?.confirmStatus) {
            return true;
        }

        try {
            const status = await sendJson<{ confirmed: boolean }>(
                'GET',
                urls.confirmStatus,
            );

            if (status.confirmed) {
                return true;
            }
        } catch {
            // fall through to the dialog
        }

        setError(null);
        setOpen(true);

        return new Promise<boolean>((resolve) => {
            resolver.current = resolve;
        });
    }, [shared]);

    const run = async () => {
        const urls = shared?.urls;

        if (!urls?.confirmOptions || !urls.confirm) {
            return;
        }

        setBusy(true);
        setError(null);

        try {
            const options = await sendJson<RequestOptionsJSON>(
                'POST',
                urls.confirmOptions,
            );
            const signed = await signWithDeviceKey(options);

            await sendJson('POST', urls.confirm, signed);
            finish(true);
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

    const dialog = (
        <Dialog
            open={open}
            onClose={() => finish(false)}
            title={copy.title ?? 'Confirm this device'}
            description={
                copy.description ?? (
                    <>
                        Use the fingerprint, face or screen lock of{' '}
                        <strong className="font-medium text-neutral-900 dark:text-neutral-100">
                            {shared?.device?.name ?? 'this device'}
                        </strong>{' '}
                        to continue.
                    </>
                )
            }
        >
            {error && <Notice tone="error">{error}</Notice>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                    variant="secondary"
                    onClick={() => finish(false)}
                    disabled={busy}
                >
                    Cancel
                </Button>
                <Button onClick={run} disabled={busy} autoFocus>
                    {busy ? 'Waiting for device…' : 'Confirm device'}
                </Button>
            </div>
        </Dialog>
    );

    return { confirm, dialog };
}

/**
 * Wrap a button: clicking it confirms the device first, then runs onConfirmed.
 *
 *   <ConfirmsDevice onConfirmed={() => router.delete(url)}>
 *       <button>Delete</button>
 *   </ConfirmsDevice>
 */
export function ConfirmsDevice({
    onConfirmed,
    children,
    ...copy
}: ConfirmCopy & { onConfirmed: () => void; children: ReactNode }) {
    const { confirm, dialog } = useDeviceConfirmation(copy);

    return (
        <>
            <span
                className="contents"
                onClick={async (e) => {
                    e.preventDefault();

                    if (await confirm()) {
                        onConfirmed();
                    }
                }}
            >
                {children}
            </span>
            {dialog}
        </>
    );
}
