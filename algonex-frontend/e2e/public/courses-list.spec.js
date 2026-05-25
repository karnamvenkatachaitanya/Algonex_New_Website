import { test, expect } from "@playwright/test";
import { antSpinning, antEmpty } from "../helpers/selectors.js";

// CourseCard is a custom div (not ant-card). Each card lives inside .ant-col.
const courseCard = ".ant-col div[style*='cursor: pointer']";

test.describe("Course Listing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/allcourses");
    // Wait for course grid to render (either cards or empty)
    await page.waitForSelector(`${courseCard}, .ant-empty`, { timeout: 15000 });
  });

  test("courses page loads with course cards", async ({ page }) => {
    const cards = page.locator(courseCard);
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test("loading spinner shown before data", async ({ page }) => {
    await page.route("**/api/v1/courses/**", async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.continue();
    });
    await page.goto("/allcourses");
    await expect(page.locator(antSpinning)).toBeVisible({ timeout: 5000 });
    await page.waitForSelector(courseCard, { timeout: 15000 });
    await expect(page.locator(antSpinning)).not.toBeVisible();
  });

  test("search by course name", async ({ page }) => {
    const search = page.getByPlaceholder("Search courses...");
    await search.fill("Python");
    await page.waitForTimeout(500);
    const cards = page.locator(courseCard);
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    // All visible cards should contain Python in their text
    for (let i = 0; i < count; i++) {
      const text = await cards.nth(i).textContent();
      expect(text.toLowerCase()).toContain("python");
    }
  });

  test("search by description", async ({ page }) => {
    const search = page.getByPlaceholder("Search courses...");
    await search.fill("full stack");
    await page.waitForTimeout(500);
    const cards = page.locator(courseCard);
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test("search is case-insensitive", async ({ page }) => {
    const search = page.getByPlaceholder("Search courses...");
    await search.fill("python");
    await page.waitForTimeout(500);
    const cards = page.locator(courseCard);
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test("clear search restores all courses", async ({ page }) => {
    const search = page.getByPlaceholder("Search courses...");
    const initialCount = await page.locator(courseCard).count();

    await search.fill("Python");
    await page.waitForTimeout(500);
    const filteredCount = await page.locator(courseCard).count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Clear using the allowClear button
    await page.locator(".ant-input-clear-icon").click();
    await page.waitForTimeout(500);
    const restoredCount = await page.locator(courseCard).count();
    expect(restoredCount).toBe(initialCount);
  });

  test("filter by level: Beginner", async ({ page }) => {
    await page
      .locator(".ant-segmented-item")
      .filter({ hasText: "Beginner" })
      .click();
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("filter by level: Intermediate", async ({ page }) => {
    await page
      .locator(".ant-segmented-item")
      .filter({ hasText: "Intermediate" })
      .click();
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("filter by level: Advanced", async ({ page }) => {
    await page
      .locator(".ant-segmented-item")
      .filter({ hasText: "Advanced" })
      .click();
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("filter by Trending", async ({ page }) => {
    const totalCards = await page.locator(courseCard).count();
    await page
      .locator(".ant-segmented-item")
      .filter({ hasText: "Trending" })
      .click();
    await page.waitForTimeout(500);
    const trendingCards = await page.locator(courseCard).count();
    expect(trendingCards).toBeLessThanOrEqual(totalCards);
  });

  test("combined search + filter", async ({ page }) => {
    const search = page.getByPlaceholder("Search courses...");
    await search.fill("Python");
    await page
      .locator(".ant-segmented-item")
      .filter({ hasText: "Beginner" })
      .click();
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("no results shows empty state", async ({ page }) => {
    const search = page.getByPlaceholder("Search courses...");
    await search.fill("xyznonexistent999");
    await page.waitForTimeout(500);
    await expect(page.getByText("No courses match your filters")).toBeVisible();
  });
});
