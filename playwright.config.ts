import { defineConfig } from "@playwright/test";

// Browser tests against the vite dev server. Time is faked with page.clock, so a
// whole workout runs in seconds.
// Playwright finds its own browsers; set E2E_CHROMIUM=/opt/pw-browsers/chromium only if it cannot.
const executablePath = process.env.E2E_CHROMIUM || undefined;

export default defineConfig({
  testDir: "e2e",
  outputDir: "node_modules/.pw-results",
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : "line",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:5196",
    trace: "off",
    // An iPad in portrait.
    viewport: { width: 820, height: 1180 },
    hasTouch: true,
    launchOptions: { executablePath },
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: {
    command: "npx vite --port 5196 --strictPort",
    url: "http://localhost:5196/",
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "ignore",
    timeout: 60_000,
  },
});
