import { test, expect } from "@playwright/test";
import { registerUser } from "../helpers/auth.helper.js";

test.describe("Empty States for User Data Pages", () => {
  // Fresh user with no enrollments/registrations/applications
  let creds;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    creds = await registerUser(page, { prefix: "auth_empty" });
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/signin");
    await page.getByPlaceholder("Email").fill(creds.email);
    await page.getByPlaceholder("Password").fill(creds.password);
    await page.locator("form").getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("/", { timeout: 15000 });
  });

  test("My Courses: empty state with CTA", async ({ page }) => {
    await page.goto("/my-courses");
    await page.waitForSelector("h1", { timeout: 10000 });

    await expect(page.getByText("You haven't enrolled in any courses yet.")).toBeVisible({ timeout: 5000 });
    const browseBtn = page.getByRole("button", { name: "Browse Courses" });
    await expect(browseBtn).toBeVisible();
    await browseBtn.click();
    await page.waitForURL(/allcourses|courses/);
  });

  test("My Events: empty state with CTA", async ({ page }) => {
    await page.goto("/my-events");
    await page.waitForSelector("h1", { timeout: 10000 });

    await expect(page.getByText("You haven't registered for any events yet.")).toBeVisible({ timeout: 5000 });
    const browseBtn = page.getByRole("button", { name: "Browse Events" });
    await expect(browseBtn).toBeVisible();
    await browseBtn.click();
    await page.waitForURL(/events/);
  });

  test("My Applications: empty state with CTA", async ({ page }) => {
    await page.goto("/my-applications");
    await page.waitForSelector("h1", { timeout: 10000 });

    await expect(page.getByText("You haven't applied to any positions yet.")).toBeVisible({ timeout: 5000 });
    const browseBtn = page.getByRole("button", { name: "Browse Jobs" });
    await expect(browseBtn).toBeVisible();
    await browseBtn.click();
    await page.waitForURL(/careers/);
  });
});
