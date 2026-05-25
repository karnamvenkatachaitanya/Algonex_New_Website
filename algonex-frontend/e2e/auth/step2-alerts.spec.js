import { test, expect } from "@playwright/test";
import { registerUser } from "../helpers/auth.helper.js";

test.describe("Registration Step 2 Alert Banners", () => {
  test("existing user with password shows warning alert", async ({ page }) => {
    // Register a full account via /signup (has password)
    const creds = await registerUser(page, { prefix: "auth_s2_pw" });

    // Now go to /register and use the same email
    await page.goto("/register");
    await page.getByPlaceholder("First name").fill("Alert");
    await page.getByPlaceholder("Last name").fill("Test");
    await page.getByPlaceholder("you@example.com").fill(creds.email);
    await page.getByPlaceholder("+91 98765 43210").fill("9876543210");
    await page.getByRole("button", { name: /Continue/ }).click();

    // Should show step 2 with warning alert
    await expect(page.getByPlaceholder("Bangalore")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("You already have an account with a password")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("sign in")).toBeVisible();
  });

  test("existing user without password shows info alert", async ({ page }) => {
    // Register via /register (step 1 only, no password)
    const email = `auth_s2_nopw_${Date.now()}@test.com`;
    await page.goto("/register");
    await page.getByPlaceholder("First name").fill("NoPw");
    await page.getByPlaceholder("Last name").fill("Test");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("+91 98765 43210").fill("9876543210");
    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page.getByPlaceholder("Bangalore")).toBeVisible({ timeout: 10000 });

    // Go back and re-register with same email
    await page.goto("/register");
    await page.getByPlaceholder("First name").fill("NoPw");
    await page.getByPlaceholder("Last name").fill("Test");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("+91 98765 43210").fill("9876543210");
    await page.getByRole("button", { name: /Continue/ }).click();

    await expect(page.getByPlaceholder("Bangalore")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Welcome back! We found your email")).toBeVisible({ timeout: 5000 });
  });

  test("alert sign-in link navigates to /signin", async ({ page }) => {
    const creds = await registerUser(page, { prefix: "auth_s2_link" });

    await page.goto("/register");
    await page.getByPlaceholder("First name").fill("Link");
    await page.getByPlaceholder("Last name").fill("Test");
    await page.getByPlaceholder("you@example.com").fill(creds.email);
    await page.getByPlaceholder("+91 98765 43210").fill("9876543210");
    await page.getByRole("button", { name: /Continue/ }).click();

    await expect(page.getByText("You already have an account with a password")).toBeVisible({ timeout: 10000 });

    // Click the sign in link within the alert
    await page.locator(".ant-alert").getByText("sign in").click();
    await page.waitForURL(/signin/);
  });
});
