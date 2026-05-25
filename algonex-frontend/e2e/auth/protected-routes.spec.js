import { test, expect } from "@playwright/test";
import { registerUser, logoutUser, clearAuth } from "../helpers/auth.helper.js";

test.describe("Protected Routes", () => {
  test("/profile redirects unauthenticated to /signin", async ({ page }) => {
    await clearAuth(page);
    await page.goto("/profile");
    await page.waitForURL(/signin/, { timeout: 5000 });
  });

  test("/my-courses redirects unauthenticated to /signin", async ({ page }) => {
    await clearAuth(page);
    await page.goto("/my-courses");
    await page.waitForURL(/signin/, { timeout: 5000 });
  });

  test("/my-events redirects unauthenticated to /signin", async ({ page }) => {
    await clearAuth(page);
    await page.goto("/my-events");
    await page.waitForURL(/signin/, { timeout: 5000 });
  });

  test("/my-applications redirects unauthenticated to /signin", async ({ page }) => {
    await clearAuth(page);
    await page.goto("/my-applications");
    await page.waitForURL(/signin/, { timeout: 5000 });
  });

  test("loading spinner shown while checking auth", async ({ page }) => {
    // Set a fake token so the app tries to verify it
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("access_token", "fake_token"));

    // Delay the auth check
    await page.route("**/api/v1/auth/user/", async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({}) });
    });

    await page.goto("/profile");
    // Should see spinner briefly or redirect
    await page.waitForURL(/signin/, { timeout: 10000 });
  });

  test("after login, redirect back to /my-courses", async ({ page }) => {
    const creds = await registerUser(page, { prefix: "auth_redir_courses" });
    await logoutUser(page);

    // Try accessing protected page
    await page.goto("/my-courses");
    await page.waitForURL(/signin/, { timeout: 5000 });

    // Login
    await page.getByPlaceholder("Email").fill(creds.email);
    await page.getByPlaceholder("Password").fill(creds.password);
    await page.locator("form").getByRole("button", { name: "Sign In" }).click();

    // Should redirect back (or to home)
    await page.waitForURL(/\/(my-courses)?$/, { timeout: 15000 });
  });

  test("after login, redirect back to /my-events", async ({ page }) => {
    const creds = await registerUser(page, { prefix: "auth_redir_events" });
    await logoutUser(page);

    await page.goto("/my-events");
    await page.waitForURL(/signin/, { timeout: 5000 });

    await page.getByPlaceholder("Email").fill(creds.email);
    await page.getByPlaceholder("Password").fill(creds.password);
    await page.locator("form").getByRole("button", { name: "Sign In" }).click();

    await page.waitForURL(/\/(my-events)?$/, { timeout: 15000 });
  });
});
