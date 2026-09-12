import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  timeout: 45000,
  workers: 2,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "test-results/regression.json" }]],
  use: {
    baseURL: "http://127.0.0.1:3200",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    reducedMotion: "reduce",
    serviceWorkers: "allow",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3200",
    url: "http://127.0.0.1:3200/preview",
    reuseExistingServer: false,
    timeout: 60000,
  },
});