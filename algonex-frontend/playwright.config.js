import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:5173",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev",
        port: 5173,
        reuseExistingServer: true,
      },
  projects: [
    {
      name: "setup",
      testMatch: /global-setup\.js/,
    },
    {
      name: "agent1-auth",
      testDir: "./e2e/auth",
      use: { browserName: "chromium" },
      dependencies: ["setup"],
    },
    {
      name: "agent2-public",
      testDir: "./e2e/public",
      use: { browserName: "chromium" },
      dependencies: ["setup"],
    },
  ],
});
