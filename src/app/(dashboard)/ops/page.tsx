import OpsCommandCenter from "@/components/dashboard/ops-command-center";
import { loadOpsSnapshot } from "@/lib/ops/load-snapshot";
import { PageHeader } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function OpsPage({ searchParams }: { searchParams: Promise<{ venueId?: string }> }) {
    const params = await searchParams;
    const result = await loadOpsSnapshot(params.venueId);

    if (!result.ok) {
        return (
            <section className="space-y-3">
                <PageHeader eyebrow="Venue command center" title="Operations" />
                <p className="text-sm text-status-critical">{result.error}</p>
            </section>
        );
    }

    return <OpsCommandCenter initialSnapshot={result.snapshot} />;
}
