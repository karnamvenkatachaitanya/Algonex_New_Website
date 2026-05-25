import { test, expect } from "@playwright/test";
import { registerUser } from "../helpers/auth.helper.js";
import { antMessage } from "../helpers/selectors.js";

test.describe("Signup", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup");
  });

  test("signup page renders all elements", async ({ page }) => {
    await expect(page.getByPlaceholder("First name")).toBeVisible();
    await expect(page.getByPlaceholder("Last name")).toBeVisible();
    await expect(page.getByPlaceholder("Email")).toBeVisible();
    await expect(page.getByPlaceholder("Password", { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder("Confirm password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Account" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Google/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /GitHub/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
  });

  test("successful registration redirects to home", async ({ page }) => {
    const email = `auth_signup_${Date.now()}@test.com`;
    await page.getByPlaceholder("First name").fill("AuthTest");
    await page.getByPlaceholder("Last name").fill("Signup");
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Password", { exact: true }).fill("SecurePass123!");
    await page.getByPlaceholder("Confirm password").fill("SecurePass123!");
    await page.getByRole("button", { name: "Create Account" }).click();

    await page.waitForURL("/", { timeout: 15000 });
    // Navbar should show user avatar (not Sign In button)
    await expect(page.locator(".ant-avatar").first()).toBeVisible({ timeout: 5000 });
  });

  test("validation: empty fields prevent submission", async ({ page }) => {
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page.getByText("First name required")).toBeVisible();
    await expect(page.getByText("Last name required")).toBeVisible();
    await expect(page.getByText("Please enter your email")).toBeVisible();
    await expect(page.getByText("Please enter a password")).toBeVisible();
  });

  test("validation: invalid email format", async ({ page }) => {
    await page.getByPlaceholder("Email").fill("notanemail");
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page.getByText("Please enter a valid email")).toBeVisible();
  });

  test("validation: password too short", async ({ page }) => {
    await page.getByPlaceholder("Password", { exact: true }).fill("Ab1!");
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();
  });

  test("validation: mismatched passwords", async ({ page }) => {
    await page.getByPlaceholder("Password", { exact: true }).fill("SecurePass123!");
    await page.getByPlaceholder("Confirm password").fill("DifferentPass456!");
    await page.getByPlaceholder("Confirm password").blur();
    await expect(page.getByText("Passwords do not match")).toBeVisible();
  });

  test("validation: weak/common password rejected by backend", async ({ page }) => {
    const email = `auth_weak_${Date.now()}@test.com`;
    await page.getByPlaceholder("First name").fill("Weak");
    await page.getByPlaceholder("Last name").fill("Pass");
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Password", { exact: true }).fill("password1234");
    await page.getByPlaceholder("Confirm password").fill("password1234");
    await page.getByRole("button", { name: "Create Account" }).click();

    // Backend should reject common password
    await expect(page.locator(antMessage)).toBeVisible({ timeout: 10000 });
  });

  test("duplicate email shows backend error", async ({ page }) => {
    // Register first user via API to avoid navigation
    const email = `auth_dup_${Date.now()}@test.com`;
    await page.request.post("http://localhost:8000/api/v1/auth/register/", {
      data: { email, password1: "SecurePass123!", password2: "SecurePass123!", first_name: "Dup", last_name: "User" },
    });

    // Try to register again with same email on signup page
    await page.goto("/signup");
    await page.getByPlaceholder("First name").fill("Dup");
    await page.getByPlaceholder("Last name").fill("User");
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Password", { exact: true }).fill("SecurePass123!");
    await page.getByPlaceholder("Confirm password").fill("SecurePass123!");
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page.locator(antMessage)).toBeVisible({ timeout: 10000 });
  });

  test("OAuth buttons exist and are clickable", async ({ page }) => {
    const googleBtn = page.getByRole("button", { name: /Google/ });
    const githubBtn = page.getByRole("button", { name: /GitHub/ });
    await expect(googleBtn).toBeVisible();
    await expect(githubBtn).toBeVisible();
    await expect(googleBtn).toBeEnabled();
    await expect(githubBtn).toBeEnabled();
  });

  test("'Sign in' link navigates to /signin", async ({ page }) => {
    await page.getByRole("link", { name: "Sign in", exact: true }).click();
    await page.waitForURL(/signin/);
  });
});
