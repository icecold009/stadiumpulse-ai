const baseUrl = process.env.PULSEOPS_APP_URL?.replace(/\/$/, "");
if (!baseUrl) {
    throw new Error("Set PULSEOPS_APP_URL to the public deployment URL.");
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

const root = await fetch(`${baseUrl}/`, { redirect: "manual" });
assert(root.status === 307 || root.status === 308, `Root returned ${root.status}.`);
assert(root.headers.get("location") === "/login", "Root did not redirect to /login.");

const login = await fetch(`${baseUrl}/login`);
const loginHtml = await login.text();
assert(login.ok, `Login returned ${login.status}.`);
assert(loginHtml.includes("PulseOps"), "Login did not render the PulseOps application.");
assert(!loginHtml.includes("fonts.googleapis.com"), "Login depends on Google Fonts.");

for (const path of ["/ops", "/overview", "/sustainability", "/volunteers"]) {
    const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
    assert(response.status === 307 || response.status === 308, `${path} returned ${response.status}.`);
    assert(response.headers.get("location") === "/login", `${path} did not redirect to login.`);
}

for (const path of ["/api/copilot", "/api/simulate-tick", "/api/check-alerts"]) {
    const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: path === "/api/copilot" ? JSON.stringify({ question: "test" }) : "{}",
    });
    assert(response.status === 401, `${path} returned ${response.status}, expected 401.`);
}

console.log(JSON.stringify({ ok: true, public_shell: true, protected_routes: true, protected_apis: true }));
