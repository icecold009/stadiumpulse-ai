import { CircleDashed } from "lucide-react";

type EmptyStateProps = {
    title: string;
    description: string;
};

export default function EmptyState({ title, description }: EmptyStateProps) {
    return (
        <section className="panel flex flex-col items-center p-8 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-muted text-text-muted">
                <CircleDashed aria-hidden="true" className="h-5 w-5" />
            </span>
            <p className="eyebrow mt-4">No current data</p>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </section>
    );
}
