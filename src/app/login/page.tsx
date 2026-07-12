"use client";

export default function LoginPage() {
    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        // TODO: Wire up Supabase Auth sign-in here in Phase 1.
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(61,214,196,0.12),transparent_34%),linear-gradient(180deg,#0b0f14_0%,#091015_100%)] px-4 py-10 text-[#edeff2]">
            <section className="w-full max-w-md rounded-2xl border border-[#26303a] bg-[#141a21] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-10">
                <div className="mb-8 space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.32em] text-[#8b96a3]">
                        StadiumPulse AI
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight text-[#edeff2]">
                        Sign in to continue
                    </h1>
                    <p className="text-sm leading-6 text-[#8b96a3]">
                        Access the operator dashboard with your role-based Supabase account.
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <label className="block space-y-2">
                        <span className="text-sm font-medium text-[#edeff2]">Email</span>
                        <input
                            type="email"
                            name="email"
                            autoComplete="email"
                            required
                            className="h-12 w-full rounded-xl border border-[#26303a] bg-[#1c242d] px-4 text-sm text-[#edeff2] outline-none transition placeholder:text-[#64707d] focus:border-[#3dd6c4] focus:ring-2 focus:ring-[#3dd6c4]/25"
                            placeholder="operator@stadiumpulse.ai"
                        />
                    </label>

                    <label className="block space-y-2">
                        <span className="text-sm font-medium text-[#edeff2]">Password</span>
                        <input
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            required
                            className="h-12 w-full rounded-xl border border-[#26303a] bg-[#1c242d] px-4 text-sm text-[#edeff2] outline-none transition placeholder:text-[#64707d] focus:border-[#3dd6c4] focus:ring-2 focus:ring-[#3dd6c4]/25"
                            placeholder="Enter your password"
                        />
                    </label>

                    <button
                        type="submit"
                        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#3dd6c4] px-4 text-sm font-semibold text-[#0b0f14] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#3dd6c4] focus:ring-offset-2 focus:ring-offset-[#141a21]"
                    >
                        Sign in
                    </button>
                </form>
            </section>
        </main>
    );
}
