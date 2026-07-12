export default function OverviewPage() {
    return (
        <section className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-[#edeff2]">
                Global Overview
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-[#8b96a3]">
                Admin-only view with a card grid for each venue, showing occupancy, active alerts, and sustainability score, plus a top-level incident feed.
            </p>
        </section>
    );
}
