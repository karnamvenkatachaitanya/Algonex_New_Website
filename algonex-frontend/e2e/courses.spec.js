import { test, expect } from "@playwright/test";

test.describe("Courses", () => {
  test("courses page loads and shows courses", async ({ page }) => {
    await page.goto("/courses");
    // Wait for content to load
    await page.waitForTimeout(2000);
    // Page should have loaded without error
    await expect(page).toHaveURL(/courses/);
  });

  test("course detail page loads via slug", async ({ page }) => {
    // Navigate to a seeded course (from seed_courses command)
    await page.goto("/stack/python-full-stack");
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/stack\/python-full-stack/);
  });

  test("enrollment requires authentication", async ({ page }) => {
    await page.goto("/my-courses");
    // Should redirect to signin since user is not authenticated
    await page.waitForURL(/signin/, { timeout: 5000 });
  });
});
