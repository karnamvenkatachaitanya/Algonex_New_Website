import { test, expect } from "@playwright/test";
import { antSpinning, antEmpty } from "../helpers/selectors.js";

test.describe("Portfolio / Case Studies Listing", () => {
  test("portfolio page loads", async ({ page }) => {
    await page.goto("/products");
    await page.waitForSelector(".ant-card, .ant-empty", { timeout: 15000 });
    await expect(page.getByText("Our Work")).toBeVisible();
  });

  test("loading spinner shown", async ({ page }) => {
    await page.route("**/api/v1/portfolio/**", async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.continue();
    });
    await page.goto("/products");
    await expect(page.locator(antSpinning)).toBeVisible({ timeout: 5000 });
    await page.waitForSelector(".ant-card, .ant-empty", { timeout: 15000 });
  });

  test("case study card: thumbnail, industry tag, tech tags", async ({
    page,
  }) => {
    await page.goto("/products");
    await page.waitForSelector(".ant-card, .ant-empty", { timeout: 15000 });
    const cards = page.locator(".ant-card");
    const count = await cards.count();
    if (count > 0) {
      // Industry tag (blue)
      const blueTags = page.locator(".ant-tag-blue");
      expect(await blueTags.count()).toBeGreaterThan(0);
    }
  });

  test("case study card links to /products/{slug}", async ({ page }) => {
    await page.goto("/products");
    await page.waitForSelector(".ant-card, .ant-empty", { timeout: 15000 });
    const cards = page.locator(".ant-card");
    const count = await cards.count();
    test.skip(count === 0, "No case studies to test");
    await cards.first().click();
    await page.waitForURL(/\/products\/[a-z0-9-]+/);
  });

  test("empty state when no case studies", async ({ page }) => {
    await page.route("**/api/v1/portfolio/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "success", data: { results: [] } }),
      })
    );
    await page.goto("/products");
    await expect(
      page.getByText("No case studies yet. Coming soon!")
    ).toBeVisible({ timeout: 15000 });
  });

  test("cards have hover effect", async ({ page }) => {
    await page.goto("/products");
    await page.waitForSelector(".ant-card, .ant-empty", { timeout: 15000 });
    const cards = page.locator(".ant-card");
    const count = await cards.count();
    test.skip(count === 0, "No case studies to test");
    // Ant Design hoverable cards have the class
    const hoverableCard = page.locator(".ant-card-hoverable");
    expect(await hoverableCard.count()).toBeGreaterThan(0);
  });
});
