import type { ComponentType, ReactNode, SVGProps } from 'react';
import {
    AlertIcon,
    BlockIcon,
    CheckIcon,
    ClockIcon,
    KeyIcon,
    QuestionIcon,
} from './icons';

export type MarkState =
    | 'idle'
    | 'waiting'
    | 'pending'
    | 'approved'
    | 'blocked'
    | 'unknown'
    | 'problem';

const MARKS: Record<
    MarkState,
    { icon: ComponentType<SVGProps<SVGSVGElement>>; className: string }
> = {
    idle: {
        icon: KeyIcon,
        className:
            'bg-neutral-100 text-neutral-900 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:ring-neutral-700',
    },
    waiting: {
        icon: KeyIcon,
        className:
            'bg-neutral-900 text-white ring-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:ring-neutral-100',
    },
    pending: {
        icon: ClockIcon,
        className:
            'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900',
    },
    approved: {
        icon: CheckIcon,
        className:
            'bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900',
    },
    blocked: {
        icon: BlockIcon,
        className:
            'bg-rose-100 text-rose-800 ring-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-900',
    },
    unknown: {
        icon: QuestionIcon,
        className:
            'bg-neutral-100 text-neutral-700 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700',
    },
    problem: {
        icon: AlertIcon,
        className:
            'bg-rose-100 text-rose-800 ring-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-900',
    },
};

/**
 * The key "slot": one mark whose shape and colour say where the device
 * stands. While the browser prompt is open it pulses (unless the user
 * prefers reduced motion).
 */
export function StatusMark({ state }: { state: MarkState }) {
    const { icon: Icon, className } = MARKS[state];

    return (
        <div className="relative size-14">
            {state === 'waiting' && (
                <span
                    className="absolute inset-0 rounded-2xl bg-neutral-900/20 motion-safe:animate-ping dark:bg-neutral-100/20"
                    aria-hidden="true"
                />
            )}
            <div
                className={`relative flex size-14 items-center justify-center rounded-2xl ring-1 ${className}`}
            >
                <Icon className="size-7" />
            </div>
        </div>
    );
}

/**
 * Full-screen frame for the device screens. It doesn't depend on any app
 * layout, because the user hasn't been let into the app yet.
 */
export function DeviceShell({
    state,
    title,
    children,
    footer,
}: {
    state: MarkState;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
}) {
    return (
        <div className="flex min-h-svh flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
            <main className="flex flex-1 items-center justify-center px-4 py-12">
                <div className="w-full max-w-sm">
                    <StatusMark state={state} />
                    <h1
                        className="mt-6 text-2xl font-semibold tracking-tight text-balance"
                        aria-live="polite"
                    >
                        {title}
                    </h1>
                    <div className="mt-3 grid gap-5 text-[0.9375rem] leading-relaxed text-neutral-600 dark:text-neutral-400">
                        {children}
                    </div>
                </div>
            </main>
            {footer && (
                <footer className="px-4 pb-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                    {footer}
                </footer>
            )}
        </div>
    );
}
