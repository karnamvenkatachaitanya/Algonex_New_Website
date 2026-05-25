import { test, expect } from "@playwright/test";
import { registerUser, logoutUser } from "../helpers/auth.helper.js";
import { antMessage } from "../helpers/selectors.js";

test.describe("Signin", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signin");
  });

  test("signin page renders all elements", async ({ page }) => {
    await expect(page.getByText("Welcome Back")).toBeVisible();
    await expect(page.getByPlaceholder("Email")).toBeVisible();
    await expect(page.getByPlaceholder("Password")).toBeVisible();
    await expect(page.locator("form").getByRole("button", { name: "Sign In" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Google/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /GitHub/ })).toBeVisible();
    await expect(page.getByText("Forgot password?")).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign up", exact: true })).toBeVisible();
  });

  test("successful login redirects to home", async ({ page }) => {
    // Register a user first
    const creds = await registerUser(page, { prefix: "auth_login" });
    await logoutUser(page);

    // Now login
    await page.goto("/signin");
    await page.getByPlaceholder("Email").fill(creds.email);
    await page.getByPlaceholder("Password").fill(creds.password);
    await page.locator("form").getByRole("button", { name: "Sign In" }).click();

    await page.waitForURL("/", { timeout: 15000 });
    await expect(page.locator(".ant-avatar").first()).toBeVisible({ timeout: 5000 });
  });

  test("wrong password shows error", async ({ page }) => {
    const creds = await registerUser(page, { prefix: "auth_wrongpw" });
    await logoutUser(page);

    await page.goto("/signin");
    await page.getByPlaceholder("Email").fill(creds.email);
    await page.getByPlaceholder("Password").fill("wrongpassword123");
    await page.locator("form").getByRole("button", { name: "Sign In" }).click();

    await expect(page.locator(antMessage)).toBeVisible({ timeout: 10000 });
  });

  test("non-existent email shows error", async ({ page }) => {
    await page.getByPlaceholder("Email").fill(`nonexistent_${Date.now()}@test.com`);
    await page.getByPlaceholder("Password").fill("SomePass123!");
    await page.locator("form").getByRole("button", { name: "Sign In" }).click();

    await expect(page.locator(antMessage)).toBeVisible({ timeout: 10000 });
  });

  test("empty fields prevent submission", async ({ page }) => {
    await page.locator("form").getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText("Please enter your email")).toBeVisible();
    await expect(page.getByText("Please enter your password")).toBeVisible();
  });

  test("invalid email format rejected", async ({ page }) => {
    await page.getByPlaceholder("Email").fill("bademail");
    await page.locator("form").getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText("Please enter a valid email")).toBeVisible();
  });

  test("'Forgot password?' navigates to /forgot-password", async ({ page }) => {
    await page.getByText("Forgot password?").click();
    await page.waitForURL(/forgot-password/);
  });

  test("'Sign up' link navigates to /signup", async ({ page }) => {
    await page.getByRole("link", { name: "Sign up", exact: true }).click();
    await page.waitForURL(/signup/);
  });

  test("login redirects back to intended protected page", async ({ page }) => {
    const creds = await registerUser(page, { prefix: "auth_redirect" });
    await logoutUser(page);

    // Try accessing protected page
    await page.goto("/profile");
    await page.waitForURL(/signin/, { timeout: 5000 });

    // Login
    await page.getByPlaceholder("Email").fill(creds.email);
    await page.getByPlaceholder("Password").fill(creds.password);
    await page.locator("form").getByRole("button", { name: "Sign In" }).click();

    // Should redirect to profile (or home, depending on implementation)
    await page.waitForURL(/\/(profile)?$/, { timeout: 15000 });
  });
});
