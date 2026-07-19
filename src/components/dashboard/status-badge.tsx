import { CircleAlert, CircleCheckBig, TriangleAlert } from "lucide-react";

type Status = "ok" | "warn" | "critical";

type StatusBadgeProps = {
    status: Status;
    label?: string;
    className?: string;
};

const statusConfig: Record<
    Status,
    {
        icon: typeof CircleCheckBig;
        text: string;
        className: string;
        ariaLabel: string;
    }
> = {
    ok: {
        icon: CircleCheckBig,
        text: "OK",
        className: "border-status-ok/30 bg-status-ok/12 text-status-ok",
        ariaLabel: "Status OK",
    },
    warn: {
        icon: TriangleAlert,
        text: "Warn",
        className: "border-status-warn/30 bg-status-warn/12 text-status-warn",
        ariaLabel: "Status warning",
    },
    critical: {
        icon: CircleAlert,
        text: "Critical",
        className: "border-status-critical/30 bg-status-critical/12 text-[#ff9a9d]",
        ariaLabel: "Status critical",
    },
};

export default function StatusBadge({ status, label, className = "" }: StatusBadgeProps) {
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <span
            aria-label={label ?? config.ariaLabel}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${config.className} ${className}`}
        >
            <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <span>{label ?? config.text}</span>
        </span>
    );
}
