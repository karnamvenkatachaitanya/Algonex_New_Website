import { test, expect } from "@playwright/test";
import { registerUser } from "../helpers/auth.helper.js";

test.describe("Token Refresh & Session Management", () => {
  test("expired access token auto-refreshes on API call", async ({ page }) => {
    const creds = await registerUser(page, { prefix: "auth_token_refresh" });

    // Get current refresh token (valid)
    const tokens = await page.evaluate(() => ({
      access: localStorage.getItem("access_token"),
      refresh: localStorage.getItem("refresh_token"),
    }));

    // Set an invalid access token but keep the valid refresh token
    await page.evaluate(() => {
      localStorage.setItem("access_token", "expired_invalid_token");
    });

    // Navigate to a page that makes an API call
    await page.goto("/my-courses");

    // Should auto-refresh and load (not redirect to signin)
    await page.waitForSelector("h1", { timeout: 15000 });
    await expect(page.getByText("My Courses")).toBeVisible();

    // Access token should be updated
    const newAccess = await page.evaluate(() => localStorage.getItem("access_token"));
    expect(newAccess).not.toBe("expired_invalid_token");
  });

  test("expired refresh token redirects to signin", async ({ page }) => {
    await page.goto("/");
    // Set both tokens to invalid values
    await page.evaluate(() => {
      localStorage.setItem("access_token", "invalid");
      localStorage.setItem("refresh_token", "invalid");
    });

    await page.goto("/my-courses");
    await page.waitForURL(/signin/, { timeout: 15000 });
  });

  test("app load with valid token loads user", async ({ page }) => {
    const creds = await registerUser(page, { prefix: "auth_token_load" });

    // Reload page
    await page.reload();

    // User should still be visible in navbar
    await expect(page.locator(".ant-avatar").first()).toBeVisible({ timeout: 10000 });
  });

  test("app load with invalid token gracefully logs out", async ({ page }) => {
    await page.goto("/");
    // Set garbage token with no refresh
    await page.evaluate(() => {
      localStorage.setItem("access_token", "garbage_token");
      localStorage.removeItem("refresh_token");
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    // Should show Sign In (graceful fallback, no crash)
    await expect(page.getByRole("link", { name: "Sign In" }).or(page.getByRole("button", { name: "Sign In" }))).toBeVisible({ timeout: 15000 });
  });
});
