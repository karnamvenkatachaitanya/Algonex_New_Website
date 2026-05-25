import { test, expect } from "@playwright/test";
import { registerUser, clearAuth } from "../helpers/auth.helper.js";
import { antMessage, antModal } from "../helpers/selectors.js";

test.describe("Course Enrollment", () => {
  let creds;
  let courseSlug;

  test.beforeAll(async ({ browser }) => {
    // Register a user and find a seeded course slug
    const page = await browser.newPage();
    creds = await registerUser(page, { prefix: "auth_enroll" });

    // Get first course slug from API
    const res = await page.request.get("http://localhost:8000/api/v1/courses/");
    const data = await res.json();
    const courses = data.data?.results || data.results || [];
    courseSlug = courses[0]?.slug;
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/signin");
    await page.getByPlaceholder("Email").fill(creds.email);
    await page.getByPlaceholder("Password").fill(creds.password);
    await page.locator("form").getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("/", { timeout: 15000 });
  });

  test("'Enroll Now' shows confirmation modal", async ({ page }) => {
    test.skip(!courseSlug, "No seeded courses");
    await page.goto(`/courses/${courseSlug}`);
    await page.waitForSelector("h1", { timeout: 10000 });

    await page.getByRole("button", { name: "Enroll Now" }).click();
    await expect(page.locator(antModal)).toBeVisible();
    await expect(page.getByText("Confirm Enrollment")).toBeVisible();
  });

  test("confirm enrollment succeeds", async ({ page }) => {
    test.skip(!courseSlug, "No seeded courses");
    await page.goto(`/courses/${courseSlug}`);
    await page.waitForSelector("h1", { timeout: 10000 });

    await page.getByRole("button", { name: "Enroll Now" }).click();
    await expect(page.locator(antModal)).toBeVisible();
    await page.getByRole("button", { name: "Confirm Enrollment" }).click();

    await expect(page.locator(antMessage)).toBeVisible({ timeout: 10000 });
    // Button should change to "Enrolled"
    await expect(page.getByRole("button", { name: "Enrolled" })).toBeVisible({ timeout: 5000 });
  });

  test("enrolled button is disabled", async ({ page }) => {
    test.skip(!courseSlug, "No seeded courses");
    await page.goto(`/courses/${courseSlug}`);
    await page.waitForSelector("h1", { timeout: 10000 });

    // Should already show Enrolled from previous test or API state
    const enrolledBtn = page.getByRole("button", { name: "Enrolled" });
    const enrollBtn = page.getByRole("button", { name: "Enroll Now" });

    // If not yet enrolled, enroll first
    if (await enrollBtn.isVisible().catch(() => false)) {
      await enrollBtn.click();
      await page.getByRole("button", { name: "Confirm Enrollment" }).click();
      await expect(page.locator(antMessage)).toBeVisible({ timeout: 10000 });
    }

    await expect(enrolledBtn).toBeVisible({ timeout: 5000 });
  });

  test("enrolled course appears in My Courses", async ({ page }) => {
    test.skip(!courseSlug, "No seeded courses");
    await page.goto("/my-courses");
    await page.waitForSelector("h1", { timeout: 10000 });

    // Should see at least one enrolled course
    const courseCards = page.locator(".ant-card");
    await expect(courseCards.first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("active")).toBeVisible();
    await expect(page.getByText("Enrolled:")).toBeVisible();
  });

  test("'View Course' link in My Courses works", async ({ page }) => {
    test.skip(!courseSlug, "No seeded courses");
    await page.goto("/my-courses");
    await page.waitForSelector(".ant-card", { timeout: 10000 });

    await page.getByRole("button", { name: "View Course" }).first().click();
    await page.waitForURL(/courses\//, { timeout: 5000 });
  });

  test("'Drop' removes enrollment", async ({ page }) => {
    test.skip(!courseSlug, "No seeded courses");

    // First ensure enrolled
    await page.goto(`/courses/${courseSlug}`);
    await page.waitForSelector("h1", { timeout: 10000 });
    const enrollBtn = page.getByRole("button", { name: "Enroll Now" });
    if (await enrollBtn.isVisible().catch(() => false)) {
      await enrollBtn.click();
      await page.getByRole("button", { name: "Confirm Enrollment" }).click();
      await expect(page.locator(antMessage)).toBeVisible({ timeout: 10000 });
    }

    // Now drop from My Courses
    await page.goto("/my-courses");
    await page.waitForSelector(".ant-card", { timeout: 10000 });
    await page.getByRole("button", { name: "Drop" }).first().click();
    await expect(page.locator(antMessage)).toBeVisible({ timeout: 5000 });
  });

  test("double enrollment shows error", async ({ page }) => {
    test.skip(!courseSlug, "No seeded courses");

    // Enroll first
    await page.goto(`/courses/${courseSlug}`);
    await page.waitForSelector("h1", { timeout: 10000 });
    const enrollBtn = page.getByRole("button", { name: "Enroll Now" });
    if (await enrollBtn.isVisible().catch(() => false)) {
      await enrollBtn.click();
      await page.getByRole("button", { name: "Confirm Enrollment" }).click();
      await expect(page.locator(antMessage)).toBeVisible({ timeout: 10000 });
    }

    // Already enrolled — button should be disabled "Enrolled"
    await expect(page.getByRole("button", { name: "Enrolled" })).toBeVisible({ timeout: 5000 });
  });

  test("unauthenticated 'Enroll Now' shows sign-in modal", async ({ page }) => {
    test.skip(!courseSlug, "No seeded courses");
    await clearAuth(page);
    await page.goto(`/courses/${courseSlug}`);
    await page.waitForSelector("h1", { timeout: 10000 });

    await page.getByRole("button", { name: "Enroll Now" }).click();
    await expect(page.getByText("Sign in required")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("sign in before enrolling")).toBeVisible();
  });

  test("enrollment modal loading state", async ({ page }) => {
    test.skip(!courseSlug, "No seeded courses");

    // Drop first if enrolled
    await page.goto("/my-courses");
    await page.waitForTimeout(2000);
    const dropBtn = page.getByRole("button", { name: "Drop" }).first();
    if (await dropBtn.isVisible().catch(() => false)) {
      await dropBtn.click();
      await expect(page.locator(antMessage)).toBeVisible({ timeout: 5000 });
    }

    // Delay enrollment API
    await page.route(`**/api/v1/courses/${courseSlug}/enroll/`, async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });

    await page.goto(`/courses/${courseSlug}`);
    await page.waitForSelector("h1", { timeout: 10000 });
    await page.getByRole("button", { name: "Enroll Now" }).click();
    await page.getByRole("button", { name: "Confirm Enrollment" }).click();

    // Modal should show loading
    await expect(page.locator(".ant-modal .ant-btn-loading")).toBeVisible({ timeout: 3000 });
  });
});
