import LoginClient from "@/components/auth/login-client";

export default function LoginPage() {
    return <LoginClient demoEnabled={process.env.DEMO_ACCESS_ENABLED === "true"} />;
}
