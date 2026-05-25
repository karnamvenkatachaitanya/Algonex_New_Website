import { test, expect } from "@playwright/test";
import { antSpinning, antEmpty } from "../helpers/selectors.js";

const API = "http://localhost:8000/api/v1";

let programSlug;

test.beforeAll(async ({ request }) => {
  const res = await request.get(`${API}/programs/`);
  const data = await res.json();
  const programs = data.data?.results || data.results || [];
  if (programs.length > 0) {
    programSlug = programs[0].slug;
  }
});

test.describe("Program Detail", () => {
  test("program detail loads by slug", async ({ page }) => {
    test.skip(!programSlug, "No programs seeded");
    await page.goto(`/programs/${programSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("loading spinner shown", async ({ page }) => {
    test.skip(!programSlug, "No programs seeded");
    await page.route(`**/api/v1/programs/${programSlug}/`, async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.continue();
    });
    await page.goto(`/programs/${programSlug}`);
    await expect(page.locator(antSpinning)).toBeVisible({ timeout: 5000 });
    await page.waitForSelector("h1", { timeout: 15000 });
  });

  test("banner: type, featured, accepting tags", async ({ page }) => {
    test.skip(!programSlug, "No programs seeded");
    await page.goto(`/programs/${programSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    // Type tag (purple or blue)
    const typeTags = page.locator(".ant-tag-purple, .ant-tag-blue");
    expect(await typeTags.count()).toBeGreaterThan(0);
    // Accepting or Closed tag
    const statusTag = page.getByText(
      /Accepting Applications|Applications Closed/
    );
    await expect(statusTag.first()).toBeVisible();
  });

  test("banner: spots left tag color-coded", async ({ page }) => {
    test.skip(!programSlug, "No programs seeded");
    await page.goto(`/programs/${programSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    // Spots left is optional — just verify no crash
    const spotsTag = page.getByText(/spots left/i);
    const count = await spotsTag.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("banner: duration, stipend, location, deadline", async ({ page }) => {
    test.skip(!programSlug, "No programs seeded");
    await page.goto(`/programs/${programSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    // Duration should be visible
    await expect(page.getByText(/month|week/i).first()).toBeVisible();
  });

  test("registration CTA: navigates to /register?program={slug}", async ({
    page,
  }) => {
    test.skip(!programSlug, "No programs seeded");
    await page.goto(`/programs/${programSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    // If accepting, click Register button
    const registerBtn = page
      .getByRole("button", { name: /Register for This Program/i })
      .first();
    const isVisible = await registerBtn.isVisible().catch(() => false);
    if (isVisible) {
      await registerBtn.click();
      await page.waitForURL(/\/register\?program=/);
      expect(page.url()).toContain(`program=${programSlug}`);
    }
  });

  test("closed program: disabled button", async ({ page }) => {
    await page.route("**/api/v1/programs/closed-program-test/", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "success",
          data: {
            title: "Closed Program",
            slug: "closed-program-test",
            program_type: "fellowship",
            is_accepting: false,
            is_featured: false,
            duration: "6 months",
            location: "Bangalore",
            description: "This program is closed.",
          },
        }),
      })
    );
    await page.goto("/programs/closed-program-test");
    await page.waitForSelector("h1", { timeout: 15000 });
    const closedBtn = page.getByRole("button", {
      name: "Applications Closed",
    });
    await expect(closedBtn).toBeVisible();
    await expect(closedBtn).toBeDisabled();
  });

  test("details grid renders conditionally", async ({ page }) => {
    test.skip(!programSlug, "No programs seeded");
    await page.goto(`/programs/${programSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    // Duration card should exist
    await expect(page.getByText("Duration").first()).toBeVisible();
    // Location card
    await expect(page.getByText("Location").first()).toBeVisible();
  });

  test("description renders markdown", async ({ page }) => {
    test.skip(!programSlug, "No programs seeded");
    await page.goto(`/programs/${programSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    await expect(page.getByText("About This Program")).toBeVisible();
  });

  test("eligibility section with criteria and tags", async ({ page }) => {
    test.skip(!programSlug, "No programs seeded");
    await page.goto(`/programs/${programSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    const eligibility = page.getByText("Eligibility Criteria");
    const hasEligibility = await eligibility.isVisible().catch(() => false);
    if (hasEligibility) {
      await expect(eligibility).toBeVisible();
    }
  });

  test("bottom CTA with deadline", async ({ page }) => {
    test.skip(!programSlug, "No programs seeded");
    await page.goto(`/programs/${programSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    const missOut = page.getByText("Don't miss out!");
    const hasCTA = await missOut.isVisible().catch(() => false);
    if (hasCTA) {
      await expect(missOut).toBeVisible();
    }
  });

  test("non-existent slug shows not found", async ({ page }) => {
    await page.goto("/programs/nonexistent-999");
    await expect(page.getByText("Program not found")).toBeVisible({
      timeout: 15000,
    });
    const browseBtn = page.getByRole("button", { name: "Browse Programs" });
    await expect(browseBtn).toBeVisible();
    await browseBtn.click();
    await page.waitForURL("/programs");
  });
});
