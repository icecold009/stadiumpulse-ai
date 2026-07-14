type EmptyStateProps = {
    title: string;
    description: string;
};

export default function EmptyState({ title, description }: EmptyStateProps) {
    return (
        <section className="rounded-lg border p-6 text-center">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </section>
    );
}