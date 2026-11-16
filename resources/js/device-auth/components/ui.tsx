import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { DeviceStatus } from '../types';

/*
 * Small building blocks styled with plain Tailwind utilities (neutral
 * palette + dark: variants) so the pages work in any Tailwind app.
 */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
};

const VARIANTS = {
    primary:
        'bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300',
    secondary:
        'border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800',
    danger: 'bg-rose-700 text-white hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500',
    ghost: 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800',
};

export function Button({
    variant = 'primary',
    className = '',
    type = 'button',
    ...props
}: ButtonProps) {
    return (
        <button
            type={type}
            className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:outline-neutral-100 ${VARIANTS[variant]} ${className}`}
            {...props}
        />
    );
}

export function Field({
    label,
    hint,
    error,
    htmlFor,
    children,
}: {
    label: string;
    hint?: string;
    error?: string | null;
    htmlFor: string;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-1.5">
            <label
                htmlFor={htmlFor}
                className="text-sm font-medium text-neutral-900 dark:text-neutral-100"
            >
                {label}
            </label>
            {children}
            {hint && !error && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {hint}
                </p>
            )}
            {error && (
                <p className="text-xs text-rose-700 dark:text-rose-400">
                    {error}
                </p>
            )}
        </div>
    );
}

export const inputClass =
    'w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-100 dark:focus:ring-neutral-100';

export function Notice({
    tone = 'neutral',
    children,
}: {
    tone?: 'neutral' | 'warning' | 'error' | 'success';
    children: ReactNode;
}) {
    const tones = {
        neutral:
            'border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300',
        warning:
            'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200',
        error: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200',
        success:
            'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200',
    };

    return (
        <div
            role={tone === 'error' ? 'alert' : 'status'}
            className={`rounded-md border px-3 py-2 text-sm ${tones[tone]}`}
        >
            {children}
        </div>
    );
}

const STATUS_STYLES: Record<
    DeviceStatus,
    { label: string; className: string }
> = {
    pending: {
        label: 'Waiting for approval',
        className:
            'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
    },
    active: {
        label: 'Approved',
        className:
            'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
    },
    rejected: {
        label: 'Rejected',
        className:
            'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200',
    },
    revoked: {
        label: 'Revoked',
        className:
            'bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200',
    },
};

export function StatusBadge({ status }: { status: string }) {
    const style =
        status in STATUS_STYLES
            ? STATUS_STYLES[status as DeviceStatus]
            : STATUS_STYLES.revoked;

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${style.className}`}
        >
            {style.label}
        </span>
    );
}
