import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = "SecurePass123!";

  test("signup page loads", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByText("Create Account")).toBeVisible();
  });

  test("signin page loads", async ({ page }) => {
    await page.goto("/signin");
    await expect(page.getByText("Welcome Back")).toBeVisible();
  });

  test("can register a new account", async ({ page }) => {
    await page.goto("/signup");

    await page.getByPlaceholder("First name").fill("Test");
    await page.getByPlaceholder("Last name").fill("User");
    await page.getByPlaceholder("Email").fill(testEmail);
    await page.getByPlaceholder("Password", { exact: true }).fill(testPassword);
    await page.getByPlaceholder("Confirm password").fill(testPassword);

    await page.getByRole("button", { name: "Create Account" }).click();

    // Should redirect to home after successful registration
    await page.waitForURL("/", { timeout: 10000 });
  });

  test("can login with existing account", async ({ page }) => {
    // First register
    await page.goto("/signup");
    const email = `login_${Date.now()}@example.com`;
    await page.getByPlaceholder("First name").fill("Login");
    await page.getByPlaceholder("Last name").fill("Test");
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Password", { exact: true }).fill(testPassword);
    await page.getByPlaceholder("Confirm password").fill(testPassword);
    await page.getByRole("button", { name: "Create Account" }).click();
    await page.waitForURL("/", { timeout: 10000 });

    // Logout (if there's a logout mechanism)
    // Then login
    await page.goto("/signin");
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Password").fill(testPassword);
    await page.getByRole("button", { name: "Sign In" }).click();

    await page.waitForURL("/", { timeout: 10000 });
  });

  test("login with wrong password shows error", async ({ page }) => {
    await page.goto("/signin");
    await page.getByPlaceholder("Email").fill("wrong@example.com");
    await page.getByPlaceholder("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    // Should show error message (ant design message component)
    await expect(page.locator(".ant-message")).toBeVisible({ timeout: 5000 });
  });

  test("protected route redirects to signin", async ({ page }) => {
    await page.goto("/profile");
    // Should redirect to signin
    await page.waitForURL(/signin/, { timeout: 5000 });
  });
});
