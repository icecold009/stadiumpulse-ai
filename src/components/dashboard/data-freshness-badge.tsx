import { Clock3, CircleAlert, CircleCheck, CircleHelp } from "lucide-react";
import type { DataFreshness } from "@/lib/ops/types";

const stateConfig = {
    fresh: { label: "Fresh data", className: "text-status-ok border-status-ok/30 bg-status-ok/10", Icon: CircleCheck },
    stale: { label: "Stale data", className: "text-status-warn border-status-warn/35 bg-status-warn/10", Icon: CircleAlert },
    missing: { label: "Data unavailable", className: "text-status-critical border-status-critical/35 bg-status-critical/10", Icon: CircleHelp },
} as const;

export default function DataFreshnessBadge({ freshness }: { freshness: DataFreshness }) {
    const config = stateConfig[freshness.state];
    const Icon = config.Icon;
    const age = freshness.ageSeconds == null
        ? "No recent observation"
        : freshness.ageSeconds < 60
            ? "Updated less than a minute ago"
            : `Updated ${Math.floor(freshness.ageSeconds / 60)}m ago`;

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${config.className}`}>
            <Icon aria-hidden="true" className="h-3 w-3" />
            <span>{config.label}</span>
            <span className="sr-only">{age}</span>
            <Clock3 aria-hidden="true" className="ml-0.5 h-3 w-3 opacity-70" />
        </span>
    );
}
