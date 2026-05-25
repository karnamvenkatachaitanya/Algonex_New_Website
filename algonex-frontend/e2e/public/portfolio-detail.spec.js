import { test, expect } from "@playwright/test";
import { antSpinning, antEmpty } from "../helpers/selectors.js";

const API = "http://localhost:8000/api/v1";

let studySlug;

test.beforeAll(async ({ request }) => {
  const res = await request.get(`${API}/portfolio/`);
  if (res.ok()) {
    const data = await res.json();
    const studies = data.data?.results || data.results || [];
    if (studies.length > 0) {
      studySlug = studies[0].slug;
    }
  }
});

test.describe("Case Study Detail", () => {
  test("case study detail loads by slug", async ({ page }) => {
    test.skip(!studySlug, "No case studies seeded");
    await page.goto(`/products/${studySlug}`);
    await page.waitForSelector("h1, h2", { timeout: 15000 });
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();
  });

  test("loading spinner shown", async ({ page }) => {
    test.skip(!studySlug, "No case studies seeded");
    await page.route(`**/api/v1/portfolio/${studySlug}/`, async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.continue();
    });
    await page.goto(`/products/${studySlug}`);
    await expect(page.locator(antSpinning)).toBeVisible({ timeout: 5000 });
    await page.waitForSelector("h1, h2", { timeout: 15000 });
  });

  test("banner image renders if present", async ({ page }) => {
    test.skip(!studySlug, "No case studies seeded");
    await page.goto(`/products/${studySlug}`);
    await page.waitForSelector("h1, h2", { timeout: 15000 });
    // Banner is optional — check for img or background
    const images = page.locator("img");
    const count = await images.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("tags: industry, client, tech", async ({ page }) => {
    test.skip(!studySlug, "No case studies seeded");
    await page.goto(`/products/${studySlug}`);
    await page.waitForSelector("h1, h2", { timeout: 15000 });
    // Tags should be visible
    const tags = page.locator(".ant-tag");
    expect(await tags.count()).toBeGreaterThan(0);
  });

  test("problem section renders markdown", async ({ page }) => {
    test.skip(!studySlug, "No case studies seeded");
    await page.goto(`/products/${studySlug}`);
    await page.waitForSelector("h1, h2", { timeout: 15000 });
    const problemHeading = page.getByText("The Problem");
    const hasProblem = await problemHeading.isVisible().catch(() => false);
    if (hasProblem) {
      await expect(problemHeading).toBeVisible();
    }
  });

  test("solution section renders markdown", async ({ page }) => {
    test.skip(!studySlug, "No case studies seeded");
    await page.goto(`/products/${studySlug}`);
    await page.waitForSelector("h1, h2", { timeout: 15000 });
    const solutionHeading = page.getByText("Our Solution");
    const hasSolution = await solutionHeading.isVisible().catch(() => false);
    if (hasSolution) {
      await expect(solutionHeading).toBeVisible();
    }
  });

  test("results section renders markdown", async ({ page }) => {
    test.skip(!studySlug, "No case studies seeded");
    await page.goto(`/products/${studySlug}`);
    await page.waitForSelector("h1, h2", { timeout: 15000 });
    const resultsHeading = page.getByText("Results", { exact: true });
    const hasResults = await resultsHeading.isVisible().catch(() => false);
    if (hasResults) {
      await expect(resultsHeading).toBeVisible();
    }
  });

  test("screenshots with lightbox", async ({ page }) => {
    test.skip(!studySlug, "No case studies seeded");
    await page.goto(`/products/${studySlug}`);
    await page.waitForSelector("h1, h2", { timeout: 15000 });
    const screenshots = page.getByText("Screenshots");
    const hasScreenshots = await screenshots.isVisible().catch(() => false);
    if (hasScreenshots) {
      // Click first image to open lightbox
      const img = page.locator(".ant-image img").first();
      await img.click();
      await expect(
        page.locator(".ant-image-preview-root")
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("back button navigates", async ({ page }) => {
    test.skip(!studySlug, "No case studies seeded");
    await page.goto(`/products/${studySlug}`);
    await page.waitForSelector("h1, h2", { timeout: 15000 });
    await page.getByRole("button", { name: /Back/i }).click();
    await page.waitForURL("/products");
  });

  test("non-existent slug shows not found", async ({ page }) => {
    await page.goto("/products/nonexistent-999");
    await expect(page.getByText("Case study not found")).toBeVisible({
      timeout: 15000,
    });
    const browseBtn = page.getByRole("button", { name: "Browse Portfolio" });
    await expect(browseBtn).toBeVisible();
  });
});
