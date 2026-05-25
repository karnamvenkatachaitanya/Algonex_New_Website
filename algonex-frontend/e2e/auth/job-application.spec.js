import { test, expect } from "@playwright/test";
import { registerUser, clearAuth } from "../helpers/auth.helper.js";
import { antMessage, antModal } from "../helpers/selectors.js";
import path from "path";

test.describe("Job Application", () => {
  let creds;
  let jobSlug;
  const resumePath = path.resolve("e2e/fixtures/test-resume.pdf");

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    creds = await registerUser(page, { prefix: "auth_job" });

    const res = await page.request.get("http://localhost:8000/api/v1/careers/");
    const data = await res.json();
    const jobs = data.data?.results || data.results || [];
    jobSlug = jobs[0]?.slug;
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/signin");
    await page.getByPlaceholder("Email").fill(creds.email);
    await page.getByPlaceholder("Password").fill(creds.password);
    await page.locator("form").getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("/", { timeout: 15000 });
  });

  test("'Apply Now' opens application modal", async ({ page }) => {
    test.skip(!jobSlug, "No seeded jobs");
    await page.goto(`/careers/${jobSlug}`);
    await page.waitForSelector("h1", { timeout: 10000 });

    await page.getByRole("button", { name: "Apply Now" }).click();
    await expect(page.locator(antModal)).toBeVisible();
    await expect(page.getByText(`Apply for`)).toBeVisible();
    await expect(page.getByText("Resume (PDF)")).toBeVisible();
    await expect(page.getByText("Cover Letter")).toBeVisible();
  });

  test("submit with PDF resume succeeds", async ({ page }) => {
    test.skip(!jobSlug, "No seeded jobs");
    // Use fresh user to avoid already-applied state (registerUser logs in automatically)
    await registerUser(page, { prefix: "auth_job_apply" });
    await page.goto(`/careers/${jobSlug}`);
    await page.waitForSelector("h1", { timeout: 10000 });

    await page.getByRole("button", { name: "Apply Now" }).click();
    await expect(page.locator(antModal)).toBeVisible();

    // Upload resume via file chooser
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Select PDF" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(resumePath);

    await page.getByRole("button", { name: "Submit Application" }).click();

    // Wait for success message specifically
    await expect(page.getByText("Application submitted!")).toBeVisible({ timeout: 15000 });
    // Button should change to "Application Submitted"
    await expect(page.getByText("Application Submitted")).toBeVisible({ timeout: 15000 });
  });

  test("modal closes on success", async ({ page }) => {
    test.skip(!jobSlug, "No seeded jobs");
    await registerUser(page, { prefix: "auth_job_close" });
    await page.goto(`/careers/${jobSlug}`);
    await page.waitForSelector("h1", { timeout: 10000 });

    await page.getByRole("button", { name: "Apply Now" }).click();
    await expect(page.locator(antModal)).toBeVisible();

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Select PDF" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(resumePath);
    await page.getByRole("button", { name: "Submit Application" }).click();

    await expect(page.locator(antModal)).not.toBeVisible({ timeout: 10000 });
  });

  test("application appears in My Applications", async ({ page }) => {
    test.skip(!jobSlug, "No seeded jobs");
    await page.goto("/my-applications");
    await page.waitForSelector("h1", { timeout: 10000 });

    // Should have at least one application card
    const cards = page.locator(".ant-card");
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("applied")).toBeVisible();
    await expect(page.getByText("Applied:")).toBeVisible();
  });

  test("application status pipeline renders", async ({ page }) => {
    test.skip(!jobSlug, "No seeded jobs");
    await page.goto("/my-applications");
    await page.waitForSelector(".ant-card", { timeout: 10000 });

    // Steps component should be visible
    await expect(page.locator(".ant-steps").first()).toBeVisible();
    await expect(page.getByText("applied").first()).toBeVisible();
  });

  test("rejected status shows message", async ({ page }) => {
    // Intercept to simulate rejected application
    await page.route("**/api/v1/applications/", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "success",
          data: {
            results: [{
              id: 1, status: "rejected", applied_at: new Date().toISOString(),
              job: { title: "Test Job", slug: "test-job" },
            }],
          },
        }),
      })
    );

    await page.goto("/my-applications");
    await page.waitForSelector("h1", { timeout: 10000 });
    await expect(page.getByText("Application was not selected")).toBeVisible({ timeout: 5000 });
  });

  test("'View Job Details' link works", async ({ page }) => {
    test.skip(!jobSlug, "No seeded jobs");
    await page.goto("/my-applications");
    await page.waitForSelector(".ant-card", { timeout: 10000 });

    const link = page.getByRole("button", { name: "View Job Details" }).first();
    if (await link.isVisible().catch(() => false)) {
      await link.click();
      await page.waitForURL(/careers\//, { timeout: 5000 });
    }
  });

  test("submit without resume shows validation error", async ({ page }) => {
    test.skip(!jobSlug, "No seeded jobs");
    await page.goto(`/careers/${jobSlug}`);
    await page.waitForSelector("h1", { timeout: 10000 });

    await page.getByRole("button", { name: "Apply Now" }).click();
    await expect(page.locator(antModal)).toBeVisible();

    // Submit without file
    await page.getByRole("button", { name: "Submit Application" }).click();
    await expect(page.getByText("Please upload your resume")).toBeVisible({ timeout: 5000 });
  });

  test("error keeps modal open for retry", async ({ page }) => {
    test.skip(!jobSlug, "No seeded jobs");
    await registerUser(page, { prefix: "auth_job_err" });

    await page.route(`**/api/v1/careers/${jobSlug}/apply/`, (route) =>
      route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ error: { message: "Application failed" } }) })
    );

    await page.goto(`/careers/${jobSlug}`);
    await page.waitForSelector("h1", { timeout: 10000 });
    await page.getByRole("button", { name: "Apply Now" }).click();

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Select PDF" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(resumePath);
    await page.getByRole("button", { name: "Submit Application" }).click();

    await expect(page.locator(antMessage)).toBeVisible({ timeout: 5000 });
    // Modal should still be open
    await expect(page.locator(antModal)).toBeVisible();
  });

  test("cover letter is optional", async ({ page }) => {
    test.skip(!jobSlug, "No seeded jobs");
    await registerUser(page, { prefix: "auth_job_nocover" });
    await page.goto(`/careers/${jobSlug}`);
    await page.waitForSelector("h1", { timeout: 10000 });

    await page.getByRole("button", { name: "Apply Now" }).click();

    // Only upload resume, skip cover letter
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Select PDF" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(resumePath);
    await page.getByRole("button", { name: "Submit Application" }).click();

    // Should succeed without cover letter
    await expect(page.locator(antMessage)).toBeVisible({ timeout: 10000 });
  });

  test("unauthenticated 'Apply Now' redirects to signin", async ({ page }) => {
    test.skip(!jobSlug, "No seeded jobs");
    await clearAuth(page);
    await page.goto(`/careers/${jobSlug}`);
    await page.waitForSelector("h1", { timeout: 10000 });

    await page.getByRole("button", { name: "Apply Now" }).click();
    await page.waitForURL(/signin/, { timeout: 5000 });
  });
});
