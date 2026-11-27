// https://nextjs.org/docs/app/guides/testing/playwright
// https://playwright.dev/docs/test-configuration
// https://playwright.dev/docs/auth

import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://localhost:3002";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    locale: "en-US",
    timezoneId: "Asia/Taipei",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
    {
      name: "tablet",
      use: { ...devices["Galaxy Tab S4"] },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: process.env.CI ? "pnpm start" : "pnpm dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
