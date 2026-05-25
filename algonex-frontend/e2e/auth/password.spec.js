import { test, expect } from "@playwright/test";
import { antMessage, antResult } from "../helpers/selectors.js";

test.describe("Password Management", () => {
  test.describe("Forgot Password", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/forgot-password");
    });

    test("forgot password page renders", async ({ page }) => {
      await expect(page.getByText("Reset Password")).toBeVisible();
      await expect(page.getByPlaceholder("Email")).toBeVisible();
      await expect(page.getByRole("button", { name: "Send Reset Link" })).toBeVisible();
      await expect(page.getByText("Back to Sign In")).toBeVisible();
    });

    test("submit valid email shows success screen", async ({ page }) => {
      await page.getByPlaceholder("Email").fill(`auth_reset_${Date.now()}@test.com`);
      await page.getByRole("button", { name: "Send Reset Link" }).click();

      await expect(page.getByText("Check Your Email")).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("password reset instructions")).toBeVisible();
    });

    test("'Back to Sign In' link works from form", async ({ page }) => {
      await page.getByText("Back to Sign In").click();
      await page.waitForURL(/signin/);
    });

    test("'Back to Sign In' works from success screen", async ({ page }) => {
      await page.getByPlaceholder("Email").fill(`auth_back_${Date.now()}@test.com`);
      await page.getByRole("button", { name: "Send Reset Link" }).click();
      await expect(page.getByText("Check Your Email")).toBeVisible({ timeout: 10000 });

      await page.getByRole("button", { name: "Back to Sign In" }).click();
      await page.waitForURL(/signin/);
    });

    test("submit invalid email format shows error", async ({ page }) => {
      await page.getByPlaceholder("Email").fill("notanemail");
      await page.getByRole("button", { name: "Send Reset Link" }).click();
      await expect(page.getByText("Please enter a valid email")).toBeVisible();
    });
  });

  test.describe("Set Password", () => {
    test("missing token/uid shows error page", async ({ page }) => {
      await page.goto("/set-password");
      await expect(page.getByText("Invalid Link")).toBeVisible();
      await expect(page.getByText("missing required information")).toBeVisible();
      await expect(page.getByRole("button", { name: "Go to Sign In" })).toBeVisible();
    });

    test("valid params show password form", async ({ page }) => {
      await page.goto("/set-password?token=faketoken&uid=fakeuid");
      await expect(page.getByText("Set Your Password")).toBeVisible();
      await expect(page.getByPlaceholder("Enter password")).toBeVisible();
      await expect(page.getByPlaceholder("Confirm password")).toBeVisible();
      await expect(page.getByRole("button", { name: "Set Password" })).toBeVisible();
    });

    test("mismatched passwords show error", async ({ page }) => {
      await page.goto("/set-password?token=t&uid=u");
      await page.getByPlaceholder("Enter password").fill("SecurePass123!");
      await page.getByPlaceholder("Confirm password").fill("DifferentPass!");
      await page.getByPlaceholder("Confirm password").blur();
      await expect(page.getByText("Passwords do not match")).toBeVisible();
    });
  });
});
