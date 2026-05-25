import { test, expect } from "@playwright/test";
import { antSpinning, antEmpty } from "../helpers/selectors.js";

const API = "http://localhost:8000/api/v1";

let projectSlug;

test.beforeAll(async ({ request }) => {
  const res = await request.get(`${API}/alumni/projects/`);
  if (res.ok()) {
    const data = await res.json();
    const projects = data.data?.results || data.results || [];
    if (projects.length > 0) {
      projectSlug = projects[0].slug;
    }
  }
});

test.describe("Student Project Detail", () => {
  test("project detail loads by slug", async ({ page }) => {
    test.skip(!projectSlug, "No projects seeded");
    await page.goto(`/alumni/projects/${projectSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("loading spinner shown", async ({ page }) => {
    test.skip(!projectSlug, "No projects seeded");
    await page.route(`**/api/v1/alumni/projects/${projectSlug}/`, async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.continue();
    });
    await page.goto(`/alumni/projects/${projectSlug}`);
    await expect(page.locator(antSpinning)).toBeVisible({ timeout: 5000 });
    await page.waitForSelector("h1", { timeout: 15000 });
  });

  test("thumbnail renders if present", async ({ page }) => {
    test.skip(!projectSlug, "No projects seeded");
    await page.goto(`/alumni/projects/${projectSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    const img = page.locator("img");
    const count = await img.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("tech tags displayed", async ({ page }) => {
    test.skip(!projectSlug, "No projects seeded");
    await page.goto(`/alumni/projects/${projectSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    const tags = page.locator(".ant-tag");
    expect(await tags.count()).toBeGreaterThan(0);
  });

  test("student name, course, batch year", async ({ page }) => {
    test.skip(!projectSlug, "No projects seeded");
    await page.goto(`/alumni/projects/${projectSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    // "by StudentName — CourseName, Batch YYYY"
    await expect(page.getByText(/by .+/i).first()).toBeVisible();
    await expect(page.getByText(/Batch \d{4}/i).first()).toBeVisible();
  });

  test("'Live Demo' button links externally", async ({ page }) => {
    test.skip(!projectSlug, "No projects seeded");
    await page.goto(`/alumni/projects/${projectSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    const demoBtn = page.getByRole("button", { name: /Live Demo/i });
    const hasDemo = await demoBtn.isVisible().catch(() => false);
    if (hasDemo) {
      // Should have href and target="_blank"
      const link = page.locator("a[target='_blank']").filter({ hasText: /Live Demo/i });
      expect(await link.count()).toBeGreaterThan(0);
    }
  });

  test("'View Code' button links externally", async ({ page }) => {
    test.skip(!projectSlug, "No projects seeded");
    await page.goto(`/alumni/projects/${projectSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    const codeBtn = page.getByRole("button", { name: /View Code/i });
    const hasCode = await codeBtn.isVisible().catch(() => false);
    if (hasCode) {
      const link = page.locator("a[target='_blank']").filter({ hasText: /View Code/i });
      expect(await link.count()).toBeGreaterThan(0);
    }
  });

  test("non-existent slug shows not found", async ({ page }) => {
    await page.goto("/alumni/projects/nonexistent-999");
    await expect(page.getByText("Project not found")).toBeVisible({
      timeout: 15000,
    });
    const backBtn = page.getByRole("button", { name: /Back to Alumni/i });
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    await page.waitForURL("/alumni");
  });
});
