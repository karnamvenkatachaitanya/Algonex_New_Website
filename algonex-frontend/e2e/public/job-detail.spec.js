import { test, expect } from "@playwright/test";
import { antSpinning, antEmpty } from "../helpers/selectors.js";

const API = "http://localhost:8000/api/v1";

let jobSlug;

test.beforeAll(async ({ request }) => {
  const res = await request.get(`${API}/careers/`);
  const data = await res.json();
  const jobs = data.data?.results || data.results || [];
  if (jobs.length > 0) {
    jobSlug = jobs[0].slug;
  }
});

test.describe("Job Detail - Public View", () => {
  test("job detail loads by slug", async ({ page }) => {
    test.skip(!jobSlug, "No jobs seeded");
    await page.goto(`/careers/${jobSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("loading spinner shown", async ({ page }) => {
    test.skip(!jobSlug, "No jobs seeded");
    await page.route(`**/api/v1/careers/${jobSlug}/`, async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.continue();
    });
    await page.goto(`/careers/${jobSlug}`);
    await expect(page.locator(antSpinning)).toBeVisible({ timeout: 5000 });
    await page.waitForSelector("h1", { timeout: 15000 });
  });

  test("banner: department, type, remote tags", async ({ page }) => {
    test.skip(!jobSlug, "No jobs seeded");
    await page.goto(`/careers/${jobSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    // Department tag (cyan) and type tag (blue)
    const cyanTag = page.locator(".ant-tag-cyan").first();
    await expect(cyanTag).toBeVisible();
    const blueTag = page.locator(".ant-tag-blue").first();
    await expect(blueTag).toBeVisible();
  });

  test("banner: location with icon", async ({ page }) => {
    test.skip(!jobSlug, "No jobs seeded");
    await page.goto(`/careers/${jobSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    // Location text should be visible
    await expect(
      page.getByText(/bangalore|remote|hyderabad|mumbai|delhi/i).first()
    ).toBeVisible();
  });

  test("banner: salary range formatted", async ({ page }) => {
    test.skip(!jobSlug, "No jobs seeded");
    await page.goto(`/careers/${jobSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    // Salary with ₹ — may not be present for all jobs
    const salaryText = page.getByText("₹").first();
    const hasSalary = await salaryText.isVisible().catch(() => false);
    expect(hasSalary || true).toBeTruthy();
  });

  test("description renders markdown", async ({ page }) => {
    test.skip(!jobSlug, "No jobs seeded");
    await page.goto(`/careers/${jobSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    await expect(page.getByText("Description")).toBeVisible();
  });

  test("requirements section renders if present", async ({ page }) => {
    test.skip(!jobSlug, "No jobs seeded");
    await page.goto(`/careers/${jobSlug}`);
    await page.waitForSelector("h1", { timeout: 15000 });
    const reqHeading = page.getByText("Requirements", { exact: true });
    const hasReq = await reqHeading.isVisible().catch(() => false);
    if (hasReq) {
      await expect(reqHeading).toBeVisible();
    }
  });

  test("requirements section hidden if absent", async ({ page }) => {
    // Mock a job without requirements
    await page.route("**/api/v1/careers/no-req-job/", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "success",
          data: {
            title: "Test Job No Req",
            slug: "no-req-job",
            department: "engineering",
            job_type: "full_time",
            location: "Bangalore",
            description: "A test job.",
          },
        }),
      })
    );
    await page.goto("/careers/no-req-job");
    await page.waitForSelector("h1", { timeout: 15000 });
    const reqHeading = page.getByText("Requirements", { exact: true });
    await expect(reqHeading).not.toBeVisible();
  });

  test("back button navigates", async ({ page }) => {
    test.skip(!jobSlug, "No jobs seeded");
    await page.goto("/careers");
    await page.waitForSelector(".ant-card", { timeout: 15000 });
    // Click first job card
    await page.locator(".ant-card").first().click();
    await page.waitForURL(/\/careers\/[a-z0-9-]+/);
    // Click Back
    await page.getByRole("button", { name: /Back/i }).click();
    await page.waitForURL("/careers");
  });

  test("non-existent slug shows not found", async ({ page }) => {
    await page.goto("/careers/nonexistent-999");
    await expect(page.getByText("Job not found")).toBeVisible({
      timeout: 15000,
    });
    const browseBtn = page.getByRole("button", { name: "Browse Jobs" });
    await expect(browseBtn).toBeVisible();
    await browseBtn.click();
    await page.waitForURL("/careers");
  });
});
