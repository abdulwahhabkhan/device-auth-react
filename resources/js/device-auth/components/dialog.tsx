import { useEffect, useId, useRef, type ReactNode } from 'react';

/**
 * Modal built on the native <dialog> element: focus trapping, Escape to
 * close and the backdrop come from the browser.
 */
export function Dialog({
    open,
    onClose,
    title,
    description,
    children,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: ReactNode;
    children: ReactNode;
}) {
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = ref.current;

        if (!dialog) {
            return;
        }

        if (open && !dialog.open) {
            dialog.showModal();
        } else if (!open && dialog.open) {
            dialog.close();
        }
    }, [open]);

    return (
        <dialog
            ref={ref}
            aria-labelledby={titleId}
            onClose={onClose}
            onClick={(e) => {
                if (e.target === ref.current) {
                    onClose();
                }
            }}
            className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-neutral-200 bg-white p-0 text-neutral-900 shadow-xl backdrop:bg-neutral-950/50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
        >
            {open && (
                <div className="grid gap-4 p-6">
                    <div className="grid gap-1.5">
                        <h2 id={titleId} className="text-lg font-semibold">
                            {title}
                        </h2>
                        {description && (
                            <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                {description}
                            </div>
                        )}
                    </div>
                    {children}
                </div>
            )}
        </dialog>
    );
}
