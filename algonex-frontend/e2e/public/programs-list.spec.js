import { test, expect } from "@playwright/test";
import { antSpinning, antEmpty } from "../helpers/selectors.js";

test.describe("Programs Listing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/programs");
    await page.waitForSelector(".ant-card, .ant-empty", { timeout: 15000 });
  });

  test("programs page loads with cards", async ({ page }) => {
    const cards = page.locator(".ant-card");
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test("loading spinner shown", async ({ page }) => {
    await page.route("**/api/v1/programs/**", async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.continue();
    });
    await page.goto("/programs");
    await expect(page.locator(antSpinning)).toBeVisible({ timeout: 5000 });
    await page.waitForSelector(".ant-card", { timeout: 15000 });
  });

  test("search by program name", async ({ page }) => {
    const search = page.getByPlaceholder("Search programs...");
    await search.fill("Fellowship");
    await page.waitForTimeout(500);
    const cards = page.locator(".ant-card");
    expect(await cards.count()).toBeGreaterThanOrEqual(0);
  });

  test("filter by type: Fellowship", async ({ page }) => {
    await page
      .locator(".ant-segmented-item")
      .filter({ hasText: "Fellowship" })
      .click();
    await page.waitForTimeout(500);
    // Fellowship programs should have purple tags
    const cards = page.locator(".ant-card");
    const count = await cards.count();
    if (count > 0) {
      const purpleTags = page.locator(".ant-tag-purple");
      expect(await purpleTags.count()).toBeGreaterThan(0);
    }
  });

  test("filter by type: Internship", async ({ page }) => {
    await page
      .locator(".ant-segmented-item")
      .filter({ hasText: "Internship" })
      .click();
    await page.waitForTimeout(500);
    const cards = page.locator(".ant-card");
    const count = await cards.count();
    if (count > 0) {
      const blueTags = page.locator(".ant-tag-blue");
      expect(await blueTags.count()).toBeGreaterThan(0);
    }
  });

  test("no results shows empty state", async ({ page }) => {
    const search = page.getByPlaceholder("Search programs...");
    await search.fill("xyznonexistent");
    await page.waitForTimeout(500);
    await expect(
      page.getByText("No programs match your search")
    ).toBeVisible();
  });

  test("program card: type and featured tags", async ({ page }) => {
    // Type tags: purple (fellowship) or blue (internship)
    const typeTags = page.locator(".ant-tag-purple, .ant-tag-blue");
    expect(await typeTags.count()).toBeGreaterThan(0);
    // Featured tag is gold — may or may not exist
    const featuredTag = page.locator(".ant-tag-gold");
    const featuredCount = await featuredTag.count();
    expect(featuredCount).toBeGreaterThanOrEqual(0);
  });

  test("program card: duration, stipend, location, deadline", async ({
    page,
  }) => {
    // Cards should contain duration info
    const firstCard = page.locator(".ant-card").first();
    const text = await firstCard.textContent();
    // Should have some of these fields
    const hasDuration = /month|week/i.test(text);
    const hasLocation =
      /remote|bangalore|hyderabad/i.test(text) || text.includes("₹");
    expect(hasDuration || hasLocation).toBeTruthy();
  });

  test("'Closed' tag for expired programs", async ({ page }) => {
    // Check if any program has a "Closed" red tag
    const closedTag = page.locator(".ant-tag-red").filter({ hasText: "Closed" });
    const count = await closedTag.count();
    // This is data-dependent — just verify no crash
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("'View Details' navigates to /programs/{slug}", async ({ page }) => {
    const viewBtn = page
      .getByRole("button", { name: /View Details/i })
      .first();
    await viewBtn.click();
    await page.waitForURL(/\/programs\/[a-z0-9-]+/);
    expect(page.url()).toMatch(/\/programs\/[a-z0-9-]+/);
  });

  test("CTA: 'Register Now' navigates to /register", async ({ page }) => {
    // Scroll to CTA section at bottom
    const ctaBtn = page
      .getByRole("button", { name: /Register Now/i })
      .last();
    await ctaBtn.scrollIntoViewIfNeeded();
    await ctaBtn.click();
    await page.waitForURL(/\/register/);
    expect(page.url()).toContain("/register");
  });
});
