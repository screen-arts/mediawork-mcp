import { defineConfig } from "@playwright/test";

// The smoke spec talks MCP over HTTP; there is no browser involved, but Playwright's runner gives us
// the webServer lifecycle and the same reporting as the app's suite.
//
// Port 3005, so a `pnpm dev` on 3004 and a test run never contend — the same split ui/deploy uses
// between its dev server (3002) and its Playwright server (3003).
const PORT = 3005;

export default defineConfig({
    testDir: "./tests",
    fullyParallel: true,
    workers: process.env.CI ? 1 : undefined,
    reporter: "list",
    use: {
        baseURL: `http://localhost:${PORT}`,
    },
    webServer: {
        command: "pnpm build-and-start-test",
        // The landing page, not /mcp: a bare GET on the MCP endpoint is not a plain 200.
        url: `http://localhost:${PORT}/`,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
    },
});
