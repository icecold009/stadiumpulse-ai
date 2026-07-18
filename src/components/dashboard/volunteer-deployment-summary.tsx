"use client";

import { useMemo, useState } from "react";
import EmptyState from "@/components/ui/empty-state";
import MetricGaugeGrid from "@/components/dashboard/metric-gauge-grid";
import { useRealtimeVolunteers } from "@/hooks/use-realtime-volunteers";
import type { Database } from "@/types/database";

type VolunteerRow = Database["public"]["Tables"]["volunteers"]["Row"];
type ZoneRow = Database["public"]["Tables"]["zones"]["Row"];

export default function VolunteerDeploymentSummary({
    initialVolunteers,
    zones,
}: {
    initialVolunteers: VolunteerRow[];
    zones: ZoneRow[];
}) {
    const volunteers = useRealtimeVolunteers(initialVolunteers);
    const [volunteerId, setVolunteerId] = useState(initialVolunteers[0]?.id ?? "");
    const [zoneId, setZoneId] = useState(initialVolunteers[0]?.zone_id ?? "");
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [feedbackIsError, setFeedbackIsError] = useState(false);

    const selectedVolunteer = volunteers.find((volunteer) => volunteer.id === volunteerId);
    const destinationZones = zones.filter(
        (zone) => !selectedVolunteer || zone.venue_id === selectedVolunteer.venue_id
    );

    async function handleReassignment(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!volunteerId || submitting) return;
        setSubmitting(true);
        setFeedback("");
        setFeedbackIsError(false);
        try {
            const response = await fetch(`/api/volunteers/${volunteerId}/reassign`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ zoneId: zoneId || null }),
            });
            const payload = (await response.json()) as { error?: string };
            if (!response.ok) {
                throw new Error(payload.error ?? "Volunteer reassignment failed.");
            }
            setFeedback(
                zoneId
                    ? "Volunteer reassignment recorded. Realtime will update the deployment view."
                    : "Volunteer returned to the available pool."
            );
        } catch (error) {
            setFeedbackIsError(true);
            setFeedback(
                error instanceof Error ? error.message : "Volunteer reassignment failed."
            );
        } finally {
            setSubmitting(false);
        }
    }

    const { gauges, assignments } = useMemo(() => {
        const assigned = volunteers.filter(
            (volunteer) => volunteer.status === "assigned"
        ).length;
        const available = volunteers.filter(
            (volunteer) => volunteer.status === "available"
        ).length;
        const zoneLabels = new Map(zones.map((zone) => [zone.id, zone.label]));

        const counts = new Map<string, number>();
        for (const volunteer of volunteers) {
            const label = volunteer.zone_id
                ? zoneLabels.get(volunteer.zone_id) ?? "Unknown zone"
                : "Unassigned pool";
            counts.set(label, (counts.get(label) ?? 0) + 1);
        }

        return {
            gauges: [
                {
                    label: "Assigned Volunteers",
                    value: assigned,
                    target: Math.max(volunteers.length, 1),
                    unit: "",
                },
                {
                    label: "Available Volunteers",
                    value: available,
                    target: Math.max(volunteers.length, 1),
                    unit: "",
                },
            ],
            assignments: Array.from(counts.entries()).sort((a, b) =>
                a[0].localeCompare(b[0])
            ),
        };
    }, [volunteers, zones]);

    if (volunteers.length === 0) {
        return (
            <EmptyState
                title="No volunteers found"
                description="Apply the demo volunteer seed or add volunteers before planning zone deployment."
            />
        );
    }

    return (
        <div className="space-y-6">
            <MetricGaugeGrid metrics={gauges} />
            <section className="rounded-lg border p-4" aria-labelledby="reassign-heading">
                <h2 id="reassign-heading" className="text-lg font-semibold">Reassign a volunteer</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Human-controlled assignment. Only Admin and Volunteer Coordinator database policies permit this update.
                </p>
                <form onSubmit={handleReassignment} className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
                    <label className="grid gap-1.5 text-sm">
                        <span className="font-medium">Volunteer</span>
                        <select
                            value={volunteerId}
                            onChange={(event) => {
                                const nextId = event.target.value;
                                setVolunteerId(nextId);
                                setZoneId(
                                    volunteers.find((volunteer) => volunteer.id === nextId)?.zone_id ?? ""
                                );
                            }}
                            className="min-h-11 rounded-xl border border-border bg-surface px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                            {volunteers.map((volunteer) => (
                                <option key={volunteer.id} value={volunteer.id}>{volunteer.name}</option>
                            ))}
                        </select>
                    </label>
                    <label className="grid gap-1.5 text-sm">
                        <span className="font-medium">Destination</span>
                        <select
                            value={zoneId}
                            onChange={(event) => setZoneId(event.target.value)}
                            className="min-h-11 rounded-xl border border-border bg-surface px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                            <option value="">Available pool</option>
                            {destinationZones.map((zone) => (
                                <option key={zone.id} value={zone.id}>{zone.label}</option>
                            ))}
                        </select>
                    </label>
                    <button
                        type="submit"
                        disabled={!volunteerId || submitting}
                        className="min-h-11 rounded-xl bg-accent px-4 text-sm font-semibold text-background transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
                    >
                        {submitting ? "Saving…" : "Confirm reassignment"}
                    </button>
                </form>
                <p
                    className={`mt-3 text-sm ${feedbackIsError ? "text-status-critical" : "text-accent"}`}
                    role="status"
                    aria-live="polite"
                >
                    {feedback}
                </p>
            </section>
            <section className="rounded-lg border p-4">
                <h2 className="text-lg font-semibold">Current deployment</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {assignments.map(([label, count]) => (
                        <li key={label} className="rounded-lg border border-border p-3">
                            <p className="text-sm text-muted-foreground">{label}</p>
                            <p className="mt-1 text-xl font-semibold">{count}</p>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
