import { test, expect } from "@playwright/test";

test.describe("OAuth Callback", () => {
  test("missing code and state shows error page", async ({ page }) => {
    await page.goto("/auth/callback");
    await expect(page.getByText("Login Failed")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("No authorization code received")).toBeVisible();
    await expect(page.getByText("Back to Sign In")).toBeVisible();
  });

  test("missing code with state shows error", async ({ page }) => {
    await page.goto("/auth/callback?state=google");
    await expect(page.getByText("Login Failed")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("No authorization code received")).toBeVisible();
  });

  test("invalid OAuth code shows error after API call", async ({ page }) => {
    // Intercept any POST to auth/google endpoint
    await page.route("**/**/auth/google/**", (route) => {
      if (route.request().method() === "POST") {
        return route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ error: { message: "Invalid code" } }) });
      }
      return route.continue();
    });

    await page.goto("/auth/callback?code=invalidcode&state=google");
    await expect(page.getByText("Login Failed")).toBeVisible({ timeout: 10000 });
  });

  test("loading spinner shown during token exchange", async ({ page }) => {
    // Delay the API response
    await page.route("**/auth/google/**", async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({}) });
    });
    await page.route("**/auth/google/", async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({}) });
    });

    await page.goto("/auth/callback?code=abc&state=google");
    // The Spin component renders the tip text
    await expect(page.locator(".ant-spin")).toBeVisible({ timeout: 3000 });
  });

  test("'Back to Sign In' button navigates to /signin", async ({ page }) => {
    await page.goto("/auth/callback");
    await expect(page.getByText("Login Failed")).toBeVisible({ timeout: 5000 });
    await page.getByText("Back to Sign In").click();
    await page.waitForURL(/signin/);
  });
});
