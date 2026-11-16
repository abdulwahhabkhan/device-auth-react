import { useEffect, useState } from 'react';
import { useDeviceAuth } from '../lib/use-device-auth';
import { useDeviceConfirmation } from './confirms-device';
import { Notice } from './ui';

/**
 * Safety net for actions that weren't wrapped in <ConfirmsDevice>: when the
 * server bounced one with "confirm required", open the dialog, then ask
 * the user to repeat the action. Mount once in a layout or page.
 */
export function DeviceConfirmPrompt() {
    const shared = useDeviceAuth();
    const { confirm, dialog } = useDeviceConfirmation({
        description:
            'This action needs a fresh confirmation from this device. After confirming, do it again.',
    });
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (shared?.confirmRequired) {
            setDone(false);
            void confirm().then((ok) => setDone(ok));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shared?.confirmRequired]);

    return (
        <>
            {done && (
                <Notice tone="success">
                    Device confirmed. Repeat the action to finish it.
                </Notice>
            )}
            {dialog}
        </>
    );
}
