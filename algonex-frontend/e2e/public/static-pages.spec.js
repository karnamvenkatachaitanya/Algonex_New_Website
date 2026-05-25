import { test, expect } from "@playwright/test";

test.describe("Static Pages", () => {
  test("privacy page loads", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByText("Privacy Policy").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("privacy: all 6 sections rendered", async ({ page }) => {
    await page.goto("/privacy");
    await page.waitForSelector("h1", { timeout: 10000 });
    // All h2 section headings are inside the card
    await expect(page.locator("h2").filter({ hasText: "Information We Collect" })).toBeVisible();
    await expect(page.locator("h2").filter({ hasText: "How We Use" })).toBeVisible();
    await expect(page.locator("h2").filter({ hasText: "Data Security" })).toBeVisible();
    await expect(page.locator("h2").filter({ hasText: "Cookies" })).toBeVisible();
    await expect(page.locator("h2").filter({ hasText: "Your Rights" })).toBeVisible();
    await expect(page.locator("h2").filter({ hasText: /^6\. Contact$/ })).toBeVisible();
  });

  test("privacy: last updated date", async ({ page }) => {
    await page.goto("/privacy");
    await page.waitForSelector("h1", { timeout: 10000 });
    await expect(page.getByText("April 2026")).toBeVisible();
  });

  test("terms page loads", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByText("Terms of Service").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("terms: all 8 sections rendered", async ({ page }) => {
    await page.goto("/terms");
    await page.waitForSelector("h1", { timeout: 10000 });
    await expect(page.locator("h2").filter({ hasText: "Acceptance of Terms" })).toBeVisible();
    await expect(page.locator("h2").filter({ hasText: "Account Responsibilities" })).toBeVisible();
    await expect(page.locator("h2").filter({ hasText: "Course Enrollment" })).toBeVisible();
    await expect(page.locator("h2").filter({ hasText: "Event Registration" })).toBeVisible();
    await expect(page.locator("h2").filter({ hasText: "Job Applications" })).toBeVisible();
    await expect(page.locator("h2").filter({ hasText: "Intellectual Property" })).toBeVisible();
    await expect(page.locator("h2").filter({ hasText: "Limitation of Liability" })).toBeVisible();
    await expect(page.locator("h2").filter({ hasText: /^8\. Contact$/ })).toBeVisible();
  });

  test("404 page on invalid URL", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByText("Page Not Found")).toBeVisible({
      timeout: 10000,
    });
  });

  test("404: 'Go Home' navigates to /", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByText("Page Not Found")).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole("button", { name: "Go Home" }).click();
    await page.waitForURL("/");
    expect(page.url()).toMatch(/\/$/);
  });

  test("404: 'Browse Courses' navigates to /allcourses", async ({ page }) => {
    await page.goto("/nonexistent-page");
    await expect(page.getByText("Page Not Found")).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole("button", { name: "Browse Courses" }).click();
    await page.waitForURL(/\/(allcourses|courses)/);
  });
});
